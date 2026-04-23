import { NextResponse } from "next/server";

import { registerOwner } from "@/lib/menuverse-data";
import { setSessionCookie } from "@/lib/session";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = signupSchema.parse(json);
    const user = await registerOwner(payload);

    await setSessionCookie({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Could not create account.",
      },
      { status: 400 },
    );
  }
}
