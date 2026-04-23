import { DashboardGoogleConnectPage } from "@/components/dashboard/dashboard-google-connect-page";
import { requireRole } from "@/lib/session";

export default async function DashboardGoogleConnectRoute() {
  await requireRole(["admin", "owner"]);

  return <DashboardGoogleConnectPage />;
}
