import { NextResponse } from "next/server";
import { getDashboardStats } from "@/services/dashboard";
import { getOptionalSession } from "@/lib/session";

export async function GET() {
  const session = await getOptionalSession();
  if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const stats = await getDashboardStats(session);
    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}
