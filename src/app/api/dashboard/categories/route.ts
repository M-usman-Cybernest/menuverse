import { NextResponse } from "next/server";
import { createCategory } from "@/services/dashboard";
import { getOptionalSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const json = await request.json();
    const categories = await createCategory(session, json);
    return NextResponse.json({ categories }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create category" },
      { status: 400 }
    );
  }
}
