import { NextResponse } from "next/server";

import { normalizeExternalAssetUrl } from "@/lib/storage";
import { externalAssetSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;

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
