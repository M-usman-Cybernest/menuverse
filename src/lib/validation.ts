import { z } from "zod";
import type { DietaryTag } from "@/lib/types";

import { DIETARY_TAGS, USER_ROLES, WEEK_DAYS } from "@/lib/constants";
import {
  EXTERNAL_STORAGE_PROVIDERS,
  ITEM_ASSET_TARGETS,
} from "@/lib/storage";

export const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(6),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(6),
  restaurantName: z.string().trim().min(2),
});

export const createTeamMemberSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(6),
  role: z.enum(USER_ROLES),
  restaurantName: z.string().trim().optional(),
});

const branchSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  mapsUrl: z.string().trim().url(),
  directionsLabel: z.string().trim().min(1),
  tableCount: z.number().min(0),
});

const timingSchema = z.object({
  day: z.enum(WEEK_DAYS),
  open: z.string().min(1),
  close: z.string().min(1),
  closed: z.boolean().optional(),
});

const restaurantSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  logoUrl: z.string().trim().min(1),
  coverImageUrl: z.string().trim().min(1),
  description: z.string().trim().min(1),
  heroNote: z.string().trim().min(1),
  cuisineLabel: z.string().trim().min(1),
  locationLabel: z.string().trim().min(1),
  locationMapsUrl: z.string().trim().url(),
  supportEmail: z.email(),
  isPublished: z.boolean(),
  announcementBar: z.object({
    text: z.string().trim(),
    show: z.boolean(),
  }).optional(),
  timings: z.array(timingSchema),
  branches: z.array(branchSchema),
});

const categorySchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  name: z.string().trim().min(1),
  order: z.number().min(0),
  description: z.string().trim().min(1),
});

const itemSchema = z.object({
  id: z.string().min(1),
  restaurantId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().default(""),
  price: z.number().min(0),
  imageUrl: z.string().trim().min(1),
  imageUrls: z.array(z.string()).optional(),
  arModelUrl: z.string().trim().optional(),
  arModelIosUrl: z.string().trim().optional(),
  dietaryTags: z
    .array(z.string())
    .transform((tags) =>
      tags.filter((tag) => (DIETARY_TAGS as readonly string[]).includes(tag)) as DietaryTag[]
    )
    .default([]),
  prepTime: z.string().trim().min(1),
  featured: z.boolean().optional(),
  qrCodeUrl: z.string().trim().optional(),
  availableBranches: z.array(z.string()).default([]),
  deliveryTime: z.object({
    value: z.number().default(0),
    unit: z.enum(["minutes", "hours", "days", "weeks", "months"]).default("minutes"),
  }).optional(),
});

export const saveRestaurantSchema = z.object({
  restaurant: restaurantSchema,
  categories: z.array(categorySchema),
  items: z.array(itemSchema),
});

const itemInputSchema = z.object({
  categoryId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().default(""),
  price: z.coerce.number().min(0),
  imageUrl: z.string().trim().optional(),
  imageUrls: z.array(z.string()).optional(),
  arModelUrl: z.string().trim().optional(),
  arModelIosUrl: z.string().trim().optional(),
  dietaryTags: z
    .array(z.string())
    .transform((tags) =>
      tags.filter((tag) => (DIETARY_TAGS as readonly string[]).includes(tag)) as DietaryTag[]
    )
    .optional(),
  prepTime: z.string().trim().optional(),
  featured: z.boolean().optional(),
  availableBranches: z.array(z.string()).default([]),
  deliveryTime: z.object({
    value: z.coerce.number().default(0),
    unit: z.enum(["minutes", "hours", "days", "weeks", "months"]).default("minutes"),
  }).optional(),
});

export const createItemSchema = itemInputSchema;
export const updateItemSchema = itemInputSchema.partial();

export const externalAssetSchema = z.object({
  fileId: z.string().trim().optional(),
  origin: z.string().trim().optional(),
  popup: z.coerce.boolean().optional(),
  provider: z.enum(EXTERNAL_STORAGE_PROVIDERS).optional(),
  target: z.enum(ITEM_ASSET_TARGETS),
  url: z.string().trim().min(1),
});

export const googleDriveFileQuerySchema = z.object({
  target: z.enum(ITEM_ASSET_TARGETS),
});
