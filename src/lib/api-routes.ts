
// ─── Auth ───
export const API_AUTH_LOGIN = "/api/auth/login";
export const API_AUTH_SIGNUP = "/api/auth/signup";
export const API_AUTH_LOGOUT = "/api/auth/logout";
export const API_AUTH_SESSION = "/api/auth/session";

// ─── Dashboard ───
export const API_DASHBOARD_RESTAURANT = "/api/dashboard/restaurant";
export const API_DASHBOARD_UPLOAD = "/api/dashboard/upload";
export const API_DASHBOARD_USERS = "/api/dashboard/users";

// ─── Public ───
export const API_RESTAURANTS_BY_SLUG = (slug: string) =>
  `/api/restaurants/${slug}`;
