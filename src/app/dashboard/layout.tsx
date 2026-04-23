import { DashboardProvider } from "@/components/dashboard/dashboard-provider";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardBundleForSession } from "@/lib/menuverse-data";
import { requireSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const bundle = await getDashboardBundleForSession(session);

  if (!bundle) {
    return null;
  }

  return (
    <DashboardProvider initialBundle={bundle}>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
