import { DashboardQrPage } from "@/components/dashboard/dashboard-qr-page";
import { requireRole } from "@/lib/session";

export default async function DashboardQrRoute() {
  await requireRole(["admin", "owner"]);
  return <DashboardQrPage />;
}
