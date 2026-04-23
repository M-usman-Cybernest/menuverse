import { connectToDatabase } from "@/lib/mongoose";
import { MenuCategoryModel } from "@/lib/models/menu-category";
import { MenuItemModel } from "@/lib/models/menu-item";
import { isDatabaseConfigured } from "@/lib/env";
import { createId } from "@/lib/utils";
import type { AuthSession } from "@/lib/types";
import {
  findUserById,
  findFirstRestaurant,
  findRestaurantByOwnerId,
  getMemoryState,
  getCategoriesForRestaurant,
} from "./data-utils";

export async function createCategory(
  currentSession: AuthSession,
  input: { name: string; description: string },
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");
  if (!["admin", "owner"].includes(currentUser.role)) throw new Error("Permission denied.");

  const restaurant =
    currentUser.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(currentUser.id);
  if (!restaurant) throw new Error("Restaurant not found.");

  const newId = createId("category");

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const count = await MenuCategoryModel.countDocuments({ restaurantId: restaurant.id });
    await MenuCategoryModel.create({
      appId: newId,
      restaurantId: restaurant.id,
      name: input.name.trim(),
      description: input.description.trim(),
      order: count,
    });
    return getCategoriesForRestaurant(restaurant.id);
  }

  const state = getMemoryState();
  const count = state.categories.filter((c) => c.restaurantId === restaurant.id).length;
  state.categories.push({
    id: newId,
    restaurantId: restaurant.id,
    name: input.name.trim(),
    description: input.description.trim(),
    order: count,
  });
  return getCategoriesForRestaurant(restaurant.id);
}

export async function updateCategoryById(
  currentSession: AuthSession,
  categoryId: string,
  input: Partial<{ name: string; description: string; order: number }>,
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");
  if (!["admin", "owner"].includes(currentUser.role)) throw new Error("Permission denied.");

  const restaurant =
    currentUser.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(currentUser.id);

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    await MenuCategoryModel.findOneAndUpdate({ appId: categoryId }, { $set: input });
    return getCategoriesForRestaurant(restaurant?.id ?? "");
  }

  const state = getMemoryState();
  state.categories = state.categories.map((c) =>
    c.id === categoryId ? { ...c, ...input } : c,
  );
  return getCategoriesForRestaurant(restaurant?.id ?? "");
}

export async function deleteCategoryById(
  currentSession: AuthSession,
  categoryId: string,
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");
  if (!["admin", "owner"].includes(currentUser.role)) throw new Error("Permission denied.");

  const restaurant =
    currentUser.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(currentUser.id);

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    await MenuCategoryModel.deleteOne({ appId: categoryId });
    await MenuItemModel.deleteMany({ categoryId });
    return getCategoriesForRestaurant(restaurant?.id ?? "");
  }

  const state = getMemoryState();
  state.categories = state.categories.filter((c) => c.id !== categoryId);
  state.items = state.items.filter((i) => i.categoryId !== categoryId);
  return getCategoriesForRestaurant(restaurant?.id ?? "");
}
