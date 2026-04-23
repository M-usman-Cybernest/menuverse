function getEnvValue(value: string | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

export const env = {
  appUrl: getEnvValue(process.env.NEXT_PUBLIC_APP_URL, "http://localhost:3000"),
  defaultRestaurantSlug: getEnvValue(
    process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG,
    "luna-table",
  ),
  jwtSecret: getEnvValue(
    process.env.JWT_SECRET,
    "menuverse-dev-secret-change-me",
  ),
  mongodbUri: process.env.MONGODB_URI?.trim() ?? "",
  mongodbDb: getEnvValue(process.env.MONGODB_DB, "menuverse"),
  adminEmail: getEnvValue(process.env.ADMIN_EMAIL, "admin@menuverse.local"),
  adminPassword: getEnvValue(process.env.ADMIN_PASSWORD, "Admin123!"),
  adminName: getEnvValue(process.env.ADMIN_NAME, "MenuVerse Admin"),
  seedOwnerEmail: getEnvValue(
    process.env.SEED_OWNER_EMAIL,
    "owner@lunatable.co",
  ),
  seedOwnerPassword: getEnvValue(
    process.env.SEED_OWNER_PASSWORD,
    "Owner123!",
  ),
  seedOwnerName: getEnvValue(process.env.SEED_OWNER_NAME, "Luna Owner"),
  seedRestaurantName: getEnvValue(
    process.env.SEED_RESTAURANT_NAME,
    "Luna Table",
  ),
};

export function isDatabaseConfigured() {
  return Boolean(env.mongodbUri);
}
