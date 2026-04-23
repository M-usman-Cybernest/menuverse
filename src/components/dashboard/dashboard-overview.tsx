"use client";

import { ArrowRight, Layers3, Move3D, QrCode, Store } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { hasArAsset } from "@/lib/storage";
import { formatPrice, formatTimeRange } from "@/lib/utils";

export function DashboardOverview() {
  const { bundle, categories, items, publicUrl, restaurant } = useDashboard();
  const arReady = items.filter(hasArAsset);
  const featured = items.find((item) => item.featured) ?? items[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Layers3 className="h-4 w-4" />}
          title="Categories"
          value={categories.length.toString()}
        />
        <MetricCard
          icon={<Store className="h-4 w-4" />}
          title="Menu Items"
          value={items.length.toString()}
        />
        <MetricCard
          icon={<Move3D className="h-4 w-4" />}
          title="AR Ready"
          value={arReady.length.toString()}
        />
        <MetricCard
          icon={<QrCode className="h-4 w-4" />}
          title="QR Surfaces"
          value={featured ? "2" : "1"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        {/* Hero card */}
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-[#111827] px-5 py-5 text-white">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.28),rgba(17,24,39,0.96))]" />
            <div className="relative space-y-2">
              <Badge className="bg-white/10 text-white" variant="dark">
                Public Experience
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight">
                {restaurant?.name ?? "MenuVerse Restaurant"}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-white/75">
                {restaurant?.heroNote ??
                  "The dashboard is ready. Add your real restaurant details, then publish and share."}
              </p>
            </div>
          </div>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoBlock
                label="Location"
                value={restaurant?.locationLabel ?? "Add your location"}
              />
              <InfoBlock
                label="Support"
                value={restaurant?.supportEmail ?? bundle.currentUser.email}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/dashboard/profile">Edit Profile</Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/dashboard/menu">Manage Menu</Link>
              </Button>
              {publicUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={publicUrl} rel="noreferrer" target="_blank">
                    Open Public Menu
                  </a>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {/* Today at a glance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Today at a glance</CardTitle>
              <CardDescription>
                Quick pulse check before you send out the QR code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(restaurant?.timings ?? []).slice(0, 4).map((timing) => (
                <div
                  key={timing.day}
                  className="flex items-center justify-between rounded-lg border border-[#ece4d8] bg-[#fffcf8] px-4 py-2.5"
                >
                  <span className="text-sm font-medium">{timing.day}</span>
                  <span className="text-xs text-[#6b7280]">
                    {formatTimeRange(timing.open, timing.close, timing.closed)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Featured dish */}
          {featured ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Featured Dish</CardTitle>
                <CardDescription>
                  Spotlighting the card that deserves the first scan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <p className="font-semibold">{featured.name}</p>
                  <p className="text-sm text-[#6b7280]">
                    {featured.description}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">
                    {featured.prepTime}
                  </span>
                  <span className="font-semibold">
                    {formatPrice(featured.price)}
                  </span>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/qr">
                    Open QR Export
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f7f3eb] text-[#0f766e]">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-[#6b7280]">
            {title}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-[#111827]">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#374151]">{value}</p>
    </div>
  );
}
