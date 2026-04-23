import { connectToDatabase } from "@/lib/mongoose";
import { RestaurantModel } from "@/lib/models/restaurant";
import { isDatabaseConfigured, env } from "@/lib/env";
import { getPublicRestaurantPath } from "@/lib/utils";
import type {
  RestaurantDataset,
  RestaurantProfile,
} from "@/lib/types";
import {
  findUserById,
  findFirstRestaurant,
  getMemoryState,
  getCategoriesForRestaurant,
  getItemsForRestaurant,
  ensureSeeded,
  type DbRestaurantRecord,
} from "./dashboard/data-utils";
import { serializeUser } from "./dashboard/bundle-service";

export async function findRestaurantBySlug(slug: string) {
  await ensureSeeded();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await RestaurantModel.findOne({ slug }).lean<DbRestaurantRecord>();
    if (!record) return null;
    return {
      id: record.appId,
      ownerId: record.ownerId,
      name: record.name,
      slug: record.slug,
      logoUrl: record.logoUrl,
      coverImageUrl: record.coverImageUrl,
      description: record.description,
      heroNote: record.heroNote,
      cuisineLabel: record.cuisineLabel,
      locationLabel: record.locationLabel,
      locationMapsUrl: record.locationMapsUrl,
      supportEmail: record.supportEmail,
      isPublished: record.isPublished,
      branches: record.branches ?? [],
      timings: record.timings ?? [],
    } satisfies RestaurantProfile;
  }

  const state = getMemoryState();
  return state.restaurants.find((r) => r.slug === slug) ?? null;
}

export async function buildRestaurantDataset(restaurant: RestaurantProfile) {
  const ownerRecord = await findUserById(restaurant.ownerId);
  if (!ownerRecord) return null;

  const [categories, items] = await Promise.all([
    getCategoriesForRestaurant(restaurant.id),
    getItemsForRestaurant(restaurant.id),
  ]);

  return {
    owner: serializeUser(ownerRecord),
    restaurant,
    categories,
    items,
  } satisfies RestaurantDataset;
}

export async function getRestaurantDatasetBySlug(slug: string) {
  const restaurant = await findRestaurantBySlug(slug);
  if (!restaurant || !restaurant.isPublished) return null;
  return buildRestaurantDataset(restaurant);
}

export async function getDefaultRestaurantDataset() {
  const preferred = await findRestaurantBySlug(env.defaultRestaurantSlug || "restaurant");
  if (preferred?.isPublished) return buildRestaurantDataset(preferred);

  const fallback = await findFirstRestaurant();
  if (!fallback || !fallback.isPublished) return null;
  return buildRestaurantDataset(fallback);
}

export async function getPublicRestaurantPathForSlug(slug: string) {
  return getPublicRestaurantPath(slug, env.defaultRestaurantSlug);
}
