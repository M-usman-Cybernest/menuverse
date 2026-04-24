export type UserRole = "admin" | "owner" | "staff";
export type SubscriptionStatus = "trial" | "active" | "past_due";

export type DietaryTag =
  | "Vegan"
  | "Vegetarian"
  | "GF"
  | "Halal"
  | "Spicy"
  | "Chef's Pick"
  | "New";

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type TenantUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  createdAt?: string;
};

export type AuthSession = {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Branch = {
  id: string;
  name: string;
  address: string;
  city: string;
  mapsUrl: string;
  directionsLabel: string;
  tableCount: number;
};

export type OperatingWindow = {
  day: DayOfWeek;
  open: string;
  close: string;
  closed?: boolean;
};

export type RestaurantProfile = {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  logoUrl: string;
  coverImageUrl: string;
  description: string;
  heroNote: string;
  cuisineLabel: string;
  locationLabel: string;
  locationMapsUrl: string;
  supportEmail: string;
  isPublished: boolean;
  timings: OperatingWindow[];
  branches: Branch[];
};

export type MenuCategory = {
  id: string;
  restaurantId: string;
  name: string;
  order: number;
  description: string;
};

export type MenuItem = {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  arModelUrl?: string;
  arModelIosUrl?: string;
  dietaryTags: DietaryTag[];
  prepTime: string;
  featured?: boolean;
  qrCodeUrl?: string;
};

export type RestaurantDataset = {
  owner: TenantUser;
  restaurant: RestaurantProfile;
  categories: MenuCategory[];
  items: MenuItem[];
};

export type DashboardPermissions = {
  canManageRestaurant: boolean;
  canManageUsers: boolean;
};

export type DashboardBundle = {
  currentUser: TenantUser;
  restaurant: RestaurantProfile | null;
  categories: MenuCategory[];
  items: MenuItem[];
  permissions: DashboardPermissions;
};

export type TeamMember = TenantUser & {
  restaurantId?: string | null;
};
