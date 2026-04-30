import { connectToDatabase } from "@/lib/mongoose";
import { UserModel } from "@/lib/models/user";
import { isDatabaseConfigured } from "@/lib/env";
import { verifyPassword } from "@/lib/auth";
import type { DbUserRecord, StoredUserRecord } from "./dashboard/data-utils";
import {
  getMemoryState,
  ensureSeeded,
} from "./dashboard/data-utils";
import { serializeUser } from "./dashboard/bundle-service";

export async function findUserByIdentifier(identifier: string) {
  await ensureSeeded();
  const cleanIdentifier = identifier.toLowerCase().trim();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await UserModel.findOne({
      $or: [{ email: cleanIdentifier }, { phone: cleanIdentifier }],
    }).lean<DbUserRecord>();
    
    if (!record) return null;
    return {
      id: record.appId,
      name: record.name,
      email: record.email,
      phone: record.phone,
      passwordHash: record.passwordHash,
      role: record.role,
      subscriptionStatus: record.subscriptionStatus,
      isVerified: record.isVerified ?? false,
    };
  }

  const state = getMemoryState();
  return (
    state.users.find(
      (u) =>
        u.email?.toLowerCase() === cleanIdentifier ||
        u.phone === cleanIdentifier,
    ) ?? null
  );
}

export async function validateCredentials(identifier: string, password: string) {
  const user = await findUserByIdentifier(identifier);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return serializeUser(user as StoredUserRecord);
}
