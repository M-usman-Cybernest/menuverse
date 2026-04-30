"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function PublicPageSkeleton() {
  return (
    <main className="bg-[#fcfaf7] text-[#1f2937] min-h-screen">
      {/* Hero Section Skeleton */}
      <section className="relative overflow-hidden bg-[#111827] text-white">
        <Skeleton className="absolute inset-0 h-full w-full opacity-20" />
        <div className="relative mx-auto flex min-h-[35vh] max-w-7xl flex-col justify-between gap-12 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="hidden md:block h-10 w-full max-w-md rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>

          <div className="max-w-3xl space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-6">
                <Skeleton className="h-20 w-20 rounded-xl" />
                <Skeleton className="h-12 w-64 rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full max-w-2xl" />
                <Skeleton className="h-4 w-full max-w-xl" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-9 w-40 rounded-md" />
              <Skeleton className="h-9 w-36 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bar Skeleton */}
      <section className="border-b border-[#ece4d8] bg-[#fffaf2]">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-md" />
          ))}
        </div>
      </section>

      {/* Menu Grid Skeleton */}
      <section className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-8 w-48 rounded-md" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="flex min-h-[180px] h-full flex-row overflow-hidden rounded-xl border-[#e8dccb] bg-white">
                <CardContent className="flex flex-1 flex-col p-4 sm:p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                    <Skeleton className="h-5 w-1/3 rounded-md" />
                  </div>
                  <div className="mt-3 space-y-2">
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-2/3 rounded-md" />
                  </div>
                  <div className="mt-auto flex gap-2 pt-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </div>
                </CardContent>
                <div className="flex w-1/3 items-center justify-center p-2 sm:w-2/5 sm:p-4">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
