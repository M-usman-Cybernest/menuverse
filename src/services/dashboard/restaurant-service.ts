import { connectToDatabase } from "@/lib/mongoose";
import { RestaurantModel } from "@/lib/models/restaurant";
import { isDatabaseConfigured } from "@/lib/env";
import type { AuthSession, RestaurantProfile } from "@/lib/types";
import {
  findUserById,
  findFirstRestaurant,
  findRestaurantByOwnerId,
  getMemoryState,
} from "./data-utils";

export async function updateRestaurantProfile(
  currentSession: AuthSession,
  input: Partial<RestaurantProfile>,
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");
  if (!["admin", "owner"].includes(currentUser.role)) throw new Error("Permission denied.");

  const restaurant =
    currentUser.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(currentUser.id);
  if (!restaurant) throw new Error("Restaurant not found.");

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    await RestaurantModel.findOneAndUpdate({ appId: restaurant.id }, { $set: input });
    return { ...restaurant, ...input };
  }

  const state = getMemoryState();
  state.restaurants = state.restaurants.map((r) =>
    r.id === restaurant.id ? { ...r, ...input } : r,
  );
  return { ...restaurant, ...input };
}

export async function updateBranches(
  currentSession: AuthSession,
  branches: RestaurantProfile["branches"],
) {
  return updateRestaurantProfile(currentSession, { branches });
}

export async function updateTimings(
  currentSession: AuthSession,
  timings: RestaurantProfile["timings"],
) {
  return updateRestaurantProfile(currentSession, { timings });
}
