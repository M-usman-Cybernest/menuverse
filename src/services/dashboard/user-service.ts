import { cloneDemoDataset } from "@/data/menuverse-demo";
import { connectToDatabase } from "@/lib/mongoose";
import { UserModel } from "@/lib/models/user";
import { RestaurantModel } from "@/lib/models/restaurant";
import { MenuCategoryModel } from "@/lib/models/menu-category";
import { MenuItemModel } from "@/lib/models/menu-item";
import { isDatabaseConfigured } from "@/lib/env";
import { hashPassword, verifyPassword } from "@/lib/auth";
import type {
  AuthSession,
  MenuCategory,
  MenuItem,
  RestaurantDataset,
  RestaurantProfile,
  UserRole,
} from "@/lib/types";
import { createId, slugify } from "@/lib/utils";
import {
  findUserById,
  getMemoryState,
  DbUserRecord,
  type StoredUserRecord,
} from "./data-utils";
import { serializeUser } from "./bundle-service";

export async function updateAccountProfile(
  currentSession: AuthSession,
  input: { name: string; email: string },
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    await UserModel.findOneAndUpdate({ appId: currentUser.id }, { $set: input });
    return { ...currentUser, ...input };
  }

  const state = getMemoryState();
  state.users = state.users.map((u) =>
    u.id === currentUser.id ? { ...u, ...input } : u,
  );
  return { ...currentUser, ...input };
}

export async function updateAccountPassword(
  currentSession: AuthSession,
  input: { currentPassword?: string; newPassword: string },
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) throw new Error("User not found.");

  // Check current password if provided
  if (input.currentPassword) {
    const isValid = await verifyPassword(input.currentPassword, currentUser.passwordHash);
    if (!isValid) throw new Error("Invalid current password.");
  }

  const newHash = await hashPassword(input.newPassword);

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    await UserModel.findOneAndUpdate({ appId: currentUser.id }, { $set: { passwordHash: newHash } });
    return true;
  }

  const state = getMemoryState();
  state.users = state.users.map((u) =>
    u.id === currentUser.id ? { ...u, passwordHash: newHash } : u,
  );
  return true;
}

export async function deleteTeamMember(
  currentSession: AuthSession,
  memberId: string,
) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser || currentUser.role !== "admin") throw new Error("Permission denied.");

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    // Cascade delete restaurant data if this user was an owner
    const restaurant = await RestaurantModel.findOne({ ownerId: memberId });
    if (restaurant) {
      await MenuItemModel.deleteMany({ restaurantId: restaurant.appId });
      await MenuCategoryModel.deleteMany({ restaurantId: restaurant.appId });
      await RestaurantModel.deleteOne({ appId: restaurant.appId });
    }
    await UserModel.deleteOne({ appId: memberId });
    return true;
  }

  const state = getMemoryState();
  const restaurant = state.restaurants.find((r) => r.ownerId === memberId);
  if (restaurant) {
    state.items = state.items.filter((i) => i.restaurantId !== restaurant.id);
    state.categories = state.categories.filter((c) => c.restaurantId !== restaurant.id);
    state.restaurants = state.restaurants.filter((r) => r.id !== restaurant.id);
  }
  state.users = state.users.filter((u) => u.id !== memberId);
  return true;
}

export async function listTeamMembers(currentSession: AuthSession) {
  const currentUser = await findUserById(currentSession.userId);
  if (!currentUser) return [];

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const users = currentSession.role === "admin"
      ? await UserModel.find({}).sort({ createdAt: 1 }).lean<DbUserRecord[]>()
      : await UserModel.find({ appId: currentSession.userId }).lean<DbUserRecord[]>();
    
    const restaurants = await RestaurantModel.find({})
      .select("appId ownerId")
      .lean<Array<{ appId: string; ownerId: string }>>();

    return users.map((user) => ({
      id: user.appId,
      name: user.name,
      email: user.email,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      createdAt: user.createdAt?.toISOString() || undefined,
      restaurantId: restaurants.find((r) => r.ownerId === user.appId)?.appId || null,
    }));
  }

  const state = getMemoryState();
  const users = currentSession.role === "admin"
    ? state.users
    : state.users.filter((u) => u.id === currentSession.userId);

  return users.map((u) => ({
    ...serializeUser(u),
    restaurantId: state.restaurants.find((r) => r.ownerId === u.id)?.id || null,
  }));
}

export async function createTeamMember(
  currentSession: AuthSession,
  input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    restaurantName?: string;
  },
) {
  if (currentSession.role !== "admin") throw new Error("Permission denied.");

  const existing = await findUserByEmail(input.email);
  if (existing) throw new Error("Email already in use.");

  if (input.role === "owner") {
    return registerOwner({
      name: input.name,
      email: input.email,
      password: input.password,
      restaurantName: input.restaurantName || `${input.name}'s Restaurant`,
    });
  }

  const passwordHash = await hashPassword(input.password);
  const userId = createId("user");

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const user = await UserModel.create({
      appId: userId,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      subscriptionStatus: "trial",
    });
    return serializeUser({
      id: user.appId,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
    } satisfies StoredUserRecord);
  }

  const state = getMemoryState();
  const user = {
    id: userId,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    subscriptionStatus: "trial",
    createdAt: new Date().toISOString(),
  } satisfies StoredUserRecord;
  state.users.push(user);
  return serializeUser(user);
}

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
  restaurantName: string;
}) {
  const passwordHash = await hashPassword(input.password);
  const userId = createId("user");
  const restaurantId = createId("restaurant");

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const ownerRecord = await UserModel.create({
      appId: userId,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: "owner",
      subscriptionStatus: "trial",
    });

    const existingRestaurants = await RestaurantModel.find({})
      .select("slug appId")
      .lean<Array<Pick<RestaurantProfile, "slug"> & { appId: string }>>();
    const slug = ensureUniqueSlug(slugify(input.restaurantName), existingRestaurants);
    
    const dataset = buildStarterDataset(input.restaurantName);
    dataset.restaurant.id = restaurantId;
    dataset.restaurant.slug = slug;
    dataset.restaurant.ownerId = userId;
    const restaurantData = {
      name: dataset.restaurant.name,
      slug: dataset.restaurant.slug,
      logoUrl: dataset.restaurant.logoUrl,
      coverImageUrl: dataset.restaurant.coverImageUrl,
      description: dataset.restaurant.description,
      heroNote: dataset.restaurant.heroNote,
      cuisineLabel: dataset.restaurant.cuisineLabel,
      locationLabel: dataset.restaurant.locationLabel,
      locationMapsUrl: dataset.restaurant.locationMapsUrl,
      supportEmail: dataset.restaurant.supportEmail,
      isPublished: dataset.restaurant.isPublished,
      timings: dataset.restaurant.timings,
      branches: dataset.restaurant.branches,
    };

    await RestaurantModel.create({
      appId: restaurantId,
      ownerId: userId,
      ...restaurantData,
    });

    await MenuCategoryModel.insertMany(
      dataset.categories.map((category: MenuCategory) => ({
          appId: category.id,
          restaurantId,
          name: category.name,
          order: category.order,
          description: category.description,
        })),
    );
    await MenuItemModel.insertMany(
      dataset.items.map((item: MenuItem) => ({
        appId: item.id,
        restaurantId,
        categoryId: item.categoryId,
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
      })),
    );

    return serializeUser({
      id: ownerRecord.appId,
      name: ownerRecord.name,
      email: ownerRecord.email,
      passwordHash: ownerRecord.passwordHash,
      role: ownerRecord.role,
      subscriptionStatus: ownerRecord.subscriptionStatus,
    } satisfies StoredUserRecord);
  }

  const state = getMemoryState();
  const ownerRecord = {
    id: userId,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: "owner",
    subscriptionStatus: "trial",
    createdAt: new Date().toISOString(),
  } satisfies StoredUserRecord;

  const slug = ensureUniqueSlug(slugify(input.restaurantName), state.restaurants);
  const dataset = buildStarterDataset(input.restaurantName);
  dataset.restaurant.id = restaurantId;
  dataset.restaurant.slug = slug;
  dataset.restaurant.ownerId = userId;

  state.users.push(ownerRecord);
  state.restaurants.push(dataset.restaurant);
  state.categories.push(
    ...dataset.categories.map((category: MenuCategory) => ({ ...category, restaurantId })),
  );
  state.items.push(
    ...dataset.items.map((item: MenuItem) => ({ ...item, restaurantId })),
  );

  return serializeUser(ownerRecord);
}

async function findUserByEmail(email: string) {
  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await UserModel.findOne({ email: email.toLowerCase() }).lean<DbUserRecord>();
    if (!record) {
      return null;
    }

    return {
      id: record.appId,
      name: record.name,
      email: record.email,
      passwordHash: record.passwordHash,
      role: record.role,
      subscriptionStatus: record.subscriptionStatus,
      createdAt: record.createdAt?.toISOString(),
    } satisfies StoredUserRecord;
  }
  const state = getMemoryState();
  return state.users.find((u) => u.email === email.toLowerCase()) ?? null;
}

function ensureUniqueSlug(base: string, existing: Array<{ slug: string }>) {
  let slug = base || "restaurant";
  let counter = 1;
  while (existing.some((restaurant) => restaurant.slug === slug)) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

function buildStarterDataset(name: string): RestaurantDataset {
  const demo = cloneDemoDataset();
  return {
    ...demo,
    restaurant: { ...demo.restaurant, name },
  };
}
