import { connectToDatabase } from "@/lib/mongoose";
import { UserModel } from "@/lib/models/user";
import { isDatabaseConfigured } from "@/lib/env";
import { verifyPassword } from "@/lib/auth";
import {
  getMemoryState,
  ensureSeeded,
} from "./dashboard/data-utils";
import { serializeUser } from "./dashboard/bundle-service";

export async function findUserByEmail(email: string) {
  await ensureSeeded();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await UserModel.findOne({ email: email.toLowerCase() }).lean<any>();
    if (!record) return null;
    return {
      id: record.appId,
      name: record.name,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role,
      subscriptionStatus: record.subscriptionStatus,
    };
  }

  const state = getMemoryState();
  return state.users.find((u) => u.email === email.toLowerCase()) ?? null;
}

export async function validateCredentials(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) return null;

  return serializeUser(user as any);
}
