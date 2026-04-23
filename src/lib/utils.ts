import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number) {
  return currencyFormatter.format(price);
}

export function formatTimeRange(
  open: string,
  close: string,
  closed?: boolean,
) {
  if (closed) {
    return "Closed";
  }

  return `${open} - ${close}`;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function getPublicRestaurantPath(
  slug: string,
  defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG ?? "luna-table",
) {
  return slug === defaultSlug ? "/" : `/${slug}`;
}

export function getPublicRestaurantUrl(
  origin: string,
  slug: string,
  defaultSlug = process.env.NEXT_PUBLIC_DEFAULT_RESTAURANT_SLUG ?? "luna-table",
) {
  const path = getPublicRestaurantPath(slug, defaultSlug);

  return path === "/" ? origin : `${origin}${path}`;
}
