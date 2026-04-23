import { DashboardSettingsPage } from "@/components/dashboard/dashboard-settings-page";
import { requireRole } from "@/lib/session";

export default async function DashboardSettingsRoute() {
  await requireRole(["admin", "owner"]);
  return <DashboardSettingsPage />;
}
