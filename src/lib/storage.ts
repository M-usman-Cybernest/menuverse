import type { MenuItem } from "@/lib/types";

export const EXTERNAL_STORAGE_PROVIDERS = [
  "uploadthing",
  "google-drive",
  "direct-url",
] as const;

export const ITEM_ASSET_TARGETS = [
  "imageUrl",
  "arModelUrl",
  "arModelIosUrl",
] as const;

export type ExternalStorageProvider = (typeof EXTERNAL_STORAGE_PROVIDERS)[number];
export type ItemAssetTarget = (typeof ITEM_ASSET_TARGETS)[number];

type NormalizeExternalAssetInput = {
  fileId?: string;
  provider?: ExternalStorageProvider;
  target: ItemAssetTarget;
  url: string;
};

type NormalizedExternalAsset = {
  originalUrl: string;
  provider: ExternalStorageProvider;
  target: ItemAssetTarget;
  url: string;
};

const GOOGLE_DRIVE_HOSTS = new Set(["drive.google.com", "docs.google.com"]);
const UPLOADTHING_HOSTS = ["utfs.io", "uploadthing.com", "ufs.sh"];

export function hasArAsset(item: Pick<MenuItem, "arModelUrl" | "arModelIosUrl">) {
  return Boolean(item.arModelUrl?.trim() || item.arModelIosUrl?.trim());
}

export function normalizeExternalAssetUrl(
  input: NormalizeExternalAssetInput,
): NormalizedExternalAsset {
  const provider = input.provider ?? detectStorageProvider(input.url);

  if (input.url.startsWith("/uploads/")) {
    return {
      originalUrl: input.url,
      provider: "direct-url",
      target: input.target,
      url: input.url,
    };
  }

  if (provider === "google-drive") {
    const fileId = input.fileId ?? extractGoogleDriveFileId(input.url);
    if (!fileId) {
      throw new Error("Google Drive link is invalid. Use a shareable file link.");
    }

    return {
      originalUrl: input.url,
      provider,
      target: input.target,
      url:
        input.target === "imageUrl"
          ? `https://drive.google.com/uc?export=view&id=${fileId}`
          : `https://drive.google.com/uc?export=download&id=${fileId}`,
    };
  }

  const parsedUrl = parseAbsoluteUrl(input.url);
  if (provider === "uploadthing" && !isUploadThingHost(parsedUrl.hostname)) {
    throw new Error("UploadThing URL is invalid. Paste the final hosted file URL.");
  }

  return {
    originalUrl: input.url,
    provider,
    target: input.target,
    url: parsedUrl.toString(),
  };
}

export function detectStorageProvider(url: string): ExternalStorageProvider {
  if (url.startsWith("/uploads/")) {
    return "direct-url";
  }

  try {
    const parsedUrl = new URL(url);
    if (GOOGLE_DRIVE_HOSTS.has(parsedUrl.hostname)) {
      return "google-drive";
    }
    if (isUploadThingHost(parsedUrl.hostname)) {
      return "uploadthing";
    }
  } catch {
    return "direct-url";
  }

  return "direct-url";
}

function extractGoogleDriveFileId(url: string) {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.searchParams.has("id")) {
      return parsedUrl.searchParams.get("id");
    }

    const match = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
    if (match) {
      return match[1];
    }
  } catch {
    return null;
  }

  return null;
}

function isUploadThingHost(hostname: string) {
  return UPLOADTHING_HOSTS.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}

function parseAbsoluteUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error();
    }
    return parsedUrl;
  } catch {
    throw new Error("Asset URL must be a valid http or https address.");
  }
}
