import { cloneDemoDataset } from "@/data/menuverse-demo";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { env, isDatabaseConfigured } from "@/lib/env";
import { MenuCategoryModel } from "@/lib/models/menu-category";
import { MenuItemModel } from "@/lib/models/menu-item";
import { RestaurantModel } from "@/lib/models/restaurant";
import { UserModel } from "@/lib/models/user";
import { connectToDatabase } from "@/lib/mongoose";
import type {
  AuthSession,
  DashboardBundle,
  MenuCategory,
  MenuItem,
  RestaurantDataset,
  RestaurantProfile,
  TeamMember,
  TenantUser,
  UserRole,
} from "@/lib/types";
import { createId, getPublicRestaurantPath, slugify } from "@/lib/utils";

type StoredUserRecord = TenantUser & {
  passwordHash: string;
};

type MemoryState = {
  users: StoredUserRecord[];
  restaurants: RestaurantProfile[];
  categories: MenuCategory[];
  items: MenuItem[];
};

type DbUserRecord = {
  appId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  subscriptionStatus: TenantUser["subscriptionStatus"];
  createdAt?: Date;
};

type DbRestaurantRecord = {
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

type DbCategoryRecord = {
  appId: string;
  restaurantId: string;
  name: string;
  order: number;
  description: string;
};

type DbItemRecord = {
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
};

declare global {
  var menuverseMemoryState: MemoryState | undefined;
  var menuverseMemorySeedPromise: Promise<void> | undefined;
  var menuverseDatabaseSeedPromise: Promise<void> | undefined;
}

function buildStarterDataset(owner: TenantUser, restaurantName?: string) {
  const demo = cloneDemoDataset();
  const restaurantId = createId("restaurant");
  const categoryIds = demo.categories.map(() => createId("category"));
  const itemIds = demo.items.map(() => createId("item"));
  const resolvedRestaurantName =
    restaurantName ?? env.seedRestaurantName ?? "MenuVerse Restaurant";
  const fallbackSlug = env.defaultRestaurantSlug || "restaurant";
  const slugBase = slugify(resolvedRestaurantName) || fallbackSlug;

  return {
    owner,
    restaurant: {
      ...demo.restaurant,
      id: restaurantId,
      ownerId: owner.id,
      name: resolvedRestaurantName,
      slug: slugBase,
      supportEmail: owner.email,
    },
    categories: demo.categories.map((category, index) => ({
      ...category,
      id: categoryIds[index],
      restaurantId,
    })),
    items: demo.items.map((item, index) => ({
      ...item,
      id: itemIds[index],
      restaurantId,
      categoryId:
        categoryIds[
          demo.categories.findIndex((category) => category.id === item.categoryId)
        ],
    })),
  } satisfies RestaurantDataset;
}

function serializeUser(record: StoredUserRecord): TenantUser {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    subscriptionStatus: record.subscriptionStatus,
    createdAt: record.createdAt,
  };
}

function buildDashboardBundle(
  currentUser: TenantUser,
  restaurant: RestaurantProfile | null,
  categories: MenuCategory[],
  items: MenuItem[],
): DashboardBundle {
  return {
    currentUser,
    restaurant,
    categories,
    items,
    permissions: {
      canManageRestaurant:
        currentUser.role === "admin" || currentUser.role === "owner",
      canManageUsers: currentUser.role === "admin",
    },
  };
}

function ensureUniqueSlug(
  requestedSlug: string,
  restaurants: Array<{ id: string; slug: string }>,
  currentId?: string,
) {
  const base = slugify(requestedSlug) || env.defaultRestaurantSlug;
  let nextSlug = base;
  let counter = 2;

  while (
    restaurants.some(
      (restaurant) => restaurant.slug === nextSlug && restaurant.id !== currentId,
    )
  ) {
    nextSlug = `${base}-${counter}`;
    counter += 1;
  }

  return nextSlug;
}

async function ensureMemorySeedData() {
  if (global.menuverseMemoryState) {
    return;
  }

  if (!global.menuverseMemorySeedPromise) {
    global.menuverseMemorySeedPromise = (async () => {
      const admin: StoredUserRecord = {
        id: createId("user"),
        name: env.adminName,
        email: env.adminEmail.toLowerCase(),
        passwordHash: await hashPassword(env.adminPassword),
        role: "admin",
        subscriptionStatus: "active",
        createdAt: new Date().toISOString(),
      };

      const owner: StoredUserRecord = {
        id: createId("user"),
        name: env.seedOwnerName,
        email: env.seedOwnerEmail.toLowerCase(),
        passwordHash: await hashPassword(env.seedOwnerPassword),
        role: "owner",
        subscriptionStatus: "trial",
        createdAt: new Date().toISOString(),
      };

      const starterDataset = buildStarterDataset(
        serializeUser(owner),
        env.seedRestaurantName,
      );
      starterDataset.restaurant.slug = env.defaultRestaurantSlug;

      global.menuverseMemoryState = {
        users: [admin, owner],
        restaurants: [starterDataset.restaurant],
        categories: starterDataset.categories,
        items: starterDataset.items,
      };
    })();
  }

  await global.menuverseMemorySeedPromise;
}

async function ensureDatabaseSeedData() {
  if (!isDatabaseConfigured()) {
    return;
  }

  if (!global.menuverseDatabaseSeedPromise) {
    global.menuverseDatabaseSeedPromise = (async () => {
      await connectToDatabase();

      let admin = await UserModel.findOne({ email: env.adminEmail.toLowerCase() });
      if (!admin) {
        admin = await UserModel.create({
          appId: createId("user"),
          name: env.adminName,
          email: env.adminEmail.toLowerCase(),
          passwordHash: await hashPassword(env.adminPassword),
          role: "admin",
          subscriptionStatus: "active",
        });
      }

      let owner = await UserModel.findOne({ email: env.seedOwnerEmail.toLowerCase() });
      if (!owner) {
        owner = await UserModel.create({
          appId: createId("user"),
          name: env.seedOwnerName,
          email: env.seedOwnerEmail.toLowerCase(),
          passwordHash: await hashPassword(env.seedOwnerPassword),
          role: "owner",
          subscriptionStatus: "trial",
        });
      }

      const restaurant = await RestaurantModel.findOne({
        slug: env.defaultRestaurantSlug,
      });

      if (!restaurant) {
        const starterDataset = buildStarterDataset(
          {
            id: owner.appId,
            name: owner.name,
            email: owner.email,
            role: owner.role,
            subscriptionStatus: owner.subscriptionStatus,
          },
          env.seedRestaurantName,
        );

        starterDataset.restaurant.slug = env.defaultRestaurantSlug;

        await RestaurantModel.create({
          appId: starterDataset.restaurant.id,
          ownerId: starterDataset.restaurant.ownerId,
          name: starterDataset.restaurant.name,
          slug: starterDataset.restaurant.slug,
          logoUrl: starterDataset.restaurant.logoUrl,
          coverImageUrl: starterDataset.restaurant.coverImageUrl,
          description: starterDataset.restaurant.description,
          heroNote: starterDataset.restaurant.heroNote,
          cuisineLabel: starterDataset.restaurant.cuisineLabel,
          locationLabel: starterDataset.restaurant.locationLabel,
          locationMapsUrl: starterDataset.restaurant.locationMapsUrl,
          supportEmail: starterDataset.restaurant.supportEmail,
          isPublished: starterDataset.restaurant.isPublished,
          timings: starterDataset.restaurant.timings,
          branches: starterDataset.restaurant.branches,
        });

        await MenuCategoryModel.insertMany(
          starterDataset.categories.map((category) => ({
            appId: category.id,
            restaurantId: category.restaurantId,
            name: category.name,
            order: category.order,
            description: category.description,
          })),
        );

        await MenuItemModel.insertMany(
          starterDataset.items.map((item) => ({
            appId: item.id,
            restaurantId: item.restaurantId,
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
      }
    })();
  }

  await global.menuverseDatabaseSeedPromise;
}

export async function ensureSeedData() {
  if (isDatabaseConfigured()) {
    await ensureDatabaseSeedData();
    return;
  }

  await ensureMemorySeedData();
}

async function getMemoryState() {
  await ensureMemorySeedData();

  if (!global.menuverseMemoryState) {
    throw new Error("Memory state could not be initialized.");
  }

  return global.menuverseMemoryState;
}

async function findUserByEmail(email: string) {
  await ensureSeedData();
  const normalizedEmail = email.toLowerCase();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await UserModel.findOne({ email: normalizedEmail }).lean<DbUserRecord>();

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
      createdAt: record.createdAt?.toISOString?.() ?? undefined,
    } satisfies StoredUserRecord;
  }

  const state = await getMemoryState();
  return state.users.find((user) => user.email === normalizedEmail) ?? null;
}

async function findUserById(userId: string) {
  await ensureSeedData();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await UserModel.findOne({ appId: userId }).lean<DbUserRecord>();

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
      createdAt: record.createdAt?.toISOString?.() ?? undefined,
    } satisfies StoredUserRecord;
  }

  const state = await getMemoryState();
  return state.users.find((user) => user.id === userId) ?? null;
}

async function findRestaurantBySlug(slug: string) {
  await ensureSeedData();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await RestaurantModel.findOne({ slug }).lean<DbRestaurantRecord>();

    if (!record) {
      return null;
    }

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

  const state = await getMemoryState();
  return state.restaurants.find((restaurant) => restaurant.slug === slug) ?? null;
}

async function findRestaurantByOwnerId(ownerId: string) {
  await ensureSeedData();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await RestaurantModel.findOne({ ownerId }).lean<DbRestaurantRecord>();

    if (!record) {
      return null;
    }

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

  const state = await getMemoryState();
  return state.restaurants.find((restaurant) => restaurant.ownerId === ownerId) ?? null;
}

async function findFirstRestaurant() {
  await ensureSeedData();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const record = await RestaurantModel.findOne({})
      .sort({ createdAt: 1 })
      .lean<DbRestaurantRecord>();

    if (!record) {
      return null;
    }

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

  const state = await getMemoryState();
  return state.restaurants[0] ?? null;
}

async function getCategoriesForRestaurant(restaurantId: string) {
  await ensureSeedData();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const records = await MenuCategoryModel.find({ restaurantId })
      .sort({ order: 1, createdAt: 1 })
      .lean<DbCategoryRecord[]>();

    return records.map(
      (record) =>
        ({
          id: record.appId,
          restaurantId: record.restaurantId,
          name: record.name,
          order: record.order,
          description: record.description,
        }) satisfies MenuCategory,
    );
  }

  const state = await getMemoryState();
  return state.categories
    .filter((category) => category.restaurantId === restaurantId)
    .sort((left, right) => left.order - right.order);
}

async function getItemsForRestaurant(restaurantId: string) {
  await ensureSeedData();

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const records = await MenuItemModel.find({ restaurantId }).lean<DbItemRecord[]>();

    return records.map(
      (record) =>
        ({
          id: record.appId,
          restaurantId: record.restaurantId,
          categoryId: record.categoryId,
          name: record.name,
          description: record.description,
          price: record.price,
          imageUrl: record.imageUrl,
          arModelUrl: record.arModelUrl,
          arModelIosUrl: record.arModelIosUrl,
          qrCodeUrl: record.qrCodeUrl,
          dietaryTags: record.dietaryTags ?? [],
          prepTime: record.prepTime,
          featured: record.featured,
        }) satisfies MenuItem,
    );
  }

  const state = await getMemoryState();
  return state.items.filter((item) => item.restaurantId === restaurantId);
}

async function buildRestaurantDataset(restaurant: RestaurantProfile) {
  const ownerRecord = await findUserById(restaurant.ownerId);

  if (!ownerRecord) {
    return null;
  }

  const categories = await getCategoriesForRestaurant(restaurant.id);
  const items = await getItemsForRestaurant(restaurant.id);

  return {
    owner: serializeUser(ownerRecord),
    restaurant,
    categories,
    items,
  } satisfies RestaurantDataset;
}

export async function getRestaurantDatasetBySlug(slug: string) {
  const restaurant = await findRestaurantBySlug(slug);

  if (!restaurant || !restaurant.isPublished) {
    return null;
  }

  return buildRestaurantDataset(restaurant);
}

export async function getDefaultRestaurantDataset() {
  const preferred = await findRestaurantBySlug(env.defaultRestaurantSlug);

  if (preferred?.isPublished) {
    return buildRestaurantDataset(preferred);
  }

  const fallback = await findFirstRestaurant();

  if (!fallback || !fallback.isPublished) {
    return null;
  }

  return buildRestaurantDataset(fallback);
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    return null;
  }

  const matches = await verifyPassword(password, user.passwordHash);

  if (!matches) {
    return null;
  }

  return serializeUser(user);
}

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
  restaurantName: string;
}) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new Error("An account with that email already exists.");
  }

  const userId = createId("user");
  const restaurantId = createId("restaurant");
  const passwordHash = await hashPassword(input.password);

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
      .lean<DbRestaurantRecord[]>();
    const slug = ensureUniqueSlug(
      slugify(input.restaurantName),
      existingRestaurants.map((restaurant) => ({
        id: restaurant.appId,
        slug: restaurant.slug,
      })),
    );

    const dataset = buildStarterDataset(
      {
        id: ownerRecord.appId,
        name: ownerRecord.name,
        email: ownerRecord.email,
        role: ownerRecord.role,
        subscriptionStatus: ownerRecord.subscriptionStatus,
      },
      input.restaurantName,
    );

    dataset.restaurant.id = restaurantId;
    dataset.restaurant.slug = slug;
    dataset.restaurant.ownerId = ownerRecord.appId;
    dataset.categories = dataset.categories.map((category) => ({
      ...category,
      restaurantId,
    }));
    dataset.items = dataset.items.map((item) => ({
      ...item,
      restaurantId,
    }));

    await RestaurantModel.create({
      appId: dataset.restaurant.id,
      ownerId: dataset.restaurant.ownerId,
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
      branches: dataset.restaurant.branches,
      timings: dataset.restaurant.timings,
    });

    await MenuCategoryModel.insertMany(
      dataset.categories.map((category) => ({
        appId: category.id,
        restaurantId: category.restaurantId,
        name: category.name,
        order: category.order,
        description: category.description,
      })),
    );

    await MenuItemModel.insertMany(
      dataset.items.map((item) => ({
        appId: item.id,
        restaurantId: item.restaurantId,
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
      createdAt: ownerRecord.createdAt?.toISOString?.() ?? undefined,
    });
  }

  const state = await getMemoryState();
  const ownerRecord: StoredUserRecord = {
    id: userId,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: "owner",
    subscriptionStatus: "trial",
    createdAt: new Date().toISOString(),
  };

  const slug = ensureUniqueSlug(
    slugify(input.restaurantName),
    state.restaurants.map((restaurant) => ({
      id: restaurant.id,
      slug: restaurant.slug,
    })),
  );
  const dataset = buildStarterDataset(serializeUser(ownerRecord), input.restaurantName);
  dataset.restaurant.id = restaurantId;
  dataset.restaurant.slug = slug;
  dataset.restaurant.ownerId = ownerRecord.id;
  dataset.categories = dataset.categories.map((category) => ({
    ...category,
    restaurantId,
  }));
  dataset.items = dataset.items.map((item) => ({
    ...item,
    restaurantId,
  }));

  state.users.push(ownerRecord);
  state.restaurants.push(dataset.restaurant);
  state.categories.push(...dataset.categories);
  state.items.push(...dataset.items);

  return serializeUser(ownerRecord);
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
  if (currentSession.role !== "admin") {
    throw new Error("Only admins can add team members.");
  }

  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new Error("That email is already in use.");
  }

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
      createdAt: user.createdAt?.toISOString?.() ?? undefined,
    });
  }

  const state = await getMemoryState();
  const user: StoredUserRecord = {
    id: userId,
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    subscriptionStatus: "trial",
    createdAt: new Date().toISOString(),
  };

  state.users.push(user);
  return serializeUser(user);
}

export async function listTeamMembers(currentSession: AuthSession) {
  const currentUser = await findUserById(currentSession.userId);

  if (!currentUser) {
    return [];
  }

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const users = currentSession.role === "admin"
      ? await UserModel.find({}).sort({ createdAt: 1 }).lean<DbUserRecord[]>()
      : await UserModel.find({ appId: currentSession.userId }).lean<DbUserRecord[]>();
    const restaurants = await RestaurantModel.find({})
      .select("appId ownerId")
      .lean<Array<Pick<DbRestaurantRecord, "appId" | "ownerId">>>();

    return users.map((user) => {
      const restaurantId =
        restaurants.find((restaurant) => restaurant.ownerId === user.appId)?.appId ??
        null;

      return {
        id: user.appId,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt?.toISOString?.() ?? undefined,
        restaurantId,
      } satisfies TeamMember;
    });
  }

  const state = await getMemoryState();
  const users =
    currentSession.role === "admin"
      ? state.users
      : state.users.filter((user) => user.id === currentSession.userId);

  return users.map((user) => ({
    ...serializeUser(user),
    restaurantId:
      state.restaurants.find((restaurant) => restaurant.ownerId === user.id)?.id ?? null,
  }));
}

export async function getDashboardBundleForSession(
  currentSession: AuthSession,
) {
  const currentUserRecord = await findUserById(currentSession.userId);

  if (!currentUserRecord) {
    return null;
  }

  const currentUser = serializeUser(currentUserRecord);
  const restaurant =
    currentUser.role === "admin"
      ? await findFirstRestaurant()
      : await findRestaurantByOwnerId(currentUser.id);

  if (!restaurant) {
    return buildDashboardBundle(currentUser, null, [], []);
  }

  const categories = await getCategoriesForRestaurant(restaurant.id);
  const items = await getItemsForRestaurant(restaurant.id);

  return buildDashboardBundle(currentUser, restaurant, categories, items);
}

export async function saveRestaurantBundle(
  currentSession: AuthSession,
  payload: Pick<RestaurantDataset, "restaurant" | "categories" | "items">,
) {
  const currentUserRecord = await findUserById(currentSession.userId);

  if (!currentUserRecord) {
    throw new Error("User not found.");
  }

  if (!["admin", "owner"].includes(currentUserRecord.role)) {
    throw new Error("You do not have permission to edit restaurant data.");
  }

  const existingRestaurant =
    currentUserRecord.role === "admin"
      ? await (payload.restaurant?.id
          ? (async () => {
              if (isDatabaseConfigured()) {
                await connectToDatabase();
                const record = await RestaurantModel.findOne({
                  appId: payload.restaurant.id,
                }).lean<DbRestaurantRecord>();

                if (!record) {
                  return null;
                }

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

              const state = await getMemoryState();
              return (
                state.restaurants.find(
                  (restaurant) => restaurant.id === payload.restaurant.id,
                ) ?? null
              );
            })()
          : findFirstRestaurant())
      : await findRestaurantByOwnerId(currentUserRecord.id);

  const restaurantId = existingRestaurant?.id ?? payload.restaurant.id ?? createId("restaurant");
  const ownerId = existingRestaurant?.ownerId ?? currentUserRecord.id;

  let allRestaurants: Array<{ id: string; slug: string }> = [];

  if (isDatabaseConfigured()) {
    await connectToDatabase();
    const records = await RestaurantModel.find({})
      .select("slug appId")
      .lean<Array<Pick<DbRestaurantRecord, "appId" | "slug">>>();
    allRestaurants = records.map((restaurant) => ({
      id: restaurant.appId,
      slug: restaurant.slug,
    }));
  } else {
    allRestaurants = (await getMemoryState()).restaurants.map((restaurant) => ({
      id: restaurant.id,
      slug: restaurant.slug,
    }));
  }
  const uniqueSlug = ensureUniqueSlug(
    payload.restaurant.slug,
    allRestaurants,
    restaurantId,
  );

  const restaurant: RestaurantProfile = {
    ...payload.restaurant,
    id: restaurantId,
    ownerId,
    slug: uniqueSlug,
  };

  const categories = payload.categories.map((category, index) => ({
    ...category,
    id: category.id || createId("category"),
    restaurantId,
    order: index,
  }));
  const firstCategoryId = categories[0]?.id ?? createId("category");
  const normalizedCategories =
    categories.length > 0
      ? categories
      : [
          {
            id: firstCategoryId,
            restaurantId,
            name: "Mains",
            order: 0,
            description: "Primary dishes for the digital menu.",
          } satisfies MenuCategory,
        ];
  const items = payload.items.map((item) => ({
    ...item,
    id: item.id || createId("item"),
    restaurantId,
    categoryId:
      normalizedCategories.find((category) => category.id === item.categoryId)?.id ??
      normalizedCategories[0].id,
  }));

  if (isDatabaseConfigured()) {
    await connectToDatabase();

    await RestaurantModel.findOneAndUpdate(
      { appId: restaurant.id },
      {
        appId: restaurant.id,
        ownerId: restaurant.ownerId,
        name: restaurant.name,
        slug: restaurant.slug,
        logoUrl: restaurant.logoUrl,
        coverImageUrl: restaurant.coverImageUrl,
        description: restaurant.description,
        heroNote: restaurant.heroNote,
        cuisineLabel: restaurant.cuisineLabel,
        locationLabel: restaurant.locationLabel,
        locationMapsUrl: restaurant.locationMapsUrl,
        supportEmail: restaurant.supportEmail,
        isPublished: restaurant.isPublished,
        branches: restaurant.branches,
        timings: restaurant.timings,
      },
      { new: true, upsert: true },
    );

    await MenuCategoryModel.deleteMany({ restaurantId: restaurant.id });
    await MenuItemModel.deleteMany({ restaurantId: restaurant.id });

    if (normalizedCategories.length) {
      await MenuCategoryModel.insertMany(
        normalizedCategories.map((category) => ({
          appId: category.id,
          restaurantId: category.restaurantId,
          name: category.name,
          order: category.order,
          description: category.description,
        })),
      );
    }

    if (items.length) {
      await MenuItemModel.insertMany(
        items.map((item) => ({
          appId: item.id,
          restaurantId: item.restaurantId,
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
    }
  } else {
    const state = await getMemoryState();
    const restaurantIndex = state.restaurants.findIndex(
      (entry) => entry.id === restaurant.id,
    );

    if (restaurantIndex >= 0) {
      state.restaurants[restaurantIndex] = restaurant;
    } else {
      state.restaurants.push(restaurant);
    }

    state.categories = state.categories.filter(
      (category) => category.restaurantId !== restaurant.id,
    );
    state.items = state.items.filter((item) => item.restaurantId !== restaurant.id);
    state.categories.push(...normalizedCategories);
    state.items.push(...items);
  }

  return buildDashboardBundle(
    serializeUser(currentUserRecord),
    restaurant,
    normalizedCategories,
    items,
  );
}

export async function getPublicRestaurantPathForSlug(slug: string) {
  return getPublicRestaurantPath(slug, env.defaultRestaurantSlug);
}
