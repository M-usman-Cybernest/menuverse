import type { RestaurantDataset } from "@/lib/types";

export const menuverseDemo: RestaurantDataset = {
  owner: {
    id: "user_apex_owner",
    name: "Apex Curator",
    email: "curator@apexstore.test",
    role: "owner",
    subscriptionStatus: "active",
    isVerified: true,
  },
  restaurant: {
    id: "rest_apex_store",
    ownerId: "user_apex_owner",
    name: "Apex Modern Living",
    slug: "apex-living",
    logoUrl: "https://lh3.googleusercontent.com/d/1yMUGZAsZomtV7h4sIs4NPmcvGfrhDFwf",
    coverImageUrl: "https://lh3.googleusercontent.com/d/1yMUGZAsZomtV7h4sIs4NPmcvGfrhDFwf",
    description:
      "A high-end lifestyle showroom featuring curated furniture and next-gen tech essentials. Experience every piece in stunning 3D/AR before it reaches your space.",
    heroNote:
      "Visualize premium craftsmanship in your home using Augmented Reality. From custom furniture to precision tech.",
    cuisineLabel: "Premium Retail",
    locationLabel: "5th Avenue, New York",
    locationMapsUrl: "https://maps.google.com/?q=5th+Avenue+New+York",
    supportEmail: "concierge@apexstore.test",
    isPublished: true,
    timings: [
      { day: "Monday", open: "09:00", close: "20:00" },
      { day: "Tuesday", open: "09:00", close: "20:00" },
      { day: "Wednesday", open: "09:00", close: "20:00" },
      { day: "Thursday", open: "09:00", close: "21:00" },
      { day: "Friday", open: "09:00", close: "21:00" },
      { day: "Saturday", open: "10:00", close: "18:00" },
      { day: "Sunday", open: "11:00", close: "17:00" },
    ],
    branches: [
      {
        id: "branch_ny_flagship",
        name: "Manhattan Flagship",
        address: "767 5th Avenue",
        city: "New York, NY",
        mapsUrl: "https://maps.google.com/?q=767+5th+Avenue+New+York",
        directionsLabel: "Next to Central Park",
        tableCount: 12, // Showroom zones
      },
      {
        id: "branch_la_studio",
        name: "Beverly Hills Studio",
        address: "450 N Rodeo Dr",
        city: "Beverly Hills, CA",
        mapsUrl: "https://maps.google.com/?q=450+N+Rodeo+Dr+Beverly+Hills",
        directionsLabel: "Golden Triangle area",
        tableCount: 8,
      },
    ],
  },
  categories: [
    {
      id: "cat_workspace",
      restaurantId: "rest_apex_store",
      name: "Workspace",
      order: 0,
      description: "Precision-engineered tools for the modern professional.",
    },
    {
      id: "cat_living",
      restaurantId: "rest_apex_store",
      name: "Living Room",
      order: 1,
      description: "Custom-built furniture pieces that anchor your home aesthetic.",
    },
    {
      id: "cat_essentials",
      restaurantId: "rest_apex_store",
      name: "Daily Essentials",
      order: 2,
      description: "The small things that make a big difference in your routine.",
    },
  ],
  items: [
    {
      id: "item_ergo_chair",
      restaurantId: "rest_apex_store",
      categoryId: "cat_workspace",
      name: "Apex Ergo-Pro Chair",
      description:
        "High-performance lumbar support with breathable mesh. Preview the 3D mechanics and fit in your office space before ordering.",
      price: 850,
      imageUrl: "/images/pasta.jpg",
      arModelUrl: "/models/avocado.glb",
      dietaryTags: ["Bestseller", "Pre-order"],
      prepTime: "2-3 weeks",
      deliveryTime: { value: 3, unit: "weeks" },
      featured: true,
      availableBranches: ["branch_ny_flagship", "branch_la_studio"],
    },
    {
      id: "item_minimal_sofa",
      restaurantId: "rest_apex_store",
      categoryId: "cat_living",
      name: "Cloud-Modular Sofa",
      description:
        "Stain-resistant fabric with modular sections. Use AR to see exactly how this fits in your living room layout.",
      price: 2400,
      imageUrl: "/images/pasta.jpg",
      dietaryTags: ["Customizable"],
      prepTime: "4-6 weeks",
      deliveryTime: { value: 5, unit: "weeks" },
      availableBranches: ["branch_ny_flagship"],
    },
    {
      id: "item_wireless_dock",
      restaurantId: "rest_apex_store",
      categoryId: "cat_essentials",
      name: "Titanium Charge Dock",
      description:
        "Fast-charging for three devices with a sleek titanium finish. A perfect desk companion.",
      price: 129,
      imageUrl: "/images/pasta.jpg",
      dietaryTags: ["New Arrival", "Ships Fast"],
      prepTime: "1-2 days",
      deliveryTime: { value: 2, unit: "days" },
      availableBranches: ["branch_ny_flagship", "branch_la_studio"],
    },
    {
      id: "item_linen_throw",
      restaurantId: "rest_apex_store",
      categoryId: "cat_living",
      name: "Organic Linen Throw",
      description:
        "Hand-woven linen for year-round comfort. Available in multiple earthy tones.",
      price: 85,
      imageUrl: "/images/pasta.jpg",
      dietaryTags: ["Eco-Friendly"],
      prepTime: "3-5 days",
      deliveryTime: { value: 4, unit: "days" },
      availableBranches: ["branch_ny_flagship", "branch_la_studio"],
    },
  ],
};

export function cloneDemoDataset() {
  return structuredClone(menuverseDemo);
}

export function getSeedRestaurantBySlug(slug: string) {
  return menuverseDemo.restaurant.slug === slug ? cloneDemoDataset() : null;
}
