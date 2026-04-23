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
import { useCallback, useEffect, useRef, useState } from "react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { API_DASHBOARD_UPLOAD, API_GOOGLE_CALLBACK } from "@/lib/api-routes";
import type { ExternalStorageProvider, ItemAssetTarget } from "@/lib/storage";
import { hasArAsset } from "@/lib/storage";
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
import { formatPrice } from "@/lib/utils";

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

const STORAGE_PROVIDER_OPTIONS: Array<{
  label: string;
  value: ExternalStorageProvider;
}> = [
  { label: "UploadThing", value: "uploadthing" },
  { label: "Google Drive", value: "google-drive" },
  { label: "Direct URL", value: "direct-url" },
];

export function DashboardMenuPage() {
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

  // Modal states
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState<CategoryForm>(EMPTY_CATEGORY);
  const [editCatId, setEditCatId] = useState<string | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [itemForm, setItemForm] = useState<ItemForm>(EMPTY_ITEM);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const [storageTarget, setStorageTarget] = useState<ItemAssetTarget>("imageUrl");
  const [storageProvider, setStorageProvider] =
    useState<ExternalStorageProvider>("uploadthing");
  const [storageUrl, setStorageUrl] = useState("");
  const [storageError, setStorageError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  // Filter state for table
  const [filterCategoryId, setFilterCategoryId] = useState<string>("all");

  // Tag editor panel
  const [tagEditorItemId, setTagEditorItemId] = useState<string | null>(null);

  useEffect(() => {
    function handleExternalAssetMessage(event: MessageEvent) {
      if (
        !event.data ||
        typeof event.data !== "object" ||
        event.data.type !== "menuverse-external-asset"
      ) {
        return;
      }

      const asset = event.data.asset as
        | { target?: ItemAssetTarget; url?: string }
        | undefined;

      if (!asset?.target || !asset?.url) {
        return;
      }

      const target = asset.target as keyof ItemForm;

      setItemForm((previous) => ({
        ...previous,
        [target]: asset.url,
      }));
      setStorageModalOpen(false);
      setStorageUrl("");
      setStorageError("");
    }

    window.addEventListener("message", handleExternalAssetMessage);
    return () => {
      window.removeEventListener("message", handleExternalAssetMessage);
    };
  }, []);

  const filteredItems =
    filterCategoryId === "all"
      ? items
      : items.filter((item) => item.categoryId === filterCategoryId);

  // Upload handler
  const uploadFile = useCallback(
    async (file: File, type: "image" | "model" | "ios-model") => {
      const setter = type === "image" ? setUploading : setUploadingModel;
      setter(true);

      try {
        setStorageError("");
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(API_DASHBOARD_UPLOAD, {
          method: "POST",
          body: formData,
        });

        const result = (await response.json()) as
          | { url: string }
          | { message: string };

        if (!response.ok || !("url" in result)) {
          throw new Error(
            "message" in result ? result.message : "Upload failed.",
          );
        }

        if (type === "image") {
          setItemForm((previous) => ({ ...previous, imageUrl: result.url }));
        } else if (type === "model") {
          setItemForm((previous) => ({
            ...previous,
            arModelUrl: result.url,
          }));
        } else {
          setItemForm((previous) => ({
            ...previous,
            arModelIosUrl: result.url,
          }));
        }
      } catch (error) {
        setStorageError(
          error instanceof Error ? error.message : "Upload failed. Please retry.",
        );
        // Silently fail – user can retry
      } finally {
        setter(false);
      }
    },
    [],
  );

  // Category modal handlers
  function openAddCategory() {
    setCatForm(EMPTY_CATEGORY);
    setEditCatId(null);
    setCatModalOpen(true);
  }

  function openEditCategory(categoryId: string) {
    const cat = categories.find((c) => c.id === categoryId);
    if (!cat) return;
    setCatForm({ name: cat.name, description: cat.description });
    setEditCatId(categoryId);
    setCatModalOpen(true);
  }

  async function submitCategory() {
    if (!catForm.name.trim()) return;

    const success = await saveCategory(editCatId, {
      name: catForm.name.trim(),
      description: catForm.description.trim(),
    });

    if (success) {
      setCatModalOpen(false);
      setCatForm(EMPTY_CATEGORY);
    }
  }

  // Item modal handlers
  function openAddItem() {
    setStorageError("");
    setItemForm({
      ...EMPTY_ITEM,
      categoryId: categories[0]?.id ?? "",
    });
    setEditItemId(null);
    setItemModalOpen(true);
  }

  function openEditItem(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    setStorageError("");
    setItemForm({
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
      arModelUrl: item.arModelUrl ?? "",
      arModelIosUrl: item.arModelIosUrl ?? "",
      categoryId: item.categoryId,
    });
    setEditItemId(itemId);
    setItemModalOpen(true);
  }

  async function submitItem() {
    if (!itemForm.name.trim() || !itemForm.categoryId) return;

    const data = {
      categoryId: itemForm.categoryId,
      name: itemForm.name.trim(),
      description: itemForm.description.trim(),
      price: itemForm.price,
      imageUrl: itemForm.imageUrl || undefined,
      arModelUrl: itemForm.arModelUrl || undefined,
      arModelIosUrl: itemForm.arModelIosUrl || undefined,
    };

    const success = await saveItem(editItemId, data);

    if (success) {
      setItemModalOpen(false);
      setItemForm(EMPTY_ITEM);
    }
  }

  function openStorageModal(target: ItemAssetTarget) {
    setStorageTarget(target);
    setStorageProvider(target === "imageUrl" ? "uploadthing" : "google-drive");
    setStorageUrl(itemForm[target]);
    setStorageError("");
    setStorageModalOpen(true);
  }

  async function applyStorageUrl() {
    if (!storageUrl.trim()) {
      setStorageError("Paste a hosted file URL first.");
      return;
    }

    try {
      setStorageError("");
      const response = await fetch(API_GOOGLE_CALLBACK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: storageProvider,
          target: storageTarget,
          url: storageUrl.trim(),
        }),
      });

      const payload = (await response.json()) as
        | { asset: { target: ItemAssetTarget; url: string } }
        | { message: string };

      if (!response.ok || !("asset" in payload)) {
        throw new Error(
          "message" in payload ? payload.message : "Could not attach the asset.",
        );
      }

      setItemForm((previous) => ({
        ...previous,
        [payload.asset.target]: payload.asset.url,
      }));
      setStorageModalOpen(false);
      setStorageUrl("");
    } catch (error) {
      setStorageError(
        error instanceof Error ? error.message : "Could not attach the asset.",
      );
    }
  }

  function getCategoryName(categoryId: string) {
    return categories.find((c) => c.id === categoryId)?.name ?? "—";
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">Menu Builder</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Categories & Items
          </h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={openAddCategory} variant="outline" size="sm">
            <Layers3 className="h-4 w-4" />
            Add Category
          </Button>
          <Button onClick={openAddItem} variant="secondary" size="sm" disabled={categories.length === 0}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
          <Button onClick={() => void saveRestaurant()} disabled={saving} size="sm">
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

      {/* Category chips for management */}
      {categories.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers3 className="h-4 w-4 text-[#0f766e]" />
              Categories
            </CardTitle>
            <CardDescription>
              {categories.length} categories — click to edit, or manage below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex items-center gap-1.5 rounded-lg border border-[#e7dfd2] bg-[#fffcf8] px-3 py-2 text-sm transition hover:border-[#0f766e]/30 hover:bg-[#f7f3eb]"
                >
                  <span className="font-medium text-[#111827]">{cat.name}</span>
                  <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                    {items.filter((i) => i.categoryId === cat.id).length}
                  </Badge>
                  <button
                    onClick={() => openEditCategory(cat.id)}
                    className="ml-1 rounded p-0.5 text-[#9ca3af] opacity-0 transition hover:text-[#0f766e] group-hover:opacity-100"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {categories.length > 1 ? (
                    <button
                      onClick={() => void deleteCategory(cat.id)}
                      className="rounded p-0.5 text-[#9ca3af] opacity-0 transition hover:text-red-500 group-hover:opacity-100"
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

      {/* Items Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#0f766e]" />
                All Menu Items
              </CardTitle>
              <CardDescription>
                {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} in your menu
              </CardDescription>
            </div>
            {/* Category filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#6b7280]">Filter:</span>
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="rounded-md border border-[#e7dfd2] bg-[#fffcf8] px-3 py-1.5 text-sm text-[#111827] outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
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
                  <tr className="border-t border-b border-[#e7dfd2] bg-[#faf7f2]">
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
                        <Badge variant="default" className="text-[11px]">
                          {getCategoryName(item.categoryId)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 font-medium text-[#0f766e]">
                        {formatPrice(item.price)}
                      </td>
                      <td className="hidden px-5 py-3 text-[#6b7280] md:table-cell">
                        <span className="line-clamp-1">
                          {item.description}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {hasArAsset(item) ? (
                          <Badge variant="accent">3D</Badge>
                        ) : (
                          <span className="text-xs text-[#d9cdbb]">—</span>
                        )}
                      </td>
                      <td className="hidden px-5 py-3 lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {item.dietaryTags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              className="text-[10px]"
                              variant={
                                tag === "AR Ready" ? "accent" : "default"
                              }
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
                            onClick={() => setTagEditorItemId(tagEditorItemId === item.id ? null : item.id)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            title="Edit tags"
                          >
                            <Layers3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => openEditItem(item.id)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            onClick={() => void deleteItem(item.id)}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
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

        {/* Inline tag editor for the selected item */}
        {tagEditorItemId ? (
          <div className="border-t border-[#e7dfd2] px-5 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
              Tags for: {items.find((i) => i.id === tagEditorItemId)?.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const item = items.find((i) => i.id === tagEditorItemId);
                const active = item?.dietaryTags.includes(tag) ?? false;
                return (
                  <button
                    key={tag}
                    onClick={() => toggleItemTag(tagEditorItemId, tag)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      active
                        ? "bg-[#0f766e] text-white"
                        : "bg-[#f2ede2] text-[#6b7280] hover:bg-[#e7dfd2]"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </Card>

      {/* ========= CATEGORY MODAL ========= */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editCatId ? "Edit Category" : "New Category"}
        description={
          editCatId
            ? "Update the category details."
            : "Create a new menu category."
        }
      >
        <div className="space-y-4">
          <Field label="Category Name">
            <Input
              placeholder="e.g. Starters, Mains, Desserts..."
              value={catForm.name}
              onChange={(event) =>
                setCatForm((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              autoFocus
            />
          </Field>
          <Field label="Description">
            <Textarea
              placeholder="A short description of this section..."
              rows={3}
              value={catForm.description}
              onChange={(event) =>
                setCatForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => setCatModalOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={submitCategory} disabled={!catForm.name.trim()}>
              {editCatId ? "Update" : "Create Category"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========= ITEM MODAL ========= */}
      <Modal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editItemId ? "Edit Menu Item" : "New Menu Item"}
        description={
          editItemId
            ? "Update item details, image, and 3D model."
            : "Add a new item with image and optional 3D model."
        }
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {storageError ? (
            <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
              {storageError}
            </Badge>
          ) : null}
          {/* Category selector */}
          <Field label="Category">
            <select
              value={itemForm.categoryId}
              onChange={(event) =>
                setItemForm((previous) => ({
                  ...previous,
                  categoryId: event.target.value,
                }))
              }
              className="w-full rounded-md border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
            >
              <option value="" disabled>
                Select a category...
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Image upload */}
          <Field label="Item Image">
            <div className="flex items-start gap-4">
              {itemForm.imageUrl ? (
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg border border-[#ece4d8] bg-white">
                  <Image
                    alt="Item preview"
                    className="object-cover"
                    fill
                    sizes="128px"
                    src={itemForm.imageUrl}
                  />
                </div>
              ) : null}
              <div className="flex-1">
                <input
                  ref={imageInputRef}
                  accept="image/*"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile(file, "image");
                    event.target.value = "";
                  }}
                />
                <button
                  onClick={() => imageInputRef.current?.click()}
                  type="button"
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d9cdbb] bg-[#fffcf8] px-4 py-6 text-sm text-[#6b7280] transition hover:border-[#0f766e] hover:bg-[#f7f3eb]"
                >
                  {uploading ? (
                    <span className="animate-pulse">Uploading...</span>
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5" />
                      <span>Click to upload image</span>
                    </>
                  )}
                </button>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    onClick={() => openStorageModal("imageUrl")}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Use Storage Link
                  </Button>
                </div>
              </div>
            </div>
            <Input
              className="mt-3"
              placeholder="https://utfs.io/f/... or https://drive.google.com/file/d/..."
              value={itemForm.imageUrl}
              onChange={(event) =>
                setItemForm((previous) => ({
                  ...previous,
                  imageUrl: event.target.value,
                }))
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Item Name">
              <Input
                placeholder="e.g. Classic Burger"
                value={itemForm.name}
                onChange={(event) =>
                  setItemForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
              />
            </Field>
            <Field label="Price ($)">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={itemForm.price || ""}
                onChange={(event) =>
                  setItemForm((previous) => ({
                    ...previous,
                    price: Number(event.target.value || 0),
                  }))
                }
              />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              placeholder="Describe the dish, ingredients, and AR highlight..."
              rows={3}
              value={itemForm.description}
              onChange={(event) =>
                setItemForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </Field>

          {/* 3D Model upload */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="3D Model (.glb / .gltf)">
              <div className="flex flex-col gap-2">
                {itemForm.arModelUrl ? (
                  <Badge variant="accent" className="w-fit">
                    <Package className="mr-1 h-3 w-3" />
                    Android Model
                  </Badge>
                ) : null}
                <input
                  ref={modelInputRef}
                  accept=".glb,.gltf"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile(file, "model");
                    event.target.value = "";
                  }}
                />
                <button
                  onClick={() => modelInputRef.current?.click()}
                  type="button"
                  disabled={uploadingModel}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d9cdbb] bg-[#fffcf8] px-3 py-4 text-xs text-[#6b7280] transition hover:border-[#0f766e] hover:bg-[#f7f3eb]"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload .glb</span>
                </button>
                <Button
                  onClick={() => openStorageModal("arModelUrl")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Storage Link
                </Button>
                <Input
                  placeholder="https://drive.google.com/file/d/... or https://utfs.io/f/..."
                  value={itemForm.arModelUrl}
                  onChange={(event) =>
                    setItemForm((previous) => ({
                      ...previous,
                      arModelUrl: event.target.value,
                    }))
                  }
                />
              </div>
            </Field>

            <Field label="iOS Model (.usdz)">
              <div className="flex flex-col gap-2">
                {itemForm.arModelIosUrl ? (
                  <Badge variant="accent" className="w-fit">
                    <Package className="mr-1 h-3 w-3" />
                    iOS Model
                  </Badge>
                ) : null}
                <input
                  id="ios-model-input"
                  accept=".usdz"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadFile(file, "ios-model");
                    event.target.value = "";
                  }}
                />
                <button
                  onClick={() => document.getElementById("ios-model-input")?.click()}
                  type="button"
                  disabled={uploadingModel}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d9cdbb] bg-[#fffcf8] px-3 py-4 text-xs text-[#6b7280] transition hover:border-[#0f766e] hover:bg-[#f7f3eb]"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload .usdz</span>
                </button>
                <Button
                  onClick={() => openStorageModal("arModelIosUrl")}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Storage Link
                </Button>
                <Input
                  placeholder="https://drive.google.com/file/d/... or https://utfs.io/f/..."
                  value={itemForm.arModelIosUrl}
                  onChange={(event) =>
                    setItemForm((previous) => ({
                      ...previous,
                      arModelIosUrl: event.target.value,
                    }))
                  }
                />
              </div>
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={() => setItemModalOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={submitItem} disabled={!itemForm.name.trim() || !itemForm.categoryId}>
              {editItemId ? "Update Item" : "Add Item"}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        open={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
        title="Attach External Asset"
        description="Use a hosted UploadThing, Google Drive, or direct file URL."
      >
        <div className="space-y-4">
          <Field label="Storage Provider">
            <select
              value={storageProvider}
              onChange={(event) =>
                setStorageProvider(event.target.value as ExternalStorageProvider)
              }
              className="w-full rounded-md border border-[#e7dfd2] bg-white px-3 py-2 text-sm text-[#111827] outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
            >
              {STORAGE_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hosted File URL">
            <Input
              autoFocus
              placeholder="Paste the public file URL"
              value={storageUrl}
              onChange={(event) => setStorageUrl(event.target.value)}
            />
          </Field>
          {storageError ? (
            <Badge className="bg-[#ffe8d6] text-[#c2410c]" variant="warm">
              {storageError}
            </Badge>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setStorageModalOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => void applyStorageUrl()}>
              Attach Asset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
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
