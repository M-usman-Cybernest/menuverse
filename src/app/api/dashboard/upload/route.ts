import { mkdir, writeFile } from "fs/promises";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import path from "path";

import {
  GOOGLE_DRIVE_COOKIE_MAX_AGE,
  GOOGLE_DRIVE_COOKIE_NAME,
  getGoogleDriveMissingEnvMessage,
  getValidGoogleDriveSession,
  signGoogleDriveSession,
  uploadFileToGoogleDrive,
} from "@/lib/google-drive";
import { isGoogleDriveConfigured } from "@/lib/env";
import type { ItemAssetTarget } from "@/lib/storage";
import { getOptionalSession } from "@/lib/session";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const ALLOWED_MODEL_TYPES = [
  "model/gltf-binary",
  "model/gltf+json",
  "model/vnd.usdz+zip",
  "application/octet-stream",
];

const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_MODEL_TYPES];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: Request) {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const provider = String(formData.get("provider") ?? "local").trim();
    const target = String(formData.get("target") ?? "imageUrl").trim() as ItemAssetTarget;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File too large. Maximum size is 20MB." },
        { status: 400 },
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    const allowedExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".svg",
      ".glb",
      ".gltf",
      ".usdz",
    ];

    if (!allowedExtensions.includes(ext) || (file.type && !ALL_ALLOWED_TYPES.includes(file.type))) {
      return NextResponse.json(
        {
          message: `File type not allowed. Allowed types: ${allowedExtensions.join(", ")}`,
        },
        { status: 400 },
      );
    }

    if (provider === "google-drive") {
      if (!isGoogleDriveConfigured()) {
        return NextResponse.json(
          { message: getGoogleDriveMissingEnvMessage() },
          { status: 400 },
        );
      }

      const cookieStore = await cookies();
      const driveSession = await getValidGoogleDriveSession(
        cookieStore.get(GOOGLE_DRIVE_COOKIE_NAME)?.value,
      );

      if (!driveSession) {
        return NextResponse.json(
          {
            message: "Connect Google Drive first to upload images and models.",
            needsAuth: true,
          },
          { status: 401 },
        );
      }

      const asset = await uploadFileToGoogleDrive(
        driveSession.session.accessToken,
        file,
        target,
      );

      if (driveSession.refreshed) {
        cookieStore.set(
          GOOGLE_DRIVE_COOKIE_NAME,
          await signGoogleDriveSession(driveSession.session),
          {
            httpOnly: true,
            maxAge: GOOGLE_DRIVE_COOKIE_MAX_AGE,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          },
        );
      }

      return NextResponse.json(
        { asset, provider: "google-drive", url: asset.url },
        { status: 200 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    await writeFile(filePath, buffer);

    return NextResponse.json(
      { url: `/uploads/${uniqueName}` },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Upload failed.",
      },
      { status: 500 },
    );
  }
}
