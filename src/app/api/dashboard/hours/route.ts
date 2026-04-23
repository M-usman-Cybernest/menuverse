import { NextResponse } from "next/server";
import { updateTimings } from "@/services/dashboard";
import { getOptionalSession } from "@/lib/session";

export async function PUT(request: Request) {
  const session = await getOptionalSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const json = await request.json();
    const timings = await updateTimings(session, json.timings);
    return NextResponse.json({ timings }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}
