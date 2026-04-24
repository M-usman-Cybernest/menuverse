import type { RestaurantDataset } from "@/lib/types";

export const menuverseDemo: RestaurantDataset = {
  owner: {
    id: "user_luna_owner",
    name: "Luna Owner",
    email: "owner@lunatable.co",
    role: "owner",
    subscriptionStatus: "trial",
  },
  restaurant: {
    id: "rest_luna_table",
    ownerId: "user_luna_owner",
    name: "Luna Table",
    slug: "luna-table",
    logoUrl: "/images/dessert.jpg",
    coverImageUrl: "/images/hero.jpg",
    description:
      "A warm, modern bistro built for phone-first ordering, rich plating, and tableside wow moments.",
    heroNote:
      "Scan, browse, and drop signature dishes onto the table in AR before the server even arrives.",
    cuisineLabel: "Modern Mediterranean",
    locationLabel: "Ocean Avenue, Santa Monica",
    locationMapsUrl: "https://maps.google.com/?q=Ocean+Avenue+Santa+Monica",
    supportEmail: "hello@lunatable.co",
    isPublished: true,
    timings: [
      { day: "Monday", open: "11:30", close: "22:00" },
      { day: "Tuesday", open: "11:30", close: "22:00" },
      { day: "Wednesday", open: "11:30", close: "22:00" },
      { day: "Thursday", open: "11:30", close: "22:30" },
      { day: "Friday", open: "11:30", close: "23:30" },
      { day: "Saturday", open: "10:30", close: "23:30" },
      { day: "Sunday", open: "10:30", close: "21:30" },
    ],
    branches: [
      {
        id: "branch_main",
        name: "Santa Monica Flagship",
        address: "120 Ocean Avenue",
        city: "Santa Monica, CA",
        mapsUrl: "https://maps.google.com/?q=120+Ocean+Avenue+Santa+Monica",
        directionsLabel: "7 min from the pier",
        tableCount: 26,
      },
      {
        id: "branch_downtown",
        name: "Downtown Studio",
        address: "44 Main Street",
        city: "Los Angeles, CA",
        mapsUrl: "https://maps.google.com/?q=44+Main+Street+Los+Angeles",
        directionsLabel: "Lunch-heavy weekday crowd",
        tableCount: 18,
      },
    ],
  },
  categories: [
    {
      id: "cat_shareables",
      restaurantId: "rest_luna_table",
      name: "Shareables",
      order: 0,
      description: "Bright starters designed for the first scan at the table.",
    },
    {
      id: "cat_signatures",
      restaurantId: "rest_luna_table",
      name: "Signatures",
      order: 1,
      description: "High-margin dishes that deserve a dramatic AR moment.",
    },
    {
      id: "cat_sips",
      restaurantId: "rest_luna_table",
      name: "Sips",
      order: 2,
      description: "Low-friction upsells for brunch and golden hour.",
    },
  ],
  items: [
    {
      id: "item_avocado_cloud",
      restaurantId: "rest_luna_table",
      categoryId: "cat_shareables",
      name: "Avocado Cloud Tartine",
      description:
        "Charred sourdough, whipped labneh, citrus herbs, and a tableside AR preview using our local 3D model.",
      price: 18,
      imageUrl: "/images/citrus-salad.jpg",
      arModelUrl: "/models/avocado.glb",
      dietaryTags: ["Chef's Pick", "Vegetarian"],
      prepTime: "8 min",
      featured: true,
    },
    {
      id: "item_sliders",
      restaurantId: "rest_luna_table",
      categoryId: "cat_signatures",
      name: "Coal-Grilled Slider Flight",
      description:
        "Smoked brisket, pickled onions, and black garlic aioli stacked for shareable ordering.",
      price: 27,
      imageUrl: "/images/burger.jpg",
      dietaryTags: ["Halal", "New"],
      prepTime: "14 min",
    },
    {
      id: "item_pasta",
      restaurantId: "rest_luna_table",
      categoryId: "cat_signatures",
      name: "Charred Lemon Mafaldine",
      description:
        "Bright lemon cream, toasted breadcrumbs, and a glossy finish that photographs beautifully.",
      price: 24,
      imageUrl: "/images/pasta.jpg",
      dietaryTags: ["Chef's Pick"],
      prepTime: "12 min",
    },
    {
      id: "item_dessert",
      restaurantId: "rest_luna_table",
      categoryId: "cat_sips",
      name: "Basque Burnt Cheesecake",
      description:
        "Soft center, bitter caramel edge, and enough contrast to anchor the dessert shelf.",
      price: 14,
      imageUrl: "/images/dessert.jpg",
      dietaryTags: ["GF"],
      prepTime: "5 min",
    },
  ],
};

export function cloneDemoDataset() {
  return structuredClone(menuverseDemo);
}

export function getSeedRestaurantBySlug(slug: string) {
  return menuverseDemo.restaurant.slug === slug ? cloneDemoDataset() : null;
}
