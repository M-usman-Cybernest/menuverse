import { DashboardMenuPage } from "@/components/dashboard/dashboard-menu-page";
import { requireRole } from "@/lib/session";

export default async function DashboardMenuRoute() {
  await requireRole(["admin", "owner"]);
  return <DashboardMenuPage />;
}
