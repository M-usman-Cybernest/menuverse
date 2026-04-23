import { NextResponse } from "next/server";

import { authenticateUser } from "@/lib/menuverse-data";
import { setSessionCookie } from "@/lib/session";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = loginSchema.parse(json);
    const user = await authenticateUser(payload.email, payload.password);

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 },
      );
    }

    await setSessionCookie({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not sign in.",
      },
      { status: 400 },
    );
  }
}
