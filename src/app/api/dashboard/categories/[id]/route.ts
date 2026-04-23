import { NextResponse } from "next/server";
import { deleteCategoryById, updateCategoryById } from "@/services/dashboard";
import { getOptionalSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getOptionalSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const json = await request.json();
    const categories = await updateCategoryById(session, id, json);
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  const session = await getOptionalSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const categories = await deleteCategoryById(session, id);
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}
