"use client";

import { ArrowRight, Layers3, Move3D, QrCode, Store } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { formatPrice, formatTimeRange } from "@/lib/utils";

export function DashboardOverview() {
  const { bundle, categories, items, publicUrl, restaurant } = useDashboard();
  const arReady = items.filter((item) => item.arModelUrl);
  const featured = items.find((item) => item.featured) ?? items[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          helper="Editable categories for starters, mains, drinks, and more."
          title="Categories"
          value={categories.length.toString()}
          icon={<Layers3 className="h-4 w-4" />}
        />
        <MetricCard
          helper="Total items currently published to the public menu."
          title="Menu Items"
          value={items.length.toString()}
          icon={<Store className="h-4 w-4" />}
        />
        <MetricCard
          helper="Dishes with a linked `.glb`, `.gltf`, or `.usdz` asset."
          title="AR Ready"
          value={arReady.length.toString()}
          icon={<Move3D className="h-4 w-4" />}
        />
        <MetricCard
          helper="Restaurant-wide and item-level codes are available from QR Export."
          title="QR Surfaces"
          value={featured ? "2" : "1"}
          icon={<QrCode className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <div className="relative overflow-hidden bg-[#111827] px-5 py-6 text-white">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.28),rgba(17,24,39,0.96))]" />
            <div className="relative space-y-3">
              <Badge className="bg-white/10 text-white" variant="dark">
                Public Experience
              </Badge>
              <h2 className="text-3xl font-semibold tracking-tight">
                {restaurant?.name ?? "MenuVerse Restaurant"}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-white/75">
                {restaurant?.heroNote ??
                  "The dashboard is ready. Add your real restaurant details, then publish and share."}
              </p>
            </div>
          </div>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
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
              <Button asChild>
                <Link href="/dashboard/profile">Edit Profile</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/dashboard/menu">Manage Menu</Link>
              </Button>
              {publicUrl ? (
                <Button asChild variant="outline">
                  <a href={publicUrl} rel="noreferrer" target="_blank">
                    Open Public Menu
                  </a>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Today at a glance</CardTitle>
              <CardDescription>
                Quick pulse check before you send out the QR code.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(restaurant?.timings ?? []).slice(0, 4).map((timing) => (
                <div
                  key={timing.day}
                  className="flex items-center justify-between rounded-lg border border-[#ece4d8] bg-[#fffcf8] px-4 py-3"
                >
                  <span className="font-medium">{timing.day}</span>
                  <span className="text-sm text-[#6b7280]">
                    {formatTimeRange(timing.open, timing.close, timing.closed)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {featured ? (
            <Card>
              <CardHeader>
                <CardTitle>Featured Dish</CardTitle>
                <CardDescription>
                  Handy for spotlighting the card that deserves the first scan.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{featured.name}</p>
                  <p className="text-sm text-[#6b7280]">{featured.description}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#6b7280]">{featured.prepTime}</span>
                  <span className="font-semibold">{formatPrice(featured.price)}</span>
                </div>
                <Button asChild variant="outline">
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
  helper,
  icon,
  title,
  value,
}: {
  helper: string;
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[#f7f3eb] text-[#0f766e]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-[#6b7280]">{title}</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#111827]">
            {value}
          </p>
        </div>
        <p className="text-sm leading-6 text-[#6b7280]">{helper}</p>
      </CardContent>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#374151]">{value}</p>
    </div>
  );
}
