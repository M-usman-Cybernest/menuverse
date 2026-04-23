import { DashboardProfilePage } from "@/components/dashboard/dashboard-profile-page";
import { requireRole } from "@/lib/session";

export default async function DashboardProfileRoute() {
  await requireRole(["admin", "owner"]);
  return <DashboardProfilePage />;
}
