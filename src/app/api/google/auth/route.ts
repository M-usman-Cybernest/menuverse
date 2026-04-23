import { NextResponse } from "next/server";

import { isGoogleDriveConfigured } from "@/lib/env";
import {
  createGoogleDriveAuthUrl,
  getGoogleDriveMissingEnvMessage,
} from "@/lib/google-drive";
import { getOptionalSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isGoogleDriveConfigured()) {
    return NextResponse.json(
      { message: getGoogleDriveMissingEnvMessage() },
      { status: 400 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const origin =
    searchParams.get("origin")?.trim() || process.env.NEXT_PUBLIC_APP_URL || "";

  return NextResponse.json(
    { authUrl: createGoogleDriveAuthUrl(origin) },
    { status: 200 },
  );
}
