export * from "@/services/dashboard";
export * from "@/services/public-service";
export * from "@/services/auth-service";

// Backward compatibility for any missing pieces
import { validateCredentials } from "@/services/auth-service";
import { ensureSeeded } from "@/services/dashboard";
import { getPublicRestaurantPath } from "@/lib/utils";
import { env } from "@/lib/env";

export async function authenticateUser(email: string, password: string) {
  return validateCredentials(email, password);
}

export async function ensureSeedData() {
  await ensureSeeded();
}

export async function getPublicRestaurantPathForSlug(slug: string) {
  return getPublicRestaurantPath(slug, env.defaultRestaurantSlug);
}
