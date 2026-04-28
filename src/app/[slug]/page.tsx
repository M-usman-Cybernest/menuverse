import type { Metadata } from "next";

import { PublicRestaurantPage } from "@/components/public/public-restaurant-page";
import { getRestaurantDatasetBySlug } from "@/lib/menuverse-data";
import { getOptionalSession } from "@/lib/session";

type RestaurantRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: RestaurantRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const dataset = await getRestaurantDatasetBySlug(slug);

  return {
    title: dataset ? `${dataset.restaurant.name} | MenuVerse` : "MenuVerse",
    description:
      dataset?.restaurant.description ??
      "Preview dishes, locations, and AR-ready Inventory.",
  };
}

export default async function RestaurantPage({ params }: RestaurantRouteProps) {
  const { slug } = await params;
  const [initialDataset, session] = await Promise.all([
    getRestaurantDatasetBySlug(slug),
    getOptionalSession(),
  ]);

  return (
    <PublicRestaurantPage
      authenticated={Boolean(session)}
      initialDataset={initialDataset}
      publicPath={`/${slug}`}
    />
  );
}
