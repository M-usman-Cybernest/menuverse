"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/ui/toast";

import { API_DASHBOARD_RESTAURANT } from "@/lib/api-routes";
import { DIETARY_TAGS, WEEK_DAYS } from "@/lib/constants";
import type {
  Branch,
  DashboardBundle,
  DietaryTag,
  MenuCategory,
  MenuItem,
  RestaurantProfile,
} from "@/lib/types";
import { createId, getPublicRestaurantUrl, slugify } from "@/lib/utils";

type ItemInitial = Partial<
  Pick<
    MenuItem,
    "name" | "description" | "price" | "imageUrl" | "arModelUrl" | "arModelIosUrl"
  >
>;

type ApiError = { message: string };
type BundleResponse = { bundle: DashboardBundle };
type CategoriesResponse = { categories: MenuCategory[] };
type ItemsResponse = { items: MenuItem[] };

type DashboardContextValue = {
  availableTags: readonly DietaryTag[];
  bundle: DashboardBundle;
  categories: MenuCategory[];
  items: MenuItem[];
  publicUrl: string | null;
  restaurant: RestaurantProfile | null;
  saving: boolean;
  saveError: string;
  saveSuccess: string;
  updateRestaurantField: <Key extends keyof RestaurantProfile>(
    key: Key,
    value: RestaurantProfile[Key],
  ) => void;
  updateTiming: (
    day: string,
    key: "open" | "close" | "closed",
    value: string | boolean,
  ) => void;
  addBranch: () => void;
  updateBranch: (
    branchId: string,
    key: keyof Branch,
    value: Branch[keyof Branch],
  ) => void;
  removeBranch: (branchId: string) => void;
  addCategory: (name?: string, description?: string) => string;
  updateCategory: (
    categoryId: string,
    key: keyof MenuCategory,
    value: string | number,
  ) => void;
  moveCategory: (categoryId: string, direction: "left" | "right") => void;
  removeCategory: (categoryId: string) => void;
  addItem: (categoryId: string, initial?: ItemInitial) => void;
  updateItem: (
    itemId: string,
    key: keyof MenuItem,
    value: string | number | boolean | undefined,
  ) => void;
  toggleItemTag: (itemId: string, tag: DietaryTag) => void;
  removeItem: (itemId: string) => void;
  setBundle: React.Dispatch<React.SetStateAction<DashboardBundle>>;
  saveRestaurant: () => Promise<boolean>;
  saveProfile: (data: Partial<RestaurantProfile>) => Promise<boolean>;
  saveHours: (timings: RestaurantProfile["timings"]) => Promise<boolean>;
  saveBranches: (branches: Branch[]) => Promise<boolean>;
  saveCategory: (id: string | null, data: { name: string; description: string }) => Promise<boolean>;
  deleteCategory: (id: string) => Promise<boolean>;
  saveItem: (id: string | null, data: Partial<MenuItem>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

function createDefaultRestaurantBundle(bundle: DashboardBundle): DashboardBundle {
  if (bundle.restaurant || !bundle.permissions.canManageRestaurant) {
    return bundle;
  }

  const restaurantId = createId("restaurant");
  const categoryId = createId("category");
  const itemId = createId("item");

  return {
    ...bundle,
    restaurant: {
      id: restaurantId,
      ownerId: bundle.currentUser.id,
      name: `${bundle.currentUser.name}'s Restaurant`,
      slug: slugify(bundle.currentUser.name) || "restaurant",
      logoUrl: "/images/logo.png",
      coverImageUrl: "/images/hero.jpg",
      description: "A new MenuVerse restaurant ready for setup.",
      heroNote: "Edit your story, timings, menu, and AR-ready items here.",
      cuisineLabel: "Modern Dining",
      locationLabel: "Add your location",
      locationMapsUrl: "https://maps.google.com",
      supportEmail: bundle.currentUser.email,
      isPublished: true,
      timings: WEEK_DAYS.map((day) => ({
        day,
        open: "11:00",
        close: "22:00",
      })),
      branches: [
        {
          id: createId("branch"),
          name: "Main Branch",
          address: "Add address",
          city: "City",
          mapsUrl: "https://maps.google.com",
          directionsLabel: "Primary location",
          tableCount: 12,
        },
      ],
    },
    categories: [
      {
        id: categoryId,
        restaurantId,
        name: "Mains",
        order: 0,
        description: "Add your signature dishes here.",
      },
    ],
    items: [
      {
        id: itemId,
        restaurantId,
        categoryId,
        name: "Signature Dish",
        description: "Describe ingredients, prep notes, and the AR moment.",
        price: 18,
        imageUrl: "/images/dessert.jpg",
        dietaryTags: ["New"],
        prepTime: "10 min",
      },
    ],
  };
}

function sortCategories(categories: MenuCategory[]) {
  return [...categories].sort((left, right) => left.order - right.order);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function DashboardProvider({
  children,
  initialBundle,
}: {
  children: React.ReactNode;
  initialBundle: DashboardBundle;
}) {
  const toast = useToast();
  const [bundle, setBundle] = useState<DashboardBundle>(() =>
    createDefaultRestaurantBundle(initialBundle),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // Fire toasts automatically when saveSuccess or saveError change
  useEffect(() => {
    if (saveSuccess) toast.success(saveSuccess);
  }, [saveSuccess]);

  useEffect(() => {
    if (saveError) toast.error(saveError);
  }, [saveError]);

  const restaurant = bundle.restaurant;
  const categories = useMemo(
    () => sortCategories(bundle.categories),
    [bundle.categories],
  );
  const items = bundle.items;
  const publicUrl = useMemo(() => {
    if (!restaurant) {
      return null;
    }

    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    return getPublicRestaurantUrl(origin, restaurant.slug);
  }, [restaurant]);

  function updateRestaurantField<Key extends keyof RestaurantProfile>(
    key: Key,
    value: RestaurantProfile[Key],
  ) {
    setBundle((current) => {
      if (!current.restaurant) {
        return current;
      }

      return {
        ...current,
        restaurant: {
          ...current.restaurant,
          [key]: value,
        },
      };
    });
  }

  function updateTiming(
    day: string,
    key: "open" | "close" | "closed",
    value: string | boolean,
  ) {
    setBundle((current) => {
      if (!current.restaurant) {
        return current;
      }

      return {
        ...current,
        restaurant: {
          ...current.restaurant,
          timings: current.restaurant.timings.map((timing) =>
            timing.day === day ? { ...timing, [key]: value } : timing,
          ),
        },
      };
    });
  }

  function addBranch() {
    setBundle((current) => {
      if (!current.restaurant) {
        return current;
      }

      return {
        ...current,
        restaurant: {
          ...current.restaurant,
          branches: [
            ...current.restaurant.branches,
            {
              id: createId("branch"),
              name: "New Branch",
              address: "Address",
              city: "City",
              mapsUrl: "https://maps.google.com",
              directionsLabel: "Great walk-in traffic",
              tableCount: 10,
            },
          ],
        },
      };
    });
  }

  function updateBranch(
    branchId: string,
    key: keyof Branch,
    value: Branch[keyof Branch],
  ) {
    setBundle((current) => {
      if (!current.restaurant) {
        return current;
      }

      return {
        ...current,
        restaurant: {
          ...current.restaurant,
          branches: current.restaurant.branches.map((branch) =>
            branch.id === branchId ? { ...branch, [key]: value } : branch,
          ),
        },
      };
    });
  }

  function removeBranch(branchId: string) {
    setBundle((current) => {
      if (!current.restaurant) {
        return current;
      }

      return {
        ...current,
        restaurant: {
          ...current.restaurant,
          branches: current.restaurant.branches.filter(
            (branch) => branch.id !== branchId,
          ),
        },
      };
    });
  }

  function addCategory(name?: string, description?: string) {
    const newId = createId("category");

    setBundle((current) => {
      if (!current.restaurant) {
        return current;
      }

      return {
        ...current,
        categories: [
          ...sortCategories(current.categories),
          {
            id: newId,
            restaurantId: current.restaurant.id,
            name: name || "New Category",
            order: current.categories.length,
            description: description || "Describe this menu section.",
          },
        ],
      };
    });

    return newId;
  }

  function updateCategory(
    categoryId: string,
    key: keyof MenuCategory,
    value: string | number,
  ) {
    setBundle((current) => ({
      ...current,
      categories: current.categories.map((category) =>
        category.id === categoryId ? { ...category, [key]: value } : category,
      ),
    }));
  }

  function moveCategory(categoryId: string, direction: "left" | "right") {
    setBundle((current) => {
      const ordered = sortCategories(current.categories);
      const index = ordered.findIndex((category) => category.id === categoryId);
      const targetIndex = direction === "left" ? index - 1 : index + 1;

      if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) {
        return current;
      }

      const reordered = [...ordered];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);

      return {
        ...current,
        categories: reordered.map((category, nextIndex) => ({
          ...category,
          order: nextIndex,
        })),
      };
    });
  }

  function removeCategory(categoryId: string) {
    setBundle((current) => {
      if (current.categories.length <= 1) {
        return current;
      }

      const fallbackCategory = sortCategories(current.categories).find(
        (category) => category.id !== categoryId,
      );

      if (!fallbackCategory) {
        return current;
      }

      return {
        ...current,
        categories: current.categories
          .filter((category) => category.id !== categoryId)
          .map((category, index) => ({
            ...category,
            order: index,
          })),
        items: current.items.map((item) =>
          item.categoryId === categoryId
            ? { ...item, categoryId: fallbackCategory.id }
            : item,
        ),
      };
    });
  }

  function addItem(categoryId: string, initial?: ItemInitial) {
    setBundle((current) => {
      if (!current.restaurant) {
        return current;
      }

      return {
        ...current,
        items: [
          ...current.items,
          {
            id: createId("item"),
            restaurantId: current.restaurant.id,
            categoryId,
            name: initial?.name || "New Menu Item",
            description:
              initial?.description ||
              "Describe ingredients, prep time, and selling point.",
            price: initial?.price ?? 16,
            imageUrl: initial?.imageUrl || "/images/dessert.jpg",
            arModelUrl: initial?.arModelUrl,
            arModelIosUrl: initial?.arModelIosUrl,
            dietaryTags: ["New"],
            prepTime: "10 min",
          },
        ],
      };
    });
  }

  function updateItem(
    itemId: string,
    key: keyof MenuItem,
    value: string | number | boolean | undefined,
  ) {
    setBundle((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function toggleItemTag(itemId: string, tag: DietaryTag) {
    setBundle((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,
          dietaryTags: item.dietaryTags.includes(tag)
            ? item.dietaryTags.filter((entry) => entry !== tag)
            : [...item.dietaryTags, tag],
        };
      }),
    }));
  }

  function removeItem(itemId: string) {
    setBundle((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }));
  }

  async function saveRestaurant() {
    if (!bundle.restaurant) {
      return false;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await fetch(API_DASHBOARD_RESTAURANT, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurant: bundle.restaurant,
          categories: bundle.categories,
          items: bundle.items,
        }),
      });

      const payload = (await response.json()) as
        | { bundle: DashboardBundle }
        | { message: string };

      if (!response.ok || !("bundle" in payload)) {
        throw new Error(
          "message" in payload ? payload.message : "Could not save your changes.",
        );
      }

      setBundle(payload.bundle);
      setSaveSuccess("Saved");
      window.setTimeout(() => setSaveSuccess(""), 1800);
      return true;
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Could not save your changes.",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveProfile(data: Partial<RestaurantProfile>) {
    setSaving(true);
    try {
      const response = await fetch(API_DASHBOARD_RESTAURANT, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bundle, restaurant: { ...bundle.restaurant, ...data } }),
      });
      const payload = (await response.json()) as BundleResponse | ApiError;
      if (!response.ok || !("bundle" in payload)) {
        throw new Error("message" in payload ? payload.message : "Failed to save profile");
      }
      setBundle(payload.bundle);
      setSaveSuccess("Profile updated");
      setTimeout(() => setSaveSuccess(""), 2000);
      return true;
    } catch (error) {
      setSaveError(getErrorMessage(error, "Failed to save profile"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveHours(timings: RestaurantProfile["timings"]) {
    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timings }),
      });
      if (!response.ok) throw new Error("Failed to save hours");
      setBundle((curr) => ({
        ...curr,
        restaurant: curr.restaurant ? { ...curr.restaurant, timings } : null,
      }));
      setSaveSuccess("Hours updated");
      setTimeout(() => setSaveSuccess(""), 2000);
      return true;
    } catch (error) {
      setSaveError(getErrorMessage(error, "Failed to save hours"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveBranches(branches: Branch[]) {
    setSaving(true);
    try {
      const response = await fetch("/api/dashboard/branches", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branches }),
      });
      if (!response.ok) throw new Error("Failed to save branches");
      setBundle((curr) => ({
        ...curr,
        restaurant: curr.restaurant ? { ...curr.restaurant, branches } : null,
      }));
      setSaveSuccess("Branches updated");
      setTimeout(() => setSaveSuccess(""), 2000);
      return true;
    } catch (error) {
      setSaveError(getErrorMessage(error, "Failed to save branches"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveCategory(id: string | null, data: { name: string; description: string }) {
    setSaving(true);
    try {
      const url = id ? `/api/dashboard/categories/${id}` : "/api/dashboard/categories";
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as CategoriesResponse | ApiError;
      if (!response.ok || !("categories" in payload)) {
        throw new Error("message" in payload ? payload.message : "Failed to save category");
      }
      setBundle((curr) => ({ ...curr, categories: payload.categories }));
      setSaveSuccess(id ? "Category updated" : "Category added");
      setTimeout(() => setSaveSuccess(""), 2000);
      return true;
    } catch (error) {
      setSaveError(getErrorMessage(error, "Failed to save category"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: string) {
    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/categories/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as CategoriesResponse | ApiError;
      if (!response.ok || !("categories" in payload)) {
        throw new Error("message" in payload ? payload.message : "Failed to delete category");
      }
      setBundle((curr) => ({
        ...curr,
        categories: payload.categories,
        items: curr.items.filter((i) => i.categoryId !== id),
      }));
      setSaveSuccess("Category removed");
      setTimeout(() => setSaveSuccess(""), 2000);
      return true;
    } catch (error) {
      setSaveError(getErrorMessage(error, "Failed to delete category"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveItem(id: string | null, data: Partial<MenuItem>) {
    setSaving(true);
    try {
      const url = id ? `/api/dashboard/items/${id}` : "/api/dashboard/items";
      const method = id ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await response.json()) as ItemsResponse | ApiError;
      if (!response.ok || !("items" in payload)) {
        throw new Error("message" in payload ? payload.message : "Failed to save item");
      }
      setBundle((curr) => ({ ...curr, items: payload.items }));
      setSaveSuccess(id ? "Item updated" : "Item added");
      setTimeout(() => setSaveSuccess(""), 2000);
      return true;
    } catch (error) {
      setSaveError(getErrorMessage(error, "Failed to save item"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: string) {
    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/items/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as ItemsResponse | ApiError;
      if (!response.ok || !("items" in payload)) {
        throw new Error("message" in payload ? payload.message : "Failed to delete item");
      }
      setBundle((curr) => ({ ...curr, items: payload.items }));
      setSaveSuccess("Item removed");
      setTimeout(() => setSaveSuccess(""), 2000);
      return true;
    } catch (error) {
      setSaveError(getErrorMessage(error, "Failed to delete item"));
      return false;
    } finally {
      setSaving(false);
    }
  }

  const value: DashboardContextValue = {
    availableTags: DIETARY_TAGS,
    bundle,
    categories,
    items,
    publicUrl,
    restaurant,
    saving,
    saveError,
    saveSuccess,
    updateRestaurantField,
    updateTiming,
    addBranch,
    updateBranch,
    removeBranch,
    addCategory,
    updateCategory,
    moveCategory,
    removeCategory,
    addItem,
    updateItem,
    toggleItemTag,
    removeItem,
    setBundle,
    saveRestaurant,
    saveProfile,
    saveHours,
    saveBranches,
    saveCategory,
    deleteCategory,
    saveItem,
    deleteItem,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider.");
  }

  return context;
}
