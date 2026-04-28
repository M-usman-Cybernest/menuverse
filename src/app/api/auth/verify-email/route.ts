import { type NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { UserModel } from "@/lib/models/user";
import { isDatabaseConfigured } from "@/lib/env";
import { getMemoryState } from "@/services/dashboard/data-utils";
import { verifyVerificationToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=Missing verification token", request.url));
  }

  const userId = await verifyVerificationToken(token);

  if (!userId) {
    return NextResponse.redirect(new URL("/login?error=Verification link expired or invalid. Please try again.", request.url));
  }

  try {
    if (isDatabaseConfigured()) {
      await connectToDatabase();
      const user = await UserModel.findOneAndUpdate(
        { appId: userId },
        { $set: { isVerified: true } }
      );

      if (!user) {
        return NextResponse.redirect(new URL("/login?error=User not found", request.url));
      }
    } else {
      const state = getMemoryState();
      const user = state.users.find((u) => u.id === userId);
      if (user) {
        user.isVerified = true;
      } else {
        return NextResponse.redirect(new URL("/login?error=User not found", request.url));
      }
    }

    // Redirect to dashboard with success message
    return NextResponse.redirect(new URL("/dashboard?verified=true", request.url));
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(new URL("/login?error=Verification failed", request.url));
  }
}
