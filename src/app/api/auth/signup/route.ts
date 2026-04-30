import { NextResponse } from "next/server";

import { registerOwner } from "@/lib/menuverse-data";
import { setSessionCookie } from "@/lib/session";
import { signupSchema } from "@/lib/validation";
import { sendWelcomeEmail } from "@/lib/mail";
import { env } from "@/lib/env";
import { signVerificationToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = signupSchema.parse(json);
    const user = await registerOwner(payload);
    
    // Send welcome email only if it's an email address
    if (user.email) {
      const token = await signVerificationToken(user.id);
      const verificationUrl = `${env.appUrl}/api/auth/verify-email?token=${token}`;
      await sendWelcomeEmail(user.email, user.name, verificationUrl);
    }

    await setSessionCookie({
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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
