import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";

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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(request: Request) {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "File too large. Maximum size is 50MB." },
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
