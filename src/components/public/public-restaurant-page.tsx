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
import { hasArAsset } from "@/lib/storage";
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
        item.id === (isDesktop ? requestedArItemId : manualArItemId) &&
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
    const item = initialDataset.items.find((entry) => entry.id === itemId);

    if (!item || !hasArAsset(item)) {
      return;
    }

    setActiveItemModalId("");

    if (isMobileDevice) {
      openNativeAr(item);
      return;
    }

    if (!isDesktop) {
      setManualArItemId(itemId);
    }
    syncItemQuery(itemId);
  }

  function closeArViewer() {
    setManualArItemId("");
    syncItemQuery("");
  }

  function openNativeAr(item: (typeof initialDataset.items)[number]) {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidMobile = /android/.test(userAgent);

    if (isAppleMobile && item.arModelIosUrl) {
      window.location.href = item.arModelIosUrl;
      return;
    }

    if (isAndroidMobile && item.arModelUrl) {
      const modelUrl = new URL(item.arModelUrl, window.location.origin).toString();
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
      window.location.href = item.arModelIosUrl;
      return;
    }

    if (item.arModelUrl) {
      window.open(item.arModelUrl, "_blank", "noopener,noreferrer");
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
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                    <Card className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border-[#e8dccb] bg-white">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <Image
                          alt={item.name}
                          className="object-cover"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          src={item.imageUrl}
                        />
                        {hasArAsset(item) ? (
                          <div className="absolute right-3 top-3">
                            <Badge className="bg-[#0f766e] text-white shadow-lg">
                              <Move3D className="mr-1 h-3 w-3" />
                              AR Ready
                            </Badge>
                          </div>
                        ) : null}
                      </div>
                      <CardContent className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h3 className="text-lg font-semibold tracking-tight text-[#111827] xl:text-xl">
                              {item.name}
                            </h3>
                            <p className="text-sm text-[#6b7280]">{item.prepTime}</p>
                          </div>
                          <p className="text-lg font-semibold text-[#111827]">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#4b5563]">
                          {item.description || "No description added yet."}
                        </p>
                        <div className="mt-4 flex min-h-11 flex-wrap gap-2">
                          {item.dietaryTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant={tag === "AR Ready" ? "accent" : "default"}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                          <Button
                            className="w-full sm:flex-1"
                            onClick={() => setActiveItemModalId(item.id)}
                            type="button"
                            variant="outline"
                          >
                            <Eye className="h-4 w-4" />
                            View Item
                          </Button>
                          {hasArAsset(item) ? (
                            <Button
                              className="w-full bg-[#0f766e] text-white hover:bg-[#0d6b63] sm:flex-1"
                              onClick={() => openArViewer(item.id)}
                              type="button"
                            >
                              <Move3D className="h-4 w-4" />
                              View 3D Model
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

        <section className="border-t border-[#ece4d8] bg-[#fffaf2]">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2 lg:px-8">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
                Timings
              </p>
              <div className="grid gap-3">
                {initialDataset.restaurant.timings.map((timing) => (
                  <div
                    className="flex items-center justify-between rounded-lg border border-[#e7dfd2] bg-white px-4 py-3"
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
        maxWidth="max-w-3xl"
        onClose={() => setActiveItemModalId("")}
        open={Boolean(activeModalItem)}
        title={activeModalItem?.name}
      >
        {activeModalItem ? (
          <div className="space-y-5">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-[#ece4d8] bg-[#fffaf2]">
              <Image
                alt={activeModalItem.name}
                className="object-cover"
                fill
                sizes="100vw"
                src={activeModalItem.imageUrl}
              />
            </div>

            {hasArAsset(activeModalItem) ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      Product 3D preview
                    </p>
                    <p className="text-sm text-[#6b7280]">
                      This dialog now renders the selected item&apos;s own 3D model.
                    </p>
                  </div>
                  <Badge variant="accent">Interactive</Badge>
                </div>
                <div className="min-h-[320px] overflow-hidden rounded-2xl border border-[#ece4d8] bg-white">
                  <ModelViewerElement item={activeModalItem} key={activeModalItem.id} />
                </div>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {activeModalItem.dietaryTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={tag === "AR Ready" ? "accent" : "default"}
                >
                  {tag}
                </Badge>
              ))}
            </div>

            <p className="text-base leading-7 text-[#4b5563]">
              {activeModalItem.description}
            </p>

            <div className="rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#111827]">
                    Particular item details
                  </p>
                  <p className="text-sm text-[#6b7280]">
                    This modal highlights the selected card item on the public home
                    page.
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#6b7280]">Price</p>
                  <p className="text-xl font-semibold text-[#111827]">
                    {formatPrice(activeModalItem.price)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {hasArAsset(activeModalItem) ? (
                <Button
                  onClick={() => {
                    openArViewer(activeModalItem.id);
                  }}
                  type="button"
                >
                  <Move3D className="h-4 w-4" />
                  View 3D Model
                </Button>
              ) : null}
              <Button
                onClick={() => setActiveItemModalId("")}
                type="button"
                variant="outline"
              >
                Close
              </Button>
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
