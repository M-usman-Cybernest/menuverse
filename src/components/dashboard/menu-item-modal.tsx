"use client";

import { ImagePlus, Info, Package, Upload } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { API_DASHBOARD_UPLOAD } from "@/lib/api-routes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { MultiSelect } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import type { ItemAssetTarget } from "@/lib/storage";
import { resolveDriveUrl } from "@/lib/google-drive";

const GOOGLE_CONNECT_PAGE = "/dashboard/google-connect";

export type ItemForm = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  arModelUrl: string;
  arModelIosUrl: string;
  categoryId: string;
  availableBranches: string[];
  deliveryTime: {
    value: number;
    unit: "minutes" | "hours" | "days" | "weeks" | "months";
  };
};

export const EMPTY_ITEM: ItemForm = {
  name: "",
  description: "",
  price: 0,
  imageUrl: "",
  arModelUrl: "",
  arModelIosUrl: "",
  categoryId: "",
  availableBranches: [],
  deliveryTime: {
    value: 0,
    unit: "minutes",
  },
};

interface MenuItemModalProps {
  open: boolean;
  onClose: () => void;
  editItemId: string | null;
  itemForm: ItemForm;
  setItemForm: React.Dispatch<React.SetStateAction<ItemForm>>;
  googleDriveConnected: boolean;
  checkingGoogleDriveStatus: boolean;
  driveNeedsAuth: boolean;
  driveError: string;
  redirectingToGoogleConnect: boolean;
  ensureGoogleDriveConnected: (message: string) => boolean;
  onSuccess: () => void;
}

export function MenuItemModal({
  open,
  onClose,
  editItemId,
  itemForm,
  setItemForm,
  googleDriveConnected,
  checkingGoogleDriveStatus,
  driveNeedsAuth,
  driveError,
  redirectingToGoogleConnect,
  ensureGoogleDriveConnected,
  onSuccess,
}: MenuItemModalProps) {
  const router = useRouter();
  const { categories, saveItem, restaurant } = useDashboard();
  
  const [uploading, setUploading] = useState(false);
  const [uploadingModel, setUploadingModel] = useState(false);
  const [imageError, setImageError] = useState("");
  const [modelError, setModelError] = useState("");
  const [storageError, setStorageError] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File, type: "image" | "model") {
    if (
      !ensureGoogleDriveConnected(
        "Connect your Google account before uploading files to Google Drive."
      )
    ) {
      return;
    }

    const setter = type === "image" ? setUploading : setUploadingModel;
    const errorSetter = type === "image" ? setImageError : setModelError;

    const maxSize = 20 * 1024 * 1024; // 20 MB
    if (file.size > maxSize) {
      errorSetter("File is too large. Maximum file size is 20MB.");
      return;
    }

    setter(true);
    errorSetter("");
    setStorageError("");

    try {
      const target = getTargetForUpload(type, file);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("provider", "google-drive");
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
          throw new Error("File is too large.");
        }
        result = { message: text };
      }

      if (!response.ok || !result?.url) {
        throw new Error(result?.message || "Upload failed.");
      }

      setItemForm((prev) => ({
        ...prev,
        [target]: result.url,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed. Please retry.";
      errorSetter(message);
      setStorageError(message);
    } finally {
      setter(false);
    }
  }

  async function submitItem() {
    if (!itemForm.name.trim() || !itemForm.categoryId) {
      return;
    }

    if (
      !editItemId &&
      !ensureGoogleDriveConnected(
        "Connect your Google account before adding a new item."
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
      availableBranches: itemForm.availableBranches,
      deliveryTime: itemForm.deliveryTime,
    });

    if (success) {
      onSuccess();
    }
  }

  return (
    <Modal
      description={
        editItemId
          ? "Update item details, image, and 3D model."
          : "Add a new item with image and optional 3D model."
      }
      maxWidth="max-w-3xl"
      onClose={onClose}
      open={open}
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
                    : "Connect your Google account before adding a new item."}
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
                  src={resolveDriveUrl(itemForm.imageUrl, "image")}
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
                    void uploadFile(file, "image");
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
                      "Connect your Google account before uploading images."
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

   <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Availability" infoText="Select which branches this item is available in. By default, it's available in all locations.">
            <MultiSelect
              options={restaurant?.branches.map(b => ({
                label: b.name,
                value: b.id,
                description: b.city
              })) || []}
              selected={itemForm.availableBranches}
              onChange={(values) => setItemForm(prev => ({ ...prev, availableBranches: values }))}
              placeholder="Select available branches..."
            />
          </Field>

          <Field label="Delivery Time" infoText="Estimated time for this item to reach the customer.">
            <div className="grid grid-cols-2 gap-2">
              <Input
                min={0}
                onChange={(event) =>
                  setItemForm((previous) => ({
                    ...previous,
                    deliveryTime: {
                      ...previous.deliveryTime,
                      value: Number(event.target.value || 0),
                    },
                  }))
                }
                type="number"
                value={itemForm.deliveryTime.value || ""}
              />
              <select
                className="w-full rounded-md border border-[#d9cdbb] bg-white px-3 py-2 text-sm text-[#1f2937] outline-none transition focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
                onChange={(event) =>
                  setItemForm((previous) => ({
                    ...previous,
                    deliveryTime: {
                      ...previous.deliveryTime,
                      unit: event.target.value as any,
                    },
                  }))
                }
                value={itemForm.deliveryTime.unit}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </Field>
        </div>

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
                "Connect your Google account before uploading 3D models."
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
                void uploadFile(file, "model");
              }
              event.target.value = "";
            }}
            ref={modelInputRef}
            type="file"
          />
        </ModelAssetField>

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={onClose} variant="outline">
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
    <Field 
      label="3D Model" 
      infoText={"Upload a 3D model to Google Drive. `.glb` and `.gltf` files are saved for Android/Web viewers, while `.usdz` files are saved for iPhone and iPad Quick Look.\n\n⚠️ Files more than 20MB cannot be uploaded."}
    >
      <div className="flex flex-col gap-2 rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-4">
        {children}
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

function getTargetForUpload(type: "image" | "model", file?: File): ItemAssetTarget {
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
