import { DashboardBranchesPage } from "@/components/dashboard/dashboard-branches-page";
import { requireRole } from "@/lib/session";

export default async function DashboardBranchesRoute() {
  await requireRole(["admin", "owner"]);
  return <DashboardBranchesPage />;
}
