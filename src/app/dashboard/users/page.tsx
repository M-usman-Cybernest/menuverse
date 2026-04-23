import { DashboardUsersPage } from "@/components/dashboard/dashboard-users-page";
import { listTeamMembers } from "@/lib/menuverse-data";
import { requireRole } from "@/lib/session";

export default async function DashboardUsersRoute() {
  const session = await requireRole(["admin"]);
  const users = await listTeamMembers(session);

  return <DashboardUsersPage initialUsers={users} />;
}
