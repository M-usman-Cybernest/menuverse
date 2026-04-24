import { LandingPage } from "@/components/public/landing-page";
import { getOptionalSession } from "@/lib/session";
import { env } from "@/lib/env";

export default async function HomePage() {
  const session = await getOptionalSession();

  return (
    <LandingPage
      siteName={env.siteName || "MenuVerse"}
      authenticated={Boolean(session)}
    />
  );
}
