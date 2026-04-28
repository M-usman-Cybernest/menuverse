import type { DayOfWeek, DietaryTag, UserRole } from "@/lib/types";

export const DIETARY_TAGS = [
  "Vegetarian",
  "Vegan",
  "GF",
  "Halal",
  "Spicy",
  "Chef's Pick",
  "New",
  "Bestseller",
  "Pre-order",
  "Eco-Friendly",
  "New Arrival",
  "Ships Fast",
  "Customizable",
] as const satisfies readonly DietaryTag[];

export const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const satisfies readonly DayOfWeek[];

export const USER_ROLES = ["admin", "owner", "staff"] as const satisfies readonly UserRole[];
