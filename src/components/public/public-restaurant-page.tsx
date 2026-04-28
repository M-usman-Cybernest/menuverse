"use client";

import { motion } from "framer-motion";
import { Clock3, Eye, LocateFixed, Move3D, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ArViewerDrawer } from "@/components/ar/ar-viewer-drawer";
import { ModelViewerElement } from "@/components/ar/model-viewer-element";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { resolveDriveUrl } from "@/lib/google-drive";
import { hasArAsset } from "@/lib/storage";
import type { MenuItem, RestaurantDataset } from "@/lib/types";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [manualArItemId, setManualArItemId] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [activeItemModalId, setActiveItemModalId] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
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

  const filteredSections = useMemo(() => {
    if (activeCategoryId === "all") {
      return sections;
    }

    return sections.filter((section) => section.category.id === activeCategoryId);
  }, [sections, activeCategoryId]);

  const todayTiming = initialDataset?.restaurant.timings.find(
    (entry) => entry.day === getTodayLabel(),
  );
  const requestedArItemId = searchParams.get("item") ?? "";
  const activeItem =
    initialDataset?.items.find(
      (item) =>
        item.id === (requestedArItemId || manualArItemId) &&
        hasArAsset(item),
    ) ?? null;
  const activeModalItem =
    initialDataset?.items.find((item) => item.id === activeItemModalId) ?? null;
  const arReadyItems = initialDataset?.items.filter(hasArAsset) ?? [];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateIsDesktop = () => setIsDesktop(mediaQuery.matches);

    updateIsDesktop();
    mediaQuery.addEventListener("change", updateIsDesktop);

    return () => {
      mediaQuery.removeEventListener("change", updateIsDesktop);
    };
  }, []);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const userAgent = navigator.userAgent.toLowerCase();
    const isTouchMobile =
      /android|iphone|ipad|ipod/.test(userAgent) || mobileQuery.matches;

    setIsMobileDevice(isTouchMobile);
  }, []);

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

  const qrBaseValue = publicPath === "/" ? origin : `${origin}${publicPath}`;

  function syncItemQuery(itemId: string) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    if (itemId) {
      nextSearchParams.set("item", itemId);
    } else {
      nextSearchParams.delete("item");
    }

    const query = nextSearchParams.toString();
    router.replace(query ? `${publicPath}?${query}` : publicPath, {
      scroll: false,
    });
  }

  function openArViewer(itemId: string) {
    const item = initialDataset!.items.find((entry) => entry.id === itemId);

    if (!item || !hasArAsset(item)) {
      return;
    }

    setActiveItemModalId("");

    if (!isDesktop) {
      setManualArItemId(itemId);
    }
    syncItemQuery(itemId);
  }

  function closeArViewer() {
    setManualArItemId("");
    syncItemQuery("");
  }

  function openNativeAr(item: MenuItem) {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidMobile = /android/.test(userAgent);

    if (isAppleMobile && item.arModelIosUrl) {
      window.location.href = resolveDriveUrl(item.arModelIosUrl);
      return;
    }

    if (isAndroidMobile && item.arModelUrl) {
      const resolvedModelUrl = resolveDriveUrl(item.arModelUrl);
      const modelUrl = new URL(resolvedModelUrl, window.location.origin).toString();
      const fallbackUrl = `${window.location.origin}${publicPath}?item=${item.id}`;
      const intentUrl =
        `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelUrl)}` +
        `&mode=ar_preferred&title=${encodeURIComponent(item.name)}` +
        `#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;` +
        `S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end;`;

      window.location.href = intentUrl;
      return;
    }

    if (item.arModelIosUrl) {
      window.location.href = resolveDriveUrl(item.arModelIosUrl);
      return;
    }

    if (item.arModelUrl) {
      window.open(resolveDriveUrl(item.arModelUrl), "_blank", "noopener,noreferrer");
    }
  }

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
            src={resolveDriveUrl(initialDataset.restaurant.coverImageUrl, "image")}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,24,39,0.16),rgba(17,24,39,0.88))]" />
          <div className="relative mx-auto flex min-h-[35vh] max-w-7xl flex-col justify-between gap-12 px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-end gap-3">
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
                <div className="flex items-center gap-6">
                  {initialDataset.restaurant.logoUrl && (
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                      <Image
                        alt={initialDataset.restaurant.name}
                        className="object-contain p-2"
                        fill
                        sizes="80px"
                        src={resolveDriveUrl(initialDataset.restaurant.logoUrl, "image")}
                      />
                    </div>
                  )}
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                    {initialDataset.restaurant.name}
                  </h1>
                </div>
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
            </div>
          </div>
        </section>

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

        <section className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
          {filteredSections.map(({ category, items }) => (
            <div className="space-y-5" id={category.id} key={category.id}>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                  {category.name}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-[#111827]">
                  {category.description}
                </h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    className="h-full"
                    initial={{ opacity: 0, y: 18 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{ y: -4 }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <Card className="flex min-h-[180px] h-full flex-row overflow-hidden rounded-xl border-[#e8dccb] bg-white hover:shadow-md transition-shadow">
                      <CardContent className="flex flex-1 flex-col p-4 sm:p-6">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold tracking-tight text-[#111827] sm:text-xl">
                            {item.name}
                          </h3>
                          <p className="text-base font-semibold text-[#0f766e]">
                            from {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#6b7280]">
                          {item.description || "Freshly prepared for you."}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.dietaryTags.slice(0, 2).map((tag) => (
                            <Badge
                              key={tag}
                              className="text-[10px] px-2 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-auto flex gap-2 pt-4">
                          <Button
                            className="h-10 w-10 rounded-full border-[#e8dccb] p-0"
                            onClick={() => setActiveItemModalId(item.id)}
                            type="button"
                            variant="outline"
                            title="View Item"
                          >
                            <Eye className="h-5 w-5 text-[#111827]" />
                          </Button>
                          {hasArAsset(item) ? (
                            <Button
                              className="h-10 w-10 rounded-full bg-[#0f766e] p-0 text-white hover:bg-[#0d6b63]"
                              onClick={() => openArViewer(item.id)}
                              type="button"
                              title="View in AR"
                            >
                              <Move3D className="h-5 w-5" />
                            </Button>
                          ) : null}
                        </div>
                      </CardContent>

                      <div className="flex w-1/3 items-center justify-center p-2 sm:w-2/5 sm:p-4">
                        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#f8f9fa]">
                          <Image
                            alt={item.name}
                            className="object-cover"
                            fill
                            sizes="(max-width: 768px) 33vw, 20vw"
                            src={resolveDriveUrl(item.imageUrl, "image")}
                          />
                          {hasArAsset(item) && (
                            <div className="absolute right-2 top-2">
                              <div className="rounded-xl bg-[#0f766e] p-1 text-white shadow-lg">
                                <Move3D className="h-3 w-3" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="border-t border-[#ece4d8] bg-[#fffaf2]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                Timings
              </p>
              <div className="grid gap-3">
                {initialDataset.restaurant.timings.map((timing) => (
                  <div
                    className="flex items-center justify-between rounded-xl border border-[#e7dfd2] bg-white px-4 py-3"
                    key={timing.day}
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

      <Modal
        description={
          activeModalItem
            ? `${activeModalItem.prepTime} - ${formatPrice(activeModalItem.price)}`
            : undefined
        }
        maxWidth="max-w-2xl"
        onClose={() => setActiveItemModalId("")}
        open={Boolean(activeModalItem)}
        title={activeModalItem?.name}
      >
        {activeModalItem ? (
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex-1 space-y-5">
              <div className="flex flex-wrap gap-2">
                {activeModalItem.dietaryTags.map((tag) => (
                  <Badge key={tag} className="rounded-lg">
                    {tag}
                  </Badge>
                ))}
              </div>

              <p className="text-base leading-relaxed text-[#4b5563]">
                {activeModalItem.description || "No description provided."}
              </p>

              <div className="rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      Pricing & Availability
                    </p>
                    <p className="text-xs text-[#6b7280]">
                      Preparation: {activeModalItem.prepTime}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-[#0f766e]">
                      {formatPrice(activeModalItem.price)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {hasArAsset(activeModalItem) ? (
                  <Button
                    className="bg-[#0f766e] text-white hover:bg-[#0d6b63]"
                    onClick={() => openArViewer(activeModalItem.id)}
                    type="button"
                  >
                    <Move3D className="mr-2 h-4 w-4" />
                    Launch AR
                  </Button>
                ) : null}
                <Button
                  onClick={() => setActiveItemModalId("")}
                  type="button"
                  variant="outline"
                >
                  Back to Menu
                </Button>
              </div>
            </div>

            <div className="w-full md:w-2/5">
              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#ece4d8] bg-[#fffaf2]">
                <Image
                  alt={activeModalItem.name}
                  className="object-cover"
                  fill
                  sizes="(max-width: 768px) 100vw, 40vw"
                  src={resolveDriveUrl(activeModalItem.imageUrl, "image")}
                />
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <ArViewerDrawer
        item={activeItem}
        onClose={closeArViewer}
        open={Boolean(activeItem)}
        qrValue={`${qrBaseValue}?item=${activeItem?.id ?? ""}`}
        restaurantName={initialDataset.restaurant.name}
      />
    </>
  );
}
