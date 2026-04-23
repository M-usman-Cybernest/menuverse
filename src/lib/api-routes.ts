
// ─── Auth ───
export const API_AUTH_LOGIN = "/api/auth/login";
export const API_AUTH_SIGNUP = "/api/auth/signup";
export const API_AUTH_LOGOUT = "/api/auth/logout";
export const API_AUTH_SESSION = "/api/auth/session";

// ─── Dashboard – Restaurant (full bundle save) ───
export const API_DASHBOARD_RESTAURANT = "/api/dashboard/restaurant";
export const API_DASHBOARD_OVERVIEW = "/api/dashboard/overview";

// ─── Dashboard – Categories ───
export const API_DASHBOARD_CATEGORIES = "/api/dashboard/categories";
export const API_DASHBOARD_CATEGORY = (id: string) =>
  `/api/dashboard/categories/${id}`;

// ─── Dashboard – Items ───
export const API_DASHBOARD_ITEMS = "/api/dashboard/items";
export const API_DASHBOARD_ITEM = (id: string) =>
  `/api/dashboard/items/${id}`;

// ─── Dashboard – Branches ───
export const API_DASHBOARD_BRANCHES = "/api/dashboard/branches";
export const API_DASHBOARD_BRANCH = (id: string) =>
  `/api/dashboard/branches/${id}`;

// ─── Dashboard – Hours ───
export const API_DASHBOARD_HOURS = "/api/dashboard/hours";

// ─── Dashboard – Account ───
export const API_DASHBOARD_ACCOUNT = "/api/dashboard/account";
export const API_DASHBOARD_ACCOUNT_PASSWORD =
  "/api/dashboard/account/password";

// ─── Dashboard – Upload ───
export const API_DASHBOARD_UPLOAD = "/api/dashboard/upload";

// ─── Dashboard – Users (admin) ───
export const API_DASHBOARD_USERS = "/api/dashboard/users";
export const API_DASHBOARD_USER = (id: string) =>
  `/api/dashboard/users/${id}`;

// ─── Public ───
export const API_RESTAURANTS_BY_SLUG = (slug: string) =>
  `/api/restaurants/${slug}`;
