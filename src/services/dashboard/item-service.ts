import { connectToDatabase } from "@/lib/mongoose";
import { MenuItemModel } from "@/lib/models/menu-item";
import { isDatabaseConfigured } from "@/lib/env";
import { createId } from "@/lib/utils";
import type { AuthSession, DietaryTag, MenuItem } from "@/lib/types";
import {
  findUserById,
  findFirstRestaurant,
  findRestaurantByOwnerId,
  getCategoriesForRestaurant,
  getMemoryState,
  getItemsForRestaurant,
} from "./data-utils";

export async function createItem(
  currentSession: AuthSession,
  input: {
    categoryId: string;
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
    arModelUrl?: string;
    arModelIosUrl?: string;
    dietaryTags?: DietaryTag[];
    prepTime?: string;
  },
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");
  if (!["admin", "owner"].includes(currentUser.role)) throw new Error("Permission denied.");

  const restaurant =
    currentUser.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(currentUser.id);
  if (!restaurant) throw new Error("Restaurant not found.");
  if (!input.categoryId) throw new Error("Category is required.");

  const categories = await getCategoriesForRestaurant(restaurant.id);
  const categoryExists = categories.some((category) => category.id === input.categoryId);
  if (!categoryExists) {
    throw new Error("Selected category does not exist for this restaurant.");
  }

  const newId = createId("item");

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    await MenuItemModel.create({
      appId: newId,
      restaurantId: restaurant.id,
      categoryId: input.categoryId,
      name: input.name.trim(),
      description: input.description.trim(),
      price: input.price,
      imageUrl: input.imageUrl,
      arModelUrl: input.arModelUrl,
      arModelIosUrl: input.arModelIosUrl,
      dietaryTags: input.dietaryTags ?? [],
      prepTime: input.prepTime ?? "15-20 min",
    });
    return getItemsForRestaurant(restaurant.id);
  }

  const state = getMemoryState();
  state.items.push({
    id: newId,
    restaurantId: restaurant.id,
    categoryId: input.categoryId,
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    imageUrl: input.imageUrl ?? "",
    arModelUrl: input.arModelUrl,
    arModelIosUrl: input.arModelIosUrl,
    dietaryTags: input.dietaryTags ?? [],
    prepTime: input.prepTime ?? "15-20 min",
  });
  return getItemsForRestaurant(restaurant.id);
}

export async function updateItemById(
  currentSession: AuthSession,
  itemId: string,
  input: Partial<MenuItem>,
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");
  if (!["admin", "owner"].includes(currentUser.role)) throw new Error("Permission denied.");

  const restaurant =
    currentUser.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(currentUser.id);
  if (!restaurant) throw new Error("Restaurant not found.");

  if (input.categoryId) {
    const categories = await getCategoriesForRestaurant(restaurant.id);
    const categoryExists = categories.some((category) => category.id === input.categoryId);
    if (!categoryExists) {
      throw new Error("Selected category does not exist for this restaurant.");
    }
  }

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    await MenuItemModel.findOneAndUpdate({ appId: itemId }, { $set: input });
    return getItemsForRestaurant(restaurant.id);
  }

  const state = getMemoryState();
  state.items = state.items.map((i) =>
    i.id === itemId ? { ...i, ...input } : i,
  );
  return getItemsForRestaurant(restaurant.id);
}

export async function deleteItemById(
  currentSession: AuthSession,
  itemId: string,
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
    await MenuItemModel.deleteOne({ appId: itemId });
    return getItemsForRestaurant(restaurant?.id ?? "");
  }

  const state = getMemoryState();
  state.items = state.items.filter((i) => i.id !== itemId);
  return getItemsForRestaurant(restaurant?.id ?? "");
}
