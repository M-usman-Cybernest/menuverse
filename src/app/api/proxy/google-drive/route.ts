import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get("id");

  if (!fileId) {
    return new NextResponse("Missing file ID", { status: 400 });
  }

  const driveUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;

  try {
    const response = await fetch(driveUrl);

    if (!response.ok) {
      return new NextResponse("Failed to fetch from Google Drive", {
        status: response.status,
      });
    }

    // Proxy the headers and the body
    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");

    if (contentType) headers.set("Content-Type", contentType);
    if (contentLength) headers.set("Content-Length", contentLength);
    
    // Enable CORS for the client
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(response.body, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
