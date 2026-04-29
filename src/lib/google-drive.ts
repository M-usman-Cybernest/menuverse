import { jwtVerify, SignJWT } from "jose";

import { env, getMissingGoogleDriveEnvVars } from "@/lib/env";
import type { ItemAssetTarget } from "@/lib/storage";

export const GOOGLE_DRIVE_COOKIE_NAME = "menuverse_google_drive";
export const GOOGLE_DRIVE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive";
const GOOGLE_DRIVE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_LIST_FIELDS = [
  "files(id,name,mimeType,createdTime,size,thumbnailLink,webViewLink,webContentLink)",
].join(",");

type GoogleDriveOAuthTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export type GoogleDriveSession = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  tokenType: string;
};

export type GoogleDriveAsset = {
  createdTime?: string;
  id: string;
  mimeType: string;
  name: string;
  previewUrl: string;
  target: ItemAssetTarget;
  thumbnailUrl: string | null;
  url: string;
};

type GoogleDriveFileRecord = {
  createdTime?: string;
  id: string;
  mimeType: string;
  name: string;
  thumbnailLink?: string | null;
};

type GoogleDriveOAuthState = {
  origin: string;
  redirectUri: string;
};

function getGoogleDriveJwtSecret() {
  return new TextEncoder().encode(`${env.jwtSecret}:google-drive`);
}

function encodeGoogleDriveState(state: GoogleDriveOAuthState) {
  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function decodeGoogleDriveState(state: string | null) {
  if (!state) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(state, "base64url").toString("utf8"),
    ) as GoogleDriveOAuthState;

    if (!parsed.origin || !/^https?:\/\//.test(parsed.origin)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function getGoogleDriveMissingEnvMessage() {
  const missing = getMissingGoogleDriveEnvVars();

  if (missing.length === 0) {
    return "";
  }

  return `Missing Google Drive env variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. These are required for image and model uploads.`;
}

export function getDrivePreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

export function getDriveDownloadUrl(fileId: string) {
  return `https://docs.google.com/uc?export=download&id=${fileId}`;
}

export function getDriveImageUrl(fileId: string) {
  return `https://lh3.googleusercontent.com/d/${fileId}`;
}

export function extractDriveFileId(url: string) {
  const directMatch = url.match(/\/d\/([^/]+)/);

  if (directMatch?.[1]) {
    return directMatch[1];
  }

  const queryMatch = url.match(/[?&]id=([^&]+)/);

  return queryMatch?.[1] ?? null;
}

export function resolveDriveUrl(
  url: string | undefined | null,
  mode: "download" | "image" = "download",
) {
  if (!url) {
    return "";
  }

  if (
    url.includes("drive.google.com") || 
    url.includes("docs.google.com") ||
    url.includes("lh3.googleusercontent.com")
  ) {
    const fileId = extractDriveFileId(url);
    if (fileId) {
      return `/api/proxy/google-drive?id=${fileId}`;
    }
  }

  return url;
}

export function createGoogleDriveAuthUrl(origin: string) {
  const baseOrigin = origin.replace(/\/+$/, "");
  const redirectUri = `${baseOrigin}/api/google/callback`;

  const params = new URLSearchParams({
    access_type: "offline",
    client_id: env.googleDriveClientId,
    include_granted_scopes: "true",
    prompt: "consent",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_DRIVE_SCOPE,
    state: encodeGoogleDriveState({ origin, redirectUri }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleDriveCode(code: string, redirectUri: string) {
  const response = await fetch(GOOGLE_DRIVE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.googleDriveClientId,
      client_secret: env.googleDriveClientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  return parseGoogleDriveTokenResponse(response);
}

export async function refreshGoogleDriveSession(refreshToken: string) {
  const response = await fetch(GOOGLE_DRIVE_TOKEN_ENDPOINT, {
    body: new URLSearchParams({
      client_id: env.googleDriveClientId,
      client_secret: env.googleDriveClientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  const token = await parseGoogleDriveTokenResponse(response);

  return {
    ...token,
    refreshToken: token.refreshToken ?? refreshToken,
  } satisfies GoogleDriveSession;
}

async function parseGoogleDriveTokenResponse(response: Response) {
  const payload =
    (await response.json().catch(() => null)) as GoogleDriveOAuthTokenResponse | null;

  if (!response.ok || !payload?.access_token || !payload.expires_in) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        "Google Drive authorization failed.",
    );
  }

  return {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type ?? "Bearer",
  } satisfies GoogleDriveSession;
}

export async function signGoogleDriveSession(session: GoogleDriveSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${GOOGLE_DRIVE_COOKIE_MAX_AGE}s`)
    .sign(getGoogleDriveJwtSecret());
}

export async function verifyGoogleDriveSession(token: string) {
  try {
    const { payload } = await jwtVerify<GoogleDriveSession>(
      token,
      getGoogleDriveJwtSecret(),
    );

    if (!payload.accessToken || !payload.expiresAt || !payload.tokenType) {
      return null;
    }

    return {
      accessToken: payload.accessToken,
      expiresAt: payload.expiresAt,
      refreshToken: payload.refreshToken,
      tokenType: payload.tokenType,
    } satisfies GoogleDriveSession;
  } catch {
    return null;
  }
}

export async function getValidGoogleDriveSession(token: string | undefined) {
  if (!token) {
    return null;
  }

  const session = await verifyGoogleDriveSession(token);

  if (!session) {
    return null;
  }

  if (session.expiresAt > Date.now() + 60_000) {
    return { refreshed: false, session };
  }

  if (!session.refreshToken) {
    return null;
  }

  const refreshedSession = await refreshGoogleDriveSession(session.refreshToken);

  return {
    refreshed: true,
    session: refreshedSession,
  };
}

export async function uploadFileToGoogleDrive(
  accessToken: string,
  file: File,
  target: ItemAssetTarget,
) {
  const boundary = `menuverse-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({
    name: file.name,
    parents: [env.googleDriveFolderId],
  });
  const fileBytes = new Uint8Array(await file.arrayBuffer());
  const body = new Blob([
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    metadata,
    "\r\n",
    `--${boundary}\r\n`,
    `Content-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
    fileBytes,
    "\r\n",
    `--${boundary}--`,
  ]);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,thumbnailLink",
    {
      body,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      method: "POST",
    },
  );

  const payload =
    (await response.json().catch(() => null)) as
      | (GoogleDriveFileRecord & { error?: { message?: string } })
      | null;

  if (!response.ok || !payload?.id || !payload.name || !payload.mimeType) {
    throw new Error(
      payload?.error?.message || "Google Drive upload failed.",
    );
  }

  await makeGoogleDriveFilePublic(accessToken, payload.id);

  return mapGoogleDriveFileToAsset(payload, target);
}

export async function listGoogleDriveAssets(
  accessToken: string,
  target: ItemAssetTarget,
) {
  const query = encodeURIComponent(
    `'${env.googleDriveFolderId}' in parents and trashed = false`,
  );

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${encodeURIComponent(
      GOOGLE_DRIVE_LIST_FIELDS,
    )}&orderBy=createdTime desc&pageSize=50`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      method: "GET",
    },
  );

  const payload =
    (await response.json().catch(() => null)) as
      | {
          error?: { message?: string };
          files?: GoogleDriveFileRecord[];
        }
      | null;

  if (!response.ok) {
    throw new Error(
      payload?.error?.message || "Could not fetch Google Drive files.",
    );
  }

  return (payload?.files ?? [])
    .filter((file) => isGoogleDriveFileCompatible(file, target))
    .map((file) => mapGoogleDriveFileToAsset(file, target));
}

async function makeGoogleDriveFilePublic(accessToken: string, fileId: string) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    const payload =
      (await response.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;

    throw new Error(
      payload?.error?.message ||
        "File uploaded, but public sharing could not be enabled.",
    );
  }
}

function isGoogleDriveFileCompatible(
  file: Pick<GoogleDriveFileRecord, "mimeType" | "name">,
  target: ItemAssetTarget,
) {
  const fileName = file.name.toLowerCase();

  if (target === "imageUrl") {
    return file.mimeType.startsWith("image/");
  }

  if (target === "arModelIosUrl") {
    return (
      file.mimeType === "model/vnd.usdz+zip" || fileName.endsWith(".usdz")
    );
  }

  return (
    file.mimeType === "model/gltf-binary" ||
    file.mimeType === "model/gltf+json" ||
    fileName.endsWith(".glb") ||
    fileName.endsWith(".gltf")
  );
}

function mapGoogleDriveFileToAsset(
  file: GoogleDriveFileRecord,
  target: ItemAssetTarget,
) {
  return {
    createdTime: file.createdTime,
    id: file.id,
    mimeType: file.mimeType,
    name: file.name,
    previewUrl:
      target === "imageUrl"
        ? getDriveImageUrl(file.id)
        : getDrivePreviewUrl(file.id),
    target,
    thumbnailUrl: file.thumbnailLink ?? null,
    url:
      target === "imageUrl"
        ? getDriveImageUrl(file.id)
        : getDriveDownloadUrl(file.id),
  } satisfies GoogleDriveAsset;
}
