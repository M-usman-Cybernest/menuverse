"use client";

import {
  CheckCircle2,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  QrCode,
  Settings,
  Settings2,
  Store,
  Unplug,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    label: "Inventory",
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
    href: "/dashboard/google-connect",
    icon: Unplug,
    label: "Google Connect",
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showVerifiedPopup, setShowVerifiedPopup] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (searchParams.get("verified") === "true") {
      setShowVerifiedPopup(true);
      // Clean up the URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowVerifiedPopup(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  async function handleResendEmail() {
    if (resending || countdown > 0) return;

    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to resend");

      setCountdown(60); // Start 60s cooldown
    } catch (error) {
      console.error(error);
      alert("Failed to resend verification email. Please try again later.");
    } finally {
      setResending(false);
    }
  }

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
                  Public Site
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
            <div className="flex items-center gap-3">
              
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f7f3eb] border border-[#e7dfd2] text-[#0f766e] transition-all hover:bg-[#0f766e] hover:text-white group"
                >
                  <CircleUserRound className="h-5 w-5" />
                </button>

                {userMenuOpen ? (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 z-20 w-56 origin-top-right rounded-xl border border-[#e7dfd2] bg-white p-2 shadow-xl ring-1 ring-black/5 focus:outline-none">
                      <div className="px-3 py-2 border-b border-[#f3f4f6] mb-1">
                        <p className="text-sm font-bold text-[#111827] truncate">
                          {bundle.currentUser.name}
                        </p>
                        <p className="text-xs text-[#6b7280] truncate">
                          {bundle.currentUser.email}
                        </p>
                      </div>
                      
                      <div className="p-1 space-y-1">
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#4b5563] rounded-lg hover:bg-[#f7f3eb] hover:text-[#111827] transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        <button
                          onClick={() => {
                            void logout();
                            setUserMenuOpen(false);
                          }}
                          disabled={loggingOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {loggingOut ? "Logging out..." : "Logout"}
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6">
          {!bundle.currentUser.isVerified && (
            <div className="mb-6 flex flex-col items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50 p-4 sm:flex-row">
              <div className="flex items-center gap-3 text-red-800">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                  <Unplug className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">Verify your email address</p>
                  <p className="text-xs opacity-80">Check your inbox for a verification link to secure your account and unlock all features.</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full sm:w-auto min-w-[120px]"
                onClick={handleResendEmail}
                disabled={resending || countdown > 0}
              >
                {resending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend Email"}
              </Button>
            </div>
          )}
          
          {children}
        </div>
      </div>

      <AnimatePresence>
        {showVerifiedPopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVerifiedPopup(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 text-center shadow-2xl"
            >
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
              </div>
              <h2 className="mb-2 text-2xl font-bold text-[#111827]">
                Account Verified!
              </h2>
              <p className="mb-8 text-sm text-[#6b7280]">
                Your email has been successfully verified. You now have full access to all MenuVerse features.
              </p>
              <Button
                onClick={() => setShowVerifiedPopup(false)}
                className="w-full py-6 text-base font-bold shadow-lg shadow-emerald-100 transition-all hover:scale-[1.02]"
              >
                Continue to Dashboard
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
