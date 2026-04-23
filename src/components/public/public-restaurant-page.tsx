"use client";

import { motion } from "framer-motion";
import { Clock3, LocateFixed, Move3D, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { ArViewerDrawer } from "@/components/ar/ar-viewer-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RestaurantDataset } from "@/lib/types";
import { formatPrice, formatTimeRange } from "@/lib/utils";

type PublicRestaurantPageProps = {
  authenticated?: boolean;
  initialDataset: RestaurantDataset | null;
  publicPath: string;
};

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(new Date());
}

export function PublicRestaurantPage({
  authenticated = false,
  initialDataset,
  publicPath,
}: PublicRestaurantPageProps) {
  const searchParams = useSearchParams();
  const [activeArItemId, setActiveArItemId] = useState(
    () => searchParams.get("item") ?? "",
  );
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const sections = useMemo(() => {
    if (!initialDataset) {
      return [];
    }

    return [...initialDataset.categories]
      .sort((left, right) => left.order - right.order)
      .map((category) => ({
        category,
        items: initialDataset.items.filter((item) => item.categoryId === category.id),
      }));
  }, [initialDataset]);

  // Filtered sections based on active category
  const filteredSections = useMemo(() => {
    if (activeCategoryId === "all") return sections;
    return sections.filter((s) => s.category.id === activeCategoryId);
  }, [sections, activeCategoryId]);

  const todayTiming = initialDataset?.restaurant.timings.find(
    (entry) => entry.day === getTodayLabel(),
  );
  const activeItem =
    initialDataset?.items.find(
      (item) => item.id === activeArItemId && item.arModelUrl,
    ) ?? null;

  // Count of AR-ready items
  const arReadyItems = initialDataset?.items.filter((item) => item.arModelUrl) ?? [];

  if (!initialDataset) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#fcfaf7] px-4 text-center">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#0f766e]">
            MenuVerse
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#111827]">
            No published restaurant is available yet.
          </h1>
        </div>
      </main>
    );
  }

  const qrBaseValue =
    publicPath === "/" ? origin : `${origin}${publicPath}`;

  return (
    <>
      <main className="bg-[#fcfaf7] text-[#1f2937]">
        <section className="relative overflow-hidden bg-[#111827] text-white">
          <Image
            alt={initialDataset.restaurant.name}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            fill
            priority
            sizes="100vw"
            src={initialDataset.restaurant.coverImageUrl}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.16),rgba(17,24,39,0.88))]" />
          <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-between gap-12 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="bg-white/10 text-white" variant="dark">
                {initialDataset.restaurant.cuisineLabel}
              </Badge>
              <div className="flex gap-2">
                {authenticated ? (
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <Button asChild size="sm" variant="secondary">
                    <Link href="/login">Sign in</Link>
                  </Button>
                )}
                <Button asChild size="sm" variant="outline">
                  <a
                    href={initialDataset.restaurant.locationMapsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <LocateFixed className="h-4 w-4" />
                    Directions
                  </a>
                </Button>
              </div>
            </div>

            <div className="max-w-3xl space-y-5">
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  {initialDataset.restaurant.name}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                  {initialDataset.restaurant.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-white/80">
                <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
                  <Clock3 className="h-4 w-4" />
                  {todayTiming
                    ? formatTimeRange(
                        todayTiming.open,
                        todayTiming.close,
                        todayTiming.closed,
                      )
                    : "Hours available on request"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
                  <LocateFixed className="h-4 w-4" />
                  {initialDataset.restaurant.locationLabel}
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
                  <Store className="h-4 w-4" />
                  {initialDataset.restaurant.branches.length} branches
                </div>
                {arReadyItems.length > 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-md bg-[#0f766e]/40 px-3 py-2 text-white">
                    <Move3D className="h-4 w-4" />
                    {arReadyItems.length} AR-ready items
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {arReadyItems
                  .slice(0, 3)
                  .map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => setActiveArItemId(item.id)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Move3D className="h-4 w-4" />
                      {item.name}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Category filter bar */}
        <section className="border-b border-[#ece4d8] bg-[#fffaf2]">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
            <Button
              onClick={() => setActiveCategoryId("all")}
              size="sm"
              type="button"
              variant={activeCategoryId === "all" ? "default" : "secondary"}
            >
              All
            </Button>
            {sections.map(({ category }) => (
              <Button
                key={category.id}
                onClick={() => setActiveCategoryId(category.id)}
                size="sm"
                type="button"
                variant={activeCategoryId === category.id ? "default" : "secondary"}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </section>

        {/* Menu items grid */}
        <section className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
          {filteredSections.map(({ category, items }) => (
            <div id={category.id} key={category.id} className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                  {category.name}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                  {category.description}
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{ y: -4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <Card className="h-full overflow-hidden">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          alt={item.name}
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          src={item.imageUrl}
                        />
                        {/* AR badge overlay */}
                        {item.arModelUrl ? (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-[#0f766e] text-white shadow-lg">
                              <Move3D className="mr-1 h-3 w-3" />
                              AR Ready
                            </Badge>
                          </div>
                        ) : null}
                      </div>
                      <CardContent className="flex h-full flex-col space-y-4 p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="text-xl font-semibold tracking-tight text-[#111827]">
                              {item.name}
                            </h3>
                            <p className="text-sm text-[#6b7280]">{item.prepTime}</p>
                          </div>
                          <p className="text-lg font-semibold text-[#111827]">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className="text-sm leading-6 text-[#4b5563]">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.dietaryTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant={tag === "AR Ready" ? "accent" : "default"}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-auto pt-1">
                          {item.arModelUrl ? (
                            <Button
                              onClick={() => setActiveArItemId(item.id)}
                              type="button"
                              className="w-full bg-[#0f766e] text-white hover:bg-[#0d6b63]"
                            >
                              <Move3D className="h-4 w-4" />
                              View in AR
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Timings & Branches */}
        <section className="border-t border-[#ece4d8] bg-[#fffaf2]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                Timings
              </p>
              <div className="grid gap-3">
                {initialDataset.restaurant.timings.map((timing) => (
                  <div
                    key={timing.day}
                    className="flex items-center justify-between rounded-lg border border-[#e7dfd2] bg-white px-4 py-3"
                  >
                    <p className="font-medium text-[#111827]">{timing.day}</p>
                    <p className="text-sm text-[#6b7280]">
                      {formatTimeRange(timing.open, timing.close, timing.closed)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                Branches
              </p>
              <div className="grid gap-3">
                {initialDataset.restaurant.branches.map((branch) => (
                  <Card key={branch.id}>
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[#111827]">{branch.name}</p>
                          <p className="text-sm text-[#6b7280]">
                            {branch.address}, {branch.city}
                          </p>
                        </div>
                        <Badge variant="warm">{branch.tableCount} tables</Badge>
                      </div>
                      <Button asChild variant="outline">
                        <a href={branch.mapsUrl} rel="noreferrer" target="_blank">
                          <LocateFixed className="h-4 w-4" />
                          Open directions
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <ArViewerDrawer
        item={activeItem}
        open={Boolean(activeItem)}
        onClose={() => setActiveArItemId("")}
        qrValue={`${qrBaseValue}?item=${activeItem?.id ?? ""}`}
        restaurantName={initialDataset.restaurant.name}
      />
    </>
  );
}
