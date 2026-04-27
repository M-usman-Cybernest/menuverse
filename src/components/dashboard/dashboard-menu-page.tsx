"use client";

import {
  ImagePlus,
  Layers3,
  Package,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import {
  API_DASHBOARD_UPLOAD,
  API_GOOGLE_STATUS,
} from "@/lib/api-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import type { ItemAssetTarget } from "@/lib/storage";
import { hasArAsset } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";

const GOOGLE_CONNECT_PAGE = "/dashboard/google-connect";

type CategoryForm = { name: string; description: string };
type ItemForm = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  arModelUrl: string;
  arModelIosUrl: string;
  categoryId: string;
};

type UploadMode = "local" | "google-drive";
type UploadKind = "image" | "model";

const EMPTY_CATEGORY: CategoryForm = { name: "", description: "" };
const EMPTY_ITEM: ItemForm = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  arModelUrl: "",
  arModelIosUrl: "",
  categoryId: "",
};

export function DashboardMenuPage() {
  const router = useRouter();
  const {
    availableTags,
    categories,
    deleteCategory,
    deleteItem,
    items,
    saveCategory,
    saveError,
    saveItem,
    saveRestaurant,
    saveSuccess,
    saving,
    toggleItemTag,
  } = useDashboard();

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM);
  const [editItemId, setEditItemId] = useState<string | null>(null);

  const [storageError, setStorageError] = useState("");
  const [driveError, setDriveError] = useState("");
  const [driveNeedsAuth, setDriveNeedsAuth] = useState(false);
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [checkingGoogleDriveStatus, setCheckingGoogleDriveStatus] =
    useState(true);
  const [redirectingToGoogleConnect, setRedirectingToGoogleConnect] =
    useState(false);

  const [imageError, setImageError] = useState("");
  const [modelError, setModelError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const redirectTimeoutRef = useRef<number | null>(null);

  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [tagEditorItemId, setTagEditorItemId] = useState<string | null>(null);

  const applyAssetToItem = useCallback(
    (asset: { target: ItemAssetTarget; url: string }) => {
      setItemForm((previous) => ({
        ...previous,
        [asset.target]: asset.url,
      }));
    },
    [],
  );

  const loadGoogleDriveStatus = useCallback(async () => {
    setCheckingGoogleDriveStatus(true);

    try {
      const response = await fetch(API_GOOGLE_STATUS);
      const payload = (await response.json()) as
        | { configured: boolean; connected: boolean; message?: string }
        | { message?: string };

      if (!response.ok || !("connected" in payload)) {
        throw new Error(
          "message" in payload && payload.message
            ? payload.message
            : "Could not check the Google account connection.",
        );
      }

      setGoogleDriveConnected(payload.connected);
      setDriveNeedsAuth(!payload.connected);
      setRedirectingToGoogleConnect(false);

      if (payload.connected) {
        setDriveError("");
        setStorageError("");
      } else if (payload.message) {
        setDriveError(payload.message);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not check the Google account connection.";
      setGoogleDriveConnected(false);
      setDriveNeedsAuth(true);
      setDriveError(message);
    } finally {
      setCheckingGoogleDriveStatus(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGoogleDriveStatus();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [loadGoogleDriveStatus]);

  const filteredItems =
    filterCategoryId === "all"
      ? items
      : items.filter((item) => item.categoryId === filterCategoryId);

  const redirectToGoogleConnect = useCallback(
    (message: string) => {
      setDriveNeedsAuth(true);
      setGoogleDriveConnected(false);
      setRedirectingToGoogleConnect(true);
      setDriveError(message);
      setStorageError(message);

      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }

      redirectTimeoutRef.current = window.setTimeout(() => {
        router.push(GOOGLE_CONNECT_PAGE);
      }, 2000);
    },
    [router],
  );

  const ensureGoogleDriveConnected = useCallback(
    (message: string) => {
      if (googleDriveConnected) {
        return true;
      }

      if (checkingGoogleDriveStatus) {
        setDriveError("Checking your Google account status. Please wait a moment.");
        return false;
      }

      redirectToGoogleConnect(`${message} Redirecting to Google Connect...`);
      return false;
    },
    [checkingGoogleDriveStatus, googleDriveConnected, redirectToGoogleConnect],
  );

  const uploadFile = useCallback(
    async (file: File, type: UploadKind, uploadMode: UploadMode) => {
      if (
        uploadMode === "google-drive" &&
        !ensureGoogleDriveConnected(
          "Connect your Google account before uploading files to Google Drive.",
        )
      ) {
        return;
      }

      const setter = type === "image" ? setUploading : setUploadingModel;
      const errorSetter = type === "image" ? setImageError : setModelError;

      setter(true);
      errorSetter("");
      setStorageError("");
      setDriveError("");

      try {
        const target = getTargetForUpload(type, file);
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "provider",
          uploadMode === "google-drive" ? "google-drive" : "local",
        );
        formData.append("target", target);

        const response = await fetch(API_DASHBOARD_UPLOAD, {
          body: formData,
          method: "POST",
        });

        let result;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          result = await response.json();
        } else {
          const text = await response.text();
          if (response.status === 413 || text.includes("Too Large")) {
            throw new Error("File is too large for the local server. Try uploading to Google Drive instead.");
          }
          result = { message: text };
        }

        if (!response.ok || !result?.url) {
          if (result?.needsAuth) {
            redirectToGoogleConnect(
              "Connect your Google account before uploading files to Google Drive.",
            );
          }

          throw new Error(result?.message || "Upload failed.");
        }

        applyAssetToItem({
          target,
          url: result.url,
        });

        if (uploadMode === "google-drive") {
          setGoogleDriveConnected(true);
          setDriveNeedsAuth(false);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed. Please retry.";
        const errorSetter = type === "image" ? setImageError : setModelError;
        errorSetter(message);
        setStorageError(message);
      } finally {
        setter(false);
      }
    },
    [applyAssetToItem, ensureGoogleDriveConnected, redirectToGoogleConnect],
  );

  function openAddCategory() {
    setCatForm(EMPTY_CATEGORY);
    setEditCatId(null);
    setCatModalOpen(true);
  }

  function openEditCategory(categoryId: string) {
    const category = categories.find((entry) => entry.id === categoryId);
    if (!category) {
      return;
    }

    setCatForm({
      description: category.description,
      name: category.name,
    });
    setEditCatId(categoryId);
    setCatModalOpen(true);
  }

  async function submitCategory() {
    if (!catForm.name.trim()) {
      return;
    }

    const success = await saveCategory(editCatId, {
      description: catForm.description.trim(),
      name: catForm.name.trim(),
    });

    if (success) {
      setCatModalOpen(false);
      setCatForm(EMPTY_CATEGORY);
    }
  }

  function openAddItem() {
    setStorageError("");
    setDriveError("");
    setItemForm({
      ...EMPTY_ITEM,
      categoryId: categories[0]?.id ?? "",
    });
    setEditItemId(null);
    setItemModalOpen(true);
  }

  function openEditItem(itemId: string) {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) {
      return;
    }

    setStorageError("");
    setDriveError("");
    setItemForm({
      arModelIosUrl: item.arModelIosUrl ?? "",
      arModelUrl: item.arModelUrl ?? "",
      categoryId: item.categoryId,
      description: item.description,
      imageUrl: item.imageUrl,
      name: item.name,
      price: item.price,
    });
    setEditItemId(itemId);
    setItemModalOpen(true);
  }

  async function submitItem() {
    if (!itemForm.name.trim() || !itemForm.categoryId) {
      return;
    }

    if (
      !editItemId &&
      !ensureGoogleDriveConnected(
        "Connect your Google account before adding a new item.",
      )
    ) {
      return;
    }

    const success = await saveItem(editItemId, {
      arModelIosUrl: itemForm.arModelIosUrl || undefined,
      arModelUrl: itemForm.arModelUrl || undefined,
      categoryId: itemForm.categoryId,
      description: itemForm.description.trim(),
      imageUrl: itemForm.imageUrl || undefined,
      name: itemForm.name.trim(),
      price: itemForm.price,
    });

    if (success) {
      setItemModalOpen(false);
      setItemForm(EMPTY_ITEM);
    }
  }

  function getCategoryName(categoryId: string) {
    return categories.find((category) => category.id === categoryId)?.name ?? "-";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">Menu Builder</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Categories & Items
          </h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddCategory} size="sm" variant="outline">
            <Layers3 className="h-4 w-4" />
            Add Category
          </Button>
          <Button
            disabled={categories.length === 0}
            onClick={openAddItem}
            size="sm"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
          <Button disabled={saving} onClick={() => void saveRestaurant()} size="sm">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {saveError ? (
        <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
          {saveError}
        </Badge>
      ) : null}
      {saveSuccess ? <Badge variant="accent">{saveSuccess}</Badge> : null}

      {categories.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-4 w-4 text-[#0f766e]" />
              Categories
            </CardTitle>
            <CardDescription>
              {categories.length} categories - click to edit, or manage below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="group flex items-center gap-1.5 rounded-lg border border-[#e7dfd2] bg-[#fffcf8] px-3 py-2 text-sm transition hover:border-[#0f766e]/30 hover:bg-[#f7f3eb]"
                >
                  <span className="font-medium text-[#111827]">{category.name}</span>
                  <Badge className="px-1.5 py-0 text-[10px]" variant="accent">
                    {items.filter((item) => item.categoryId === category.id).length}
                  </Badge>
                  <button
                    className="ml-1 rounded p-0.5 text-[#9ca3af] opacity-0 transition hover:text-[#0f766e] group-hover:opacity-100"
                    onClick={() => openEditCategory(category.id)}
                    type="button"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {categories.length > 1 ? (
                    <button
                      className="rounded p-0.5 text-[#9ca3af] opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                      onClick={() => void deleteCategory(category.id)}
                      type="button"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#0f766e]" />
                All Menu Items
              </CardTitle>
              <CardDescription>
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} in
                your menu
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#6b7280]">Filter:</span>
              <select
                className="rounded-md border border-[#e7dfd2] bg-[#fffcf8] px-3 py-1.5 text-sm text-[#111827] outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
                onChange={(event) => setFilterCategoryId(event.target.value)}
                value={filterCategoryId}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-t border-[#e7dfd2] bg-[#faf7f2]">
                    <th className="px-5 py-3 text-left font-medium text-[#6b7280]">
                      Image
                    </th>
                    <th className="px-5 py-3 text-left font-medium text-[#6b7280]">
                      Name
                    </th>
                    <th className="hidden px-5 py-3 text-left font-medium text-[#6b7280] sm:table-cell">
                      Category
                    </th>
                    <th className="px-5 py-3 text-left font-medium text-[#6b7280]">
                      Price
                    </th>
                    <th className="hidden px-5 py-3 text-left font-medium text-[#6b7280] md:table-cell">
                      Description
                    </th>
                    <th className="px-5 py-3 text-center font-medium text-[#6b7280]">
                      AR
                    </th>
                    <th className="hidden px-5 py-3 text-left font-medium text-[#6b7280] lg:table-cell">
                      Tags
                    </th>
                    <th className="px-5 py-3 text-right font-medium text-[#6b7280]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#ece4d8] transition hover:bg-[#fffcf8]"
                    >
                      <td className="px-5 py-2">
                        <div className="relative h-11 w-14 overflow-hidden rounded-md border border-[#ece4d8] bg-white">
                          <Image
                            alt={item.name}
                            className="object-cover"
                            fill
                            sizes="56px"
                            src={item.imageUrl}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-[#111827]">
                        {item.name}
                      </td>
                      <td className="hidden px-5 py-3 sm:table-cell">
                        <Badge className="text-[11px]" variant="default">
                          {getCategoryName(item.categoryId)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#0f766e]">
                        {formatPrice(item.price)}
                      </td>
                      <td className="hidden px-5 py-3 text-[#6b7280] md:table-cell">
                        <span className="line-clamp-1">{item.description}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {hasArAsset(item) ? (
                          <Badge variant="accent">3D</Badge>
                        ) : (
                          <span className="text-xs text-[#d9cdbb]">-</span>
                        )}
                      </td>
                      <td className="hidden px-5 py-3 lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {item.dietaryTags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              className="text-[10px]"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.dietaryTags.length > 2 ? (
                            <Badge className="text-[10px]">
                              +{item.dietaryTags.length - 2}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            className="h-8 w-8"
                            onClick={() =>
                              setTagEditorItemId(
                                tagEditorItemId === item.id ? null : item.id,
                              )
                            }
                            size="icon"
                            title="Edit tags"
                            variant="ghost"
                          >
                            <Layers3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            className="h-8 w-8"
                            onClick={() => openEditItem(item.id)}
                            size="icon"
                            variant="ghost"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => void deleteItem(item.id)}
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mx-5 mb-5 mt-2 rounded-lg border border-dashed border-[#d9cdbb] bg-[#fffcf8] p-8 text-center text-sm text-[#6b7280]">
              {categories.length === 0
                ? 'No categories yet. Click "Add Category" first, then add items.'
                : 'No items yet. Click "Add Item" to get started.'}
            </div>
          )}
        </CardContent>

        {tagEditorItemId ? (
          <div className="border-t border-[#e7dfd2] px-5 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
              Tags for: {items.find((item) => item.id === tagEditorItemId)?.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const item = items.find((entry) => entry.id === tagEditorItemId);
                const active = item?.dietaryTags.includes(tag) ?? false;

                return (
                  <button
                    key={tag}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-[#0f766e] text-white"
                        : "bg-[#f2ede2] text-[#6b7280] hover:bg-[#e7dfd2]"
                    }`}
                    onClick={() => toggleItemTag(tagEditorItemId, tag)}
                    type="button"
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </Card>

      <Modal
        description={
          editCatId
            ? "Update the category details."
            : "Create a new menu category."
        }
        onClose={() => setCatModalOpen(false)}
        open={catModalOpen}
        title={editCatId ? "Edit Category" : "New Category"}
      >
        <div className="space-y-4">
          <Field label="Category Name">
            <Input
              autoFocus
              onChange={(event) =>
                setCatForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. Starters, Mains, Desserts..."
              value={catForm.name}
            />
          </Field>
          <Field label="Description">
            <Textarea
              onChange={(event) =>
                setCatForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              placeholder="A short description of this section..."
              rows={3}
              value={catForm.description}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setCatModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button disabled={!catForm.name.trim()} onClick={submitCategory}>
              {editCatId ? "Update" : "Create Category"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        description={
          editItemId
            ? "Update item details, image, and 3D model."
            : "Add a new item with image and optional 3D model."
        }
        maxWidth="max-w-3xl"
        onClose={() => setItemModalOpen(false)}
        open={itemModalOpen}
        title={editItemId ? "Edit Menu Item" : "New Menu Item"}
      >
        <div className="space-y-5">
          {storageError ? (
            <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
              {storageError}
            </Badge>
          ) : null}

          <div className="rounded-xl border border-[#dbe7e4] bg-[#f7fbfa] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0f766e]">
                  Google account
                </p>
                <p className="text-sm text-[#4b5563]">
                  {checkingGoogleDriveStatus
                    ? "Checking the Google Drive connection for this admin session."
                    : googleDriveConnected
                      ? "Connected. You can add items and upload menu assets to Google Drive."
                      : "Connect your Google account before adding a new item. If you continue without it, you'll be redirected here in 2 seconds."}
                </p>
              </div>
              <Button
                onClick={() => router.push(GOOGLE_CONNECT_PAGE)}
                size="sm"
                variant={driveNeedsAuth ? "default" : "outline"}
              >
                {googleDriveConnected ? "Manage Connection" : "Open Google Connect"}
              </Button>
            </div>
            {redirectingToGoogleConnect || driveError ? (
              <p className="mt-3 text-sm text-[#b45309]">{driveError}</p>
            ) : null}
          </div>

          <Field label="Category">
            <select
              className="w-full rounded-md border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
              onChange={(event) =>
                setItemForm((previous) => ({
                  ...previous,
                  categoryId: event.target.value,
                }))
              }
              value={itemForm.categoryId}
            >
              <option disabled value="">
                Select a category...
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Item Image">
            <div className="flex flex-col gap-4 rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-4 lg:flex-row">
              {itemForm.imageUrl ? (
                <div className="relative h-32 w-full overflow-hidden rounded-lg border border-[#ece4d8] bg-white lg:w-44">
                  <Image
                    alt="Item preview"
                    className="object-cover"
                    fill
                    sizes="176px"
                    src={itemForm.imageUrl}
                  />
                </div>
              ) : null}
              <div className="flex-1">
                <input
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      void uploadFile(file, "image", "google-drive");
                    }
                    event.target.value = "";
                  }}
                  ref={imageInputRef}
                  type="file"
                />
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d9cdbb] bg-white px-4 py-6 text-sm text-[#6b7280] transition hover:border-[#0f766e] hover:bg-[#f7f3eb]"
                  disabled={uploading}
                  onClick={() => {
                    if (
                      ensureGoogleDriveConnected(
                        "Connect your Google account before uploading images.",
                      )
                    ) {
                      imageInputRef.current?.click();
                    }
                  }}
                  type="button"
                >
                  {uploading ? (
                    <span className="animate-pulse">Uploading to Google Drive...</span>
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5" />
                      <span>Upload image to Google Drive</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <Input
              className="mt-3"
              onChange={(event) =>
                setItemForm((previous) => ({
                  ...previous,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="https://drive.google.com/file/d/... or direct image URL"
              value={itemForm.imageUrl}
            />
            {imageError && (
              <p className="mt-2 text-xs font-medium text-[#c2410c]">
                {imageError}
              </p>
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Item Name">
              <Input
                onChange={(event) =>
                  setItemForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Classic Burger"
                value={itemForm.name}
              />
            </Field>
            <Field label="Price ($)">
              <Input
                min={0}
                onChange={(event) =>
                  setItemForm((previous) => ({
                    ...previous,
                    price: Number(event.target.value || 0),
                  }))
                }
                step={0.01}
                type="number"
                value={itemForm.price || ""}
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              onChange={(event) =>
                setItemForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              placeholder="Describe the dish, ingredients, and AR highlight..."
              rows={3}
              value={itemForm.description}
            />
          </Field>

          <ModelAssetField
            androidUrl={itemForm.arModelUrl}
            iosUrl={itemForm.arModelIosUrl}
            onAndroidUrlChange={(value) =>
              setItemForm((previous) => ({
                ...previous,
                arModelUrl: value,
              }))
            }
            onIosUrlChange={(value) =>
              setItemForm((previous) => ({
                ...previous,
                arModelIosUrl: value,
              }))
            }
            onUpload={() => {
              if (
                ensureGoogleDriveConnected(
                  "Connect your Google account before uploading 3D models.",
                )
              ) {
                modelInputRef.current?.click();
              }
            }}
            uploading={uploadingModel}
            error={modelError}
          >
            <input
              accept=".glb,.gltf,.usdz"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadFile(file, "model", "google-drive");
                }
                event.target.value = "";
              }}
              ref={modelInputRef}
              type="file"
            />
          </ModelAssetField>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setItemModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button
              disabled={!itemForm.name.trim() || !itemForm.categoryId}
              onClick={submitItem}
            >
              {editItemId ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ModelAssetField({
  androidUrl,
  iosUrl,
  children,
  onAndroidUrlChange,
  onIosUrlChange,
  onUpload,
  uploading,
  error,
}: {
  androidUrl: string;
  iosUrl: string;
  children: React.ReactNode;
  onAndroidUrlChange: (value: string) => void;
  onIosUrlChange: (value: string) => void;
  onUpload: () => void;
  uploading: boolean;
  error?: string;
}) {
  return (
    <Field label="3D Model">
      <div className="flex flex-col gap-2 rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-4">
        {children}
        <p className="text-sm leading-6 text-[#4b5563]">
          Upload a 3D model to Google Drive. `.glb` and `.gltf` files are
          saved for Android/Web viewers, while `.usdz` files are saved for iPhone
          and iPad Quick Look.
        </p>
        <div className="flex flex-wrap gap-2">
          {androidUrl ? (
            <Badge className="w-fit" variant="accent">
              <Package className="mr-1 h-3 w-3" />
              Android/Web model ready
            </Badge>
          ) : null}
          {iosUrl ? (
            <Badge className="w-fit" variant="accent">
              <Package className="mr-1 h-3 w-3" />
              iOS model ready
            </Badge>
          ) : null}
          {!androidUrl && !iosUrl ? (
            <Badge className="w-fit" variant="warm">
              No 3D model uploaded yet
            </Badge>
          ) : null}
        </div>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d9cdbb] bg-white px-3 py-4 text-xs text-[#6b7280] transition hover:border-[#0f766e] hover:bg-[#f7f3eb]"
          disabled={uploading}
          onClick={onUpload}
          type="button"
        >
          <Upload className="h-4 w-4" />
          <span>
            {uploading ? "Uploading to Google Drive..." : "Upload 3D model to Google Drive (.glb, .gltf, .usdz)"}
          </span>
        </button>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            onChange={(event) => onAndroidUrlChange(event.target.value)}
            placeholder="Android/Web model URL (.glb or .gltf)"
            value={androidUrl}
          />
          <Input
            onChange={(event) => onIosUrlChange(event.target.value)}
            placeholder="iOS model URL (.usdz)"
            value={iosUrl}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs font-medium text-[#c2410c]">
            {error}
          </p>
        )}
      </div>
    </Field>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-medium text-[#374151]">
        {label}
      </span>
      {children}
    </label>
  );
}

function getTargetForUpload(type: UploadKind, file?: File): ItemAssetTarget {
  if (type === "image") {
    return "imageUrl";
  }

  if (file && isIosModelFile(file)) {
    return "arModelIosUrl";
  }

  return "arModelUrl";
}

function isIosModelFile(file: Pick<File, "name" | "type">) {
  return (
    file.type === "model/vnd.usdz+zip" ||
    file.name.toLowerCase().endsWith(".usdz")
  );
}

function getTargetLabel(target: ItemAssetTarget) {
  if (target === "imageUrl") {
    return "item images";
  }

  if (target === "arModelIosUrl") {
    return "iOS USDZ models";
  }

  return "AR GLB/GLTF models";
}
