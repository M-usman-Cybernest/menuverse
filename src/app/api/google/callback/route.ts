import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isGoogleDriveConfigured } from "@/lib/env";
import {
  decodeGoogleDriveState,
  exchangeGoogleDriveCode,
  GOOGLE_DRIVE_COOKIE_MAX_AGE,
  GOOGLE_DRIVE_COOKIE_NAME,
  getGoogleDriveMissingEnvMessage,
  signGoogleDriveSession,
} from "@/lib/google-drive";
import { normalizeExternalAssetUrl } from "@/lib/storage";
import { getOptionalSession } from "@/lib/session";
import { externalAssetSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;

  if (searchParams.has("code") || searchParams.has("error")) {
    return handleGoogleDriveCallback(searchParams);
  }

  try {
    const payload = externalAssetSchema.parse({
      fileId: searchParams.get("fileId") ?? undefined,
      origin: searchParams.get("origin") ?? undefined,
      popup: searchParams.get("popup") ?? undefined,
      provider: searchParams.get("provider") ?? undefined,
      target: searchParams.get("target") ?? undefined,
      url: searchParams.get("url") ?? "",
    });

    const asset = normalizeExternalAssetUrl(payload);

    if (payload.popup) {
      return new Response(renderPopupCallbackPage(asset, payload.origin), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    return NextResponse.json({ asset }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Callback error." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = externalAssetSchema.parse(json);
    const asset = normalizeExternalAssetUrl(payload);

    return NextResponse.json({ asset }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Callback error." },
      { status: 400 },
    );
  }
}

async function handleGoogleDriveCallback(searchParams: URLSearchParams) {
  const popupOrigin =
    decodeGoogleDriveState(searchParams.get("state"))?.origin ?? "*";

  if (!isGoogleDriveConfigured()) {
    return new Response(
      renderGoogleDriveAuthPage(
        false,
        getGoogleDriveMissingEnvMessage(),
        popupOrigin,
      ),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  }

  const session = await getOptionalSession();

  if (!session) {
    return new Response(
      renderGoogleDriveAuthPage(
        false,
        "Your session expired. Sign in again, then reconnect Google Drive.",
        popupOrigin,
      ),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  }

  const error = searchParams.get("error");

  if (error) {
    return new Response(
      renderGoogleDriveAuthPage(
        false,
        `Google Drive authorization failed: ${error}.`,
        popupOrigin,
      ),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  }

  const code = searchParams.get("code");

  if (!code) {
    return new Response(
      renderGoogleDriveAuthPage(
        false,
        "Google Drive did not return an authorization code.",
        popupOrigin,
      ),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  }

  try {
    const driveSession = await exchangeGoogleDriveCode(code);
    const cookieStore = await cookies();

    cookieStore.set(
      GOOGLE_DRIVE_COOKIE_NAME,
      await signGoogleDriveSession(driveSession),
      {
        httpOnly: true,
        maxAge: GOOGLE_DRIVE_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    );

    return new Response(
      renderGoogleDriveAuthPage(
        true,
        "Google Drive connected. You can continue uploading now.",
        popupOrigin,
      ),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  } catch (error) {
    return new Response(
      renderGoogleDriveAuthPage(
        false,
        error instanceof Error
          ? error.message
          : "Google Drive authorization failed.",
        popupOrigin,
      ),
      {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      },
    );
  }
}

function renderPopupCallbackPage(
  asset: { provider: string; target: string; url: string },
  origin?: string,
) {
  const message = JSON.stringify({
    type: "menuverse-external-asset",
    asset,
  }).replace(/</g, "\\u003c");

  const targetOrigin = JSON.stringify(origin || "*");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MenuVerse Upload Callback</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <p>Finishing upload...</p>
    <script>
      const payload = ${message};
      if (window.opener) {
        window.opener.postMessage(payload, ${targetOrigin});
        window.close();
      }
      document.body.innerHTML = "<p>Upload finished. You can close this window.</p>";
    </script>
  </body>
</html>`;
}

function renderGoogleDriveAuthPage(
  ok: boolean,
  message: string,
  origin: string,
) {
  const payload = JSON.stringify({
    message,
    ok,
    type: "menuverse-google-drive-auth",
  }).replace(/</g, "\\u003c");
  const targetOrigin = JSON.stringify(origin || "*");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>MenuVerse Google Drive</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <p>${ok ? "Connecting Google Drive..." : "Google Drive connection failed."}</p>
    <script>
      const payload = ${payload};
      if (window.opener) {
        window.opener.postMessage(payload, ${targetOrigin});
        window.close();
      }
      document.body.innerHTML = "<p>" + payload.message + "</p>";
    </script>
  </body>
</html>`;
}
