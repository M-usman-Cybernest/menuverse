import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth";
import type { AuthSession, UserRole } from "@/lib/types";

export async function getOptionalSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function requireSession() {
  const session = await getOptionalSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export function isRoleAllowed(role: UserRole, roles: UserRole[]) {
  return roles.includes(role);
}

export async function requireRole(roles: UserRole[]) {
  const session = await requireSession();

  if (!isRoleAllowed(session.role, roles)) {
    redirect("/dashboard");
  }

  return session;
}

export async function setSessionCookie(session: AuthSession) {
  const cookieStore = await cookies();
  const token = await signSessionToken(session);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);
}
