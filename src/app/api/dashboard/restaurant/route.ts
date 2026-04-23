import { NextResponse } from "next/server";

import {
  getDashboardBundleForSession,
  saveRestaurantBundle,
} from "@/lib/menuverse-data";
import { getOptionalSession } from "@/lib/session";
import { saveRestaurantSchema } from "@/lib/validation";

export async function GET() {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const bundle = await getDashboardBundleForSession(session);

  return NextResponse.json({ bundle }, { status: 200 });
}

export async function PUT(request: Request) {
  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const payload = saveRestaurantSchema.parse(json);
    const bundle = await saveRestaurantBundle(session, payload);

    return NextResponse.json({ bundle }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not save restaurant.",
      },
      { status: 400 },
    );
  }
}
