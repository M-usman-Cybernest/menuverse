import { NextResponse } from "next/server";
import { deleteItemById, updateItemById } from "@/services/dashboard";
import { getOptionalSession } from "@/lib/session";
import { updateItemSchema } from "@/lib/validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getOptionalSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const json = await request.json();
    const payload = updateItemSchema.parse(json);
    const items = await updateItemById(session, id, payload);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await getOptionalSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const items = await deleteItemById(session, id);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}
