import { cloneDemoDataset } from "@/data/menuverse-demo";
import { env, isDatabaseConfigured } from "@/lib/env";
import { MenuCategoryModel } from "@/lib/models/menu-category";
import { MenuItemModel } from "@/lib/models/menu-item";
import { RestaurantModel } from "@/lib/models/restaurant";
import { UserModel } from "@/lib/models/user";
import { connectToDatabase } from "@/lib/mongoose";
import type {
  MenuCategory,
  MenuItem,
  RestaurantProfile,
  TenantUser,
  UserRole,
} from "@/lib/types";
import { createId } from "@/lib/utils";

export type StoredUserRecord = TenantUser & {
  passwordHash: string;
};

export type MemoryState = {
  users: StoredUserRecord[];
  restaurants: RestaurantProfile[];
  categories: MenuCategory[];
  items: MenuItem[];
};

declare global {
  var menuverseMemoryState: MemoryState | undefined;
  var menuverseMemorySeedPromise: Promise<void> | undefined;
  var menuverseDatabaseSeedPromise: Promise<void> | undefined;
}

export function getMemoryState(): MemoryState {
  if (!global.menuverseMemoryState) {
    global.menuverseMemoryState = {
      users: [],
      restaurants: [],
      categories: [],
      items: [],
    };
  }
  return global.menuverseMemoryState;
}

export async function ensureSeeded() {
  if (isDatabaseConfigured()) {
    if (!global.menuverseDatabaseSeedPromise) {
      global.menuverseDatabaseSeedPromise = (async () => {
        await connectToDatabase();
        const count = await UserModel.countDocuments();
        if (count > 0) return;

        const demo = cloneDemoDataset();
        const adminId = createId("user");
        const restaurantId = createId("restaurant");

        await UserModel.create({
          appId: adminId,
          name: "Admin User",
          email: env.adminEmail || "admin@menuverse.test",
          passwordHash: "$2a$12$DUMMYHASH",
          role: "admin",
          subscriptionStatus: "active",
          isVerified: true,
        });

        await RestaurantModel.create({
          appId: restaurantId,
          ownerId: adminId,
          name: demo.restaurant.name,
          slug: demo.restaurant.slug,
          logoUrl: demo.restaurant.logoUrl,
          coverImageUrl: demo.restaurant.coverImageUrl,
          description: demo.restaurant.description,
          heroNote: demo.restaurant.heroNote,
          cuisineLabel: demo.restaurant.cuisineLabel,
          locationLabel: demo.restaurant.locationLabel,
          locationMapsUrl: demo.restaurant.locationMapsUrl,
          supportEmail: demo.restaurant.supportEmail,
          isPublished: demo.restaurant.isPublished,
          branches: demo.restaurant.branches,
          timings: demo.restaurant.timings,
        });

        for (const cat of demo.categories) {
          const catId = createId("category");
          await MenuCategoryModel.create({
            appId: catId,
            restaurantId,
            name: cat.name,
            order: cat.order,
            description: cat.description,
          });

          for (const item of demo.items.filter((i) => i.categoryId === cat.id)) {
            const itemData = {
              name: item.name,
              description: item.description,
              price: item.price,
              imageUrl: item.imageUrl,
              arModelUrl: item.arModelUrl,
              arModelIosUrl: item.arModelIosUrl,
              qrCodeUrl: item.qrCodeUrl,
              dietaryTags: item.dietaryTags,
              prepTime: item.prepTime,
              featured: item.featured,
            };
            await MenuItemModel.create({
              appId: createId("item"),
              restaurantId,
              categoryId: catId,
              ...itemData,
            });
          }
        }
      })();
    }
    await global.menuverseDatabaseSeedPromise;
  } else {
    if (!global.menuverseMemorySeedPromise) {
      global.menuverseMemorySeedPromise = (async () => {
        const state = getMemoryState();
        if (state.users.length > 0) return;

        const demo = cloneDemoDataset();
        const adminId = createId("user");
        const restaurantId = createId("restaurant");

        state.users.push({
          id: adminId,
          name: "Admin User",
          email: env.adminEmail || "admin@menuverse.test",
          role: "admin",
          subscriptionStatus: "active",
          isVerified: true,
          passwordHash: "$2a$12$DUMMYHASH",
        });

        state.restaurants.push({
          ...demo.restaurant,
          id: restaurantId,
          ownerId: adminId,
        });

        for (const cat of demo.categories) {
          const catId = createId("category");
          state.categories.push({ ...cat, id: catId, restaurantId });
          for (const item of demo.items.filter((i) => i.categoryId === cat.id)) {
            state.items.push({ ...item, id: createId("item"), restaurantId, categoryId: catId });
          }
        }
      })();
    }
    await global.menuverseMemorySeedPromise;
  }
}

/* ─────────────────────────────────────────────
   DATABASE TYPES
   ───────────────────────────────────────────── */

export type DbUserRecord = {
  appId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  subscriptionStatus: TenantUser["subscriptionStatus"];
  isVerified: boolean;
  createdAt?: Date;
};

export type DbRestaurantRecord = {
  appId: string;
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
  branches: RestaurantProfile["branches"];
  timings: RestaurantProfile["timings"];
};

export type DbCategoryRecord = {
  appId: string;
  restaurantId: string;
  name: string;
  order: number;
  description: string;
};

export type DbItemRecord = {
  appId: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  arModelUrl?: string;
  arModelIosUrl?: string;
  qrCodeUrl?: string;
  dietaryTags: MenuItem["dietaryTags"];
  prepTime: string;
  featured?: boolean;
  availableBranches?: string[];
  deliveryTime?: MenuItem["deliveryTime"];
};

/* ─────────────────────────────────────────────
   CORE LOOKUP FUNCTIONS
   ───────────────────────────────────────────── */

export async function findUserById(id: string) {
  await ensureSeeded();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await UserModel.findOne({ appId: id }).lean<DbUserRecord>();
    if (!record) return null;
    return {
      id: record.appId,
      name: record.name,
      email: record.email,
      role: record.role,
      subscriptionStatus: record.subscriptionStatus,
      isVerified: record.isVerified ?? false,
      passwordHash: record.passwordHash,
    } as TenantUser & { passwordHash: string };
  }

  const state = getMemoryState();
  return state.users.find((u) => u.id === id) ?? null;
}

export async function findRestaurantByOwnerId(ownerId: string) {
  await ensureSeeded();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await RestaurantModel.findOne({ ownerId }).lean<DbRestaurantRecord>();
    if (!record) return null;
    return mapDbRestaurant(record);
  }

  const state = getMemoryState();
  return state.restaurants.find((r) => r.ownerId === ownerId) ?? null;
}

export async function findFirstRestaurant() {
  await ensureSeeded();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await RestaurantModel.findOne({}).sort({ createdAt: 1 }).lean<DbRestaurantRecord>();
    if (!record) return null;
    return mapDbRestaurant(record);
  }

  const state = getMemoryState();
  return state.restaurants[0] ?? null;
}

export async function getCategoriesForRestaurant(restaurantId: string) {
  await ensureSeeded();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const records = await MenuCategoryModel.find({ restaurantId }).sort({ order: 1 }).lean<DbCategoryRecord[]>();
    return records.map((r) => ({
      id: r.appId,
      restaurantId: r.restaurantId,
      name: r.name,
      order: r.order,
      description: r.description,
    }));
  }

  const state = getMemoryState();
  return state.categories.filter((c) => c.restaurantId === restaurantId).sort((a, b) => a.order - b.order);
}

export async function getItemsForRestaurant(restaurantId: string) {
  await ensureSeeded();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const records = await MenuItemModel.find({ restaurantId }).lean<DbItemRecord[]>();
    return records.map((r) => ({
      id: r.appId,
      restaurantId: r.restaurantId,
      categoryId: r.categoryId,
      name: r.name,
      description: r.description,
      price: r.price,
      imageUrl: r.imageUrl,
      arModelUrl: r.arModelUrl,
      arModelIosUrl: r.arModelIosUrl,
      qrCodeUrl: r.qrCodeUrl,
      dietaryTags: r.dietaryTags ?? [],
      prepTime: r.prepTime,
      featured: r.featured,
      availableBranches: r.availableBranches ?? [],
      deliveryTime: r.deliveryTime ?? { value: 0, unit: "minutes" },
    }));
  }

  const state = getMemoryState();
  return state.items.filter((i) => i.restaurantId === restaurantId);
}

function mapDbRestaurant(record: DbRestaurantRecord): RestaurantProfile {
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
  };
}
