import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isGoogleDriveConfigured } from "@/lib/env";
import {
  GOOGLE_DRIVE_COOKIE_MAX_AGE,
  GOOGLE_DRIVE_COOKIE_NAME,
  getGoogleDriveMissingEnvMessage,
  getValidGoogleDriveSession,
  listGoogleDriveAssets,
  signGoogleDriveSession,
} from "@/lib/google-drive";
import { getOptionalSession } from "@/lib/session";
import { googleDriveFileQuerySchema } from "@/lib/validation";

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

  try {
    const searchParams = new URL(request.url).searchParams;
    const query = googleDriveFileQuerySchema.parse({
      target: searchParams.get("target") ?? undefined,
    });
    const cookieStore = await cookies();
    const driveSession = await getValidGoogleDriveSession(
      cookieStore.get(GOOGLE_DRIVE_COOKIE_NAME)?.value,
    );

    if (!driveSession) {
      return NextResponse.json(
        {
          message: "Connect Google Drive first to browse images and models.",
          needsAuth: true,
        },
        { status: 401 },
      );
    }

    const assets = await listGoogleDriveAssets(
      driveSession.session.accessToken,
      query.target,
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

    return NextResponse.json({ assets }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Could not read Google Drive files.",
      },
      { status: 400 },
    );
  }
}
