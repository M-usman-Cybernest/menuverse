"use client";

import {
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  QrCode,
  Settings,
  Settings2,
  Store,
  Users,
  X,
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
    href: "/dashboard/settings",
    icon: Settings,
    label: "Settings",
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
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const filteredNav = navigation
    .filter((item) => !item.adminOnly || bundle.permissions.canManageUsers)
    .filter(
      (item) => !item.manageOnly || bundle.permissions.canManageRestaurant,
    );

  const activeLabel =
    filteredNav.find(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href)),
    )?.label ?? "Dashboard";

  return (
    <div className="min-h-screen bg-[#f7f3eb] text-[#111827]">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-[#e7dfd2] bg-[#fffdf8] transition-transform duration-300 lg:z-30 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand area */}
        <div className="p-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f766e] text-white">
              <Store className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#0f766e]">
                MenuVerse
              </p>
              <p className="truncate text-sm font-semibold">
                {bundle.restaurant?.name ?? "Restaurant Setup"}
              </p>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6b7280] hover:bg-[#f2ede2] lg:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="accent">{bundle.currentUser.role}</Badge>
            <Badge>{bundle.currentUser.subscriptionStatus}</Badge>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <div className="space-y-1">
            {filteredNav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" &&
                  pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-[#0f766e] text-white shadow-sm"
                      : "text-[#4b5563] hover:bg-[#f4eee2] hover:text-[#111827]",
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User card at bottom */}
        <div className="border-t border-[#e7dfd2] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7f3eb] text-[#0f766e]">
              <CircleUserRound className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {bundle.currentUser.name}
              </p>
              <p className="truncate text-xs text-[#6b7280]">
                {bundle.currentUser.email}
              </p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
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
              <LogOut className="h-3.5 w-3.5" />
              {loggingOut ? "..." : "Logout"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="lg:ml-[260px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-[#e7dfd2] bg-[#fcfaf7]/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4b5563] hover:bg-[#f2ede2] lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <div>
                <p className="text-xs font-semibold text-[#0f766e]">
                  Dashboard
                </p>
                <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                  {activeLabel}
                </h1>
              </div>
            </div>
            <div className="flex gap-2 lg:hidden">
              {publicUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={publicUrl} rel="noreferrer" target="_blank">
                    Public Menu
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
