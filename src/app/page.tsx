import { PublicRestaurantPage } from "@/components/public/public-restaurant-page";
import { getDefaultRestaurantDataset } from "@/lib/menuverse-data";
import { getOptionalSession } from "@/lib/session";

export default async function HomePage() {
  const [dataset, session] = await Promise.all([
    getDefaultRestaurantDataset(),
    getOptionalSession(),
  ]);

  return (
    <PublicRestaurantPage
      authenticated={Boolean(session)}
      initialDataset={dataset}
      publicPath="/"
    />
  );
}
