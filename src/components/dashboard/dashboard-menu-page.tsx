"use client";

import {
  ImagePlus,
  Info,
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

import { resolveDriveUrl } from "@/lib/google-drive";

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

import { MenuItemModal, type ItemForm, EMPTY_ITEM } from "./menu-item-modal";

const GOOGLE_CONNECT_PAGE = "/dashboard/google-connect";

type CategoryForm = { name: string; description: string };

type UploadMode = "local" | "google-drive";
type UploadKind = "image" | "model";

const EMPTY_CATEGORY: CategoryForm = { name: "", description: "" };

export function DashboardMenuPage() {
  const router = useRouter();
  const {
    availableTags,
    categories,
    deleteCategory,
    deleteItem,
    items,
    restaurant,
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

  const redirectTimeoutRef = useRef<number | null>(null);

  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");
  const [tagEditorItemId, setTagEditorItemId] = useState<string | null>(null);



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
      availableBranches: restaurant?.branches.map((b) => b.id) || [],
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
      imageUrls: item.imageUrls || [],
      name: item.name,
      price: item.price,
      availableBranches: item.availableBranches || [],
      deliveryTime: item.deliveryTime || { value: 0, unit: "minutes" },
    });
    setEditItemId(itemId);
    setItemModalOpen(true);
  }



  function getCategoryName(categoryId: string) {
    return categories.find((category) => category.id === categoryId)?.name ?? "-";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">Inventory</p>
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
                All Items
              </CardTitle>
              <CardDescription>
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
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
                            src={resolveDriveUrl(item.imageUrl || (item.imageUrls && item.imageUrls[0]) || "", "image")}
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
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${active
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
              placeholder="Enter category name"
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

      <MenuItemModal
        checkingGoogleDriveStatus={checkingGoogleDriveStatus}
        driveError={driveError}
        driveNeedsAuth={driveNeedsAuth}
        editItemId={editItemId}
        ensureGoogleDriveConnected={ensureGoogleDriveConnected}
        googleDriveConnected={googleDriveConnected}
        itemForm={itemForm}
        onClose={() => setItemModalOpen(false)}
        onSuccess={() => {
          setItemModalOpen(false);
          setItemForm(EMPTY_ITEM);
        }}
        open={itemModalOpen}
        redirectingToGoogleConnect={redirectingToGoogleConnect}
        setItemForm={setItemForm}
      />
    </div>
  );
}



function Field({
  children,
  className,
  label,
  infoText,
}: {
  children: React.ReactNode;
  className?: string;
  label: string;
  infoText?: string;
}) {
  return (
    <label className={`block ${className || ""}`}>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#374151]">
        {label}
        {infoText && (
          <div className="group relative flex items-center">
            <Info className="h-4 w-4 text-[#6b7280] transition-colors hover:text-[#0f766e]" />
            <div className="invisible absolute bottom-full left-[-10px] z-10 mb-2 w-[280px] rounded-lg bg-gray-900 p-3 text-xs font-normal leading-relaxed text-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 sm:w-80 whitespace-pre-wrap">
              {infoText}
              <div className="absolute left-[18px] top-full -mt-px border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )}
      </div>
      {children}
    </label>
  );
}


