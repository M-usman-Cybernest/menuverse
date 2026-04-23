import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isGoogleDriveConfigured } from "@/lib/env";
import {
  GOOGLE_DRIVE_COOKIE_MAX_AGE,
  GOOGLE_DRIVE_COOKIE_NAME,
  getGoogleDriveMissingEnvMessage,
  getValidGoogleDriveSession,
  signGoogleDriveSession,
} from "@/lib/google-drive";
import { getOptionalSession } from "@/lib/session";

export async function GET() {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isGoogleDriveConfigured()) {
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        message: getGoogleDriveMissingEnvMessage(),
      },
      { status: 200 },
    );
  }

  const cookieStore = await cookies();
  const driveSession = await getValidGoogleDriveSession(
    cookieStore.get(GOOGLE_DRIVE_COOKIE_NAME)?.value,
  );

  if (driveSession?.refreshed) {
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
    {
      configured: true,
      connected: Boolean(driveSession),
    },
    { status: 200 },
  );
}
