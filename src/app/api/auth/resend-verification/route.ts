import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/session";
import { signVerificationToken } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/mail";
import { env } from "@/lib/env";
import { findUserById } from "@/services/dashboard/data-utils";

export async function POST() {
  try {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Account already verified" }, { status: 400 });
    }

    // Generate new token (10 min expiry)
    const token = await signVerificationToken(user.id);
    const verificationUrl = `${env.appUrl}/api/auth/verify-email?token=${token}`;

    if (!user.email) {
      return NextResponse.json(
        { message: "This account does not have an associated email address." },
        { status: 400 }
      );
    }

    // Send the email
    await sendWelcomeEmail(user.email, user.name, verificationUrl);

    return NextResponse.json({ message: "Verification email resent successfully" });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json(
      { message: "Failed to resend verification email" },
      { status: 500 }
    );
  }
}
