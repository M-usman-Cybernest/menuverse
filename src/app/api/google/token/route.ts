import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { GOOGLE_DRIVE_COOKIE_NAME, getValidGoogleDriveSession } from "@/lib/google-drive";
import { env } from "@/lib/env";
import { getOptionalSession } from "@/lib/session";

export async function GET() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const cookieStore = await cookies();
  const driveSession = await getValidGoogleDriveSession(
    cookieStore.get(GOOGLE_DRIVE_COOKIE_NAME)?.value,
  );

  if (!driveSession) {
    return NextResponse.json({ message: "Google Drive not connected." }, { status: 401 });
  }

  return NextResponse.json({
    accessToken: driveSession.session.accessToken,
    folderId: env.googleDriveFolderId,
  });
}
