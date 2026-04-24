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
  adminEmail: getEnvValue(process.env.ADMIN_EMAIL, "[EMAIL_ADDRESS]"),
  adminPassword: getEnvValue(process.env.ADMIN_PASSWORD, "Admin123!"),
  adminName: getEnvValue(process.env.ADMIN_NAME, "MenuVerse Admin"),
  seedOwnerName: getEnvValue(process.env.SEED_OWNER_NAME, "Luna Owner"),
  seedRestaurantName: getEnvValue(
    process.env.SEED_RESTAURANT_NAME,
    "Luna Table",
  ),
  googleDriveClientId: process.env.GOOGLE_DRIVE_CLIENT_ID?.trim() ?? "",
  googleDriveClientSecret:
    process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim() ?? "",
  googleDriveRedirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI?.trim() ?? "",
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID?.trim() ?? "",
  siteName: getEnvValue(process.env.NEXT_PUBLIC_SITE_NAME, "MenuVerse"),
};

export function isDatabaseConfigured() {
  return Boolean(env.mongodbUri);
}

export function getMissingGoogleDriveEnvVars() {
  const missing: string[] = [];

  if (!env.googleDriveClientId) {
    missing.push("GOOGLE_DRIVE_CLIENT_ID");
  }
  if (!env.googleDriveClientSecret) {
    missing.push("GOOGLE_DRIVE_CLIENT_SECRET");
  }
  if (!env.googleDriveRedirectUri) {
    missing.push("GOOGLE_DRIVE_REDIRECT_URI");
  }
  if (!env.googleDriveFolderId) {
    missing.push("GOOGLE_DRIVE_FOLDER_ID");
  }

  return missing;
}

export function isGoogleDriveConfigured() {
  return getMissingGoogleDriveEnvVars().length === 0;
}
