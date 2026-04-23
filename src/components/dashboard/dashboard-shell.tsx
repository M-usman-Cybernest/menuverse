"use client";

import {
  CircleUserRound,
  Home,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings2,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { cn } from "@/lib/utils";

const navigation = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Overview",
  },
  {
    href: "/dashboard/profile",
    icon: Store,
    label: "Profile",
    manageOnly: true,
  },
  {
    href: "/dashboard/branches",
    icon: Home,
    label: "Branches",
    manageOnly: true,
  },
  {
    href: "/dashboard/menu",
    icon: Settings2,
    label: "Menu Builder",
    manageOnly: true,
  },
  {
    href: "/dashboard/qr",
    icon: QrCode,
    label: "QR Export",
    manageOnly: true,
  },
  {
    href: "/dashboard/users",
    icon: Users,
    label: "Users",
    adminOnly: true,
  },
];

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { bundle, publicUrl } = useDashboard();
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#111827]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-[#e7dfd2] bg-[#fffdf8] px-4 py-5 lg:border-r lg:border-b-0 lg:px-5">
          <div className="flex items-center justify-between gap-3 lg:block">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0f766e] text-white">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
                    MenuVerse
                  </p>
                  <p className="text-lg font-semibold">
                    {bundle.restaurant?.name ?? "Restaurant Setup"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="accent">{bundle.currentUser.role}</Badge>
                <Badge>{bundle.currentUser.subscriptionStatus}</Badge>
              </div>
            </div>
            {publicUrl ? (
              <Button asChild className="lg:hidden" size="sm" variant="outline">
                <a href={publicUrl} rel="noreferrer" target="_blank">
                  Public Menu
                </a>
              </Button>
            ) : null}
          </div>

          <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:flex-col">
            {navigation
              .filter((item) => !item.adminOnly || bundle.permissions.canManageUsers)
              .filter(
                (item) => !item.manageOnly || bundle.permissions.canManageRestaurant,
              )
              .map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-[#0f766e] text-white"
                        : "bg-transparent text-[#4b5563] hover:bg-[#f4eee2]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <div className="mt-6 hidden rounded-lg border border-[#e7dfd2] bg-[#fcfaf7] p-4 lg:block">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f7f3eb] text-[#0f766e]">
                <CircleUserRound className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold">{bundle.currentUser.name}</p>
                <p className="text-sm text-[#6b7280]">{bundle.currentUser.email}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {publicUrl ? (
                <Button asChild className="flex-1" size="sm" variant="outline">
                  <a href={publicUrl} rel="noreferrer" target="_blank">
                    Public Menu
                  </a>
                </Button>
              ) : null}
              <Button
                className="flex-1"
                onClick={logout}
                size="sm"
                variant="secondary"
              >
                <LogOut className="h-4 w-4" />
                {loggingOut ? "..." : "Logout"}
              </Button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[#e7dfd2] bg-[#fcfaf7]/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0f766e]">Dashboard</p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {bundle.restaurant?.name ?? "Finish setup"}
                </h1>
              </div>
              <div className="flex gap-2 lg:hidden">
                {publicUrl ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={publicUrl} rel="noreferrer" target="_blank">
                      Public Menu
                    </a>
                  </Button>
                ) : null}
                <Button onClick={logout} size="sm" variant="secondary">
                  <LogOut className="h-4 w-4" />
                  {loggingOut ? "..." : "Logout"}
                </Button>
              </div>
            </div>
          </header>
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
