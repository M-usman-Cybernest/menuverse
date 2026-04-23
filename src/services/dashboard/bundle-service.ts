import { connectToDatabase } from "@/lib/mongoose";
import { RestaurantModel } from "@/lib/models/restaurant";
import { MenuCategoryModel } from "@/lib/models/menu-category";
import { MenuItemModel } from "@/lib/models/menu-item";
import { isDatabaseConfigured } from "@/lib/env";
import { createId } from "@/lib/utils";
import type {
  AuthSession,
  DashboardBundle,
  MenuCategory,
  MenuItem,
  RestaurantProfile,
  TenantUser,
} from "@/lib/types";
import {
  findUserById,
  findFirstRestaurant,
  findRestaurantByOwnerId,
  getMemoryState,
  getCategoriesForRestaurant,
  getItemsForRestaurant,
  StoredUserRecord,
} from "./data-utils";

export function serializeUser(record: StoredUserRecord): TenantUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    subscriptionStatus: record.subscriptionStatus,
    createdAt: record.createdAt,
  };
}

export function buildDashboardBundle(
  user: TenantUser,
  restaurant: RestaurantProfile,
  categories: MenuCategory[],
  items: MenuItem[],
): DashboardBundle {
  return {
    currentUser: user,
    restaurant,
    categories,
    items,
    permissions: {
      canManageRestaurant: user.role === "admin" || user.role === "owner",
      canManageUsers: user.role === "admin",
    },
  };
}

export async function getDashboardBundleForSession(currentSession: AuthSession): Promise<DashboardBundle> {
  const user = await findUserById(currentSession.userId);
  if (!user) throw new Error("User not found.");

  const restaurant =
    user.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(user.id);

  if (!restaurant) {
    throw new Error("No restaurant associated with this account.");
  }

  const [categories, items] = await Promise.all([
    getCategoriesForRestaurant(restaurant.id),
    getItemsForRestaurant(restaurant.id),
  ]);

  return buildDashboardBundle(serializeUser(user), restaurant, categories, items);
}

export async function saveRestaurantBundle(
  currentSession: AuthSession,
  payload: {
    restaurant: RestaurantProfile;
    categories: MenuCategory[];
    items: MenuItem[];
  },
): Promise<DashboardBundle> {
  const user = await findUserById(currentSession.userId);
  if (!user) throw new Error("User not found.");

  // For simplicity, we assume the restaurant ID in payload is the one owned by user
  const restaurantId = payload.restaurant.id;
  const categories = payload.categories.map((c, i) => ({
    ...c,
    id: c.id || createId("category"),
    restaurantId,
    order: i,
  }));
  const items = payload.items.map((it) => ({
    ...it,
    id: it.id || createId("item"),
    restaurantId,
    categoryId: categories.find((c) => c.id === it.categoryId)?.id || categories[0]?.id,
  }));

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    await RestaurantModel.findOneAndUpdate({ appId: restaurantId }, { $set: payload.restaurant });
    await MenuCategoryModel.deleteMany({ restaurantId });
    await MenuCategoryModel.insertMany(categories.map(c => ({
      appId: c.id,
      restaurantId: c.restaurantId,
      name: c.name,
      order: c.order,
      description: c.description,
    })));
    await MenuItemModel.deleteMany({ restaurantId });
    await MenuItemModel.insertMany(items.map(it => ({
      appId: it.id,
      restaurantId: it.restaurantId,
      categoryId: it.categoryId,
      name: it.name,
      description: it.description,
      price: it.price,
      imageUrl: it.imageUrl,
      arModelUrl: it.arModelUrl,
      arModelIosUrl: it.arModelIosUrl,
      dietaryTags: it.dietaryTags,
      prepTime: it.prepTime,
      featured: it.featured,
    })));
  } else {
    const state = getMemoryState();
    state.restaurants = state.restaurants.map(r => r.id === restaurantId ? payload.restaurant : r);
    state.categories = state.categories.filter(c => c.restaurantId !== restaurantId).concat(categories);
    state.items = state.items.filter(it => it.restaurantId !== restaurantId).concat(items as any);
  }

  return buildDashboardBundle(serializeUser(user), payload.restaurant, categories, items as any);
}
