import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";

import { env } from "@/lib/env";
import type { AuthSession } from "@/lib/types";

export const SESSION_COOKIE_NAME = "menuverse_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getJwtSecret() {
  return new TextEncoder().encode(env.jwtSecret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(session: AuthSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify<AuthSession>(token, getJwtSecret());

    if (!payload.userId || !payload.email || !payload.role || !payload.name) {
      return null;
    }

    return {
      userId: payload.userId,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    } satisfies AuthSession;
  } catch {
    return null;
  }
}

export async function signVerificationToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(getJwtSecret());
}

export async function verifyVerificationToken(token: string) {
  try {
    const { payload } = await jwtVerify<{ userId: string }>(token, getJwtSecret());
    return payload.userId;
  } catch {
    return null;
  }
}
