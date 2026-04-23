import { connectToDatabase } from "@/lib/mongoose";
import { MenuItemModel } from "@/lib/models/menu-item";
import { MenuCategoryModel } from "@/lib/models/menu-category";
import { isDatabaseConfigured } from "@/lib/env";
import { hasArAsset } from "@/lib/storage";
import type { AuthSession } from "@/lib/types";
import {
  findUserById,
  findFirstRestaurant,
  findRestaurantByOwnerId,
  getMemoryState,
} from "./data-utils";

export async function getDashboardStats(currentSession: AuthSession) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");

  const restaurant =
    currentUser.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(currentUser.id);
  if (!restaurant) return { activeItems: 0, categories: 0, arModels: 0, locations: 0 };

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const [activeItems, categories, arModels] = await Promise.all([
      MenuItemModel.countDocuments({ restaurantId: restaurant.id }),
      MenuCategoryModel.countDocuments({ restaurantId: restaurant.id }),
      MenuItemModel.countDocuments({
        restaurantId: restaurant.id,
        $or: [
          { arModelUrl: { $exists: true, $ne: "" } },
          { arModelIosUrl: { $exists: true, $ne: "" } },
        ],
      }),
    ]);
    return {
      activeItems,
      categories,
      arModels,
      locations: restaurant.branches.length,
    };
  }

  const state = getMemoryState();
  const items = state.items.filter((i) => i.restaurantId === restaurant.id);
  const categories = state.categories.filter((c) => c.restaurantId === restaurant.id);
  const arModels = items.filter(hasArAsset).length;

  return {
    activeItems: items.length,
    categories: categories.length,
    arModels,
    locations: restaurant.branches.length,
  };
}
