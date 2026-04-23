import { NextResponse } from "next/server";
import { createItem } from "@/services/dashboard";
import { getOptionalSession } from "@/lib/session";
import { createItemSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getOptionalSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const json = await request.json();
    const payload = createItemSchema.parse(json);
    const items = await createItem(session, payload);
    return NextResponse.json({ items }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}
