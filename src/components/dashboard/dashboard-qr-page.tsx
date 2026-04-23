"use client";

import { Copy, Save } from "lucide-react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { QrCodeTile } from "@/components/qr/qr-code-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DashboardQrPage() {
  const { items, publicUrl, restaurant, saveRestaurant, saveSuccess, saving } =
    useDashboard();
  const highlightedItem = items.find((item) => item.arModelUrl) ?? items[0] ?? null;

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  if (!restaurant || !publicUrl) {
    return null;
  }

  const highlightedItemUrl = highlightedItem
    ? `${publicUrl}${publicUrl.endsWith("/") ? "" : ""}?item=${highlightedItem.id}`
    : publicUrl;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">QR Export</p>
          <h2 className="text-3xl font-semibold tracking-tight">
            Restaurant and dish-level QR codes
          </h2>
        </div>
        <Button onClick={() => void saveRestaurant()} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save first"}
        </Button>
      </div>

      {saveSuccess ? <Badge variant="accent">{saveSuccess}</Badge> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <QrCodeTile
            description="Restaurant-wide menu entry point for counters, storefronts, or menus."
            downloadName="restaurant-qr"
            title="Global QR"
            value={publicUrl}
          />
          {highlightedItem ? (
            <QrCodeTile
              description="Jump straight into a featured dish or AR-ready dish experience."
              downloadName={`${highlightedItem.id}-qr`}
              title={`${highlightedItem.name} QR`}
              value={highlightedItemUrl}
            />
          ) : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Share links</CardTitle>
            <CardDescription>
              Copy the exact destinations behind the QR files and hand them to print or ops.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ShareRow
              label="Public menu"
              value={publicUrl}
              onCopy={() => void copy(publicUrl)}
            />
            {highlightedItem ? (
              <ShareRow
                label="Featured item"
                value={highlightedItemUrl}
                onCopy={() => void copy(highlightedItemUrl)}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShareRow({
  label,
  onCopy,
  value,
}: {
  label: string;
  onCopy: () => void;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f766e]">
        {label}
      </p>
      <p className="mt-2 break-all text-sm leading-6 text-[#4b5563]">{value}</p>
      <Button className="mt-4" onClick={onCopy} size="sm" variant="outline">
        <Copy className="h-4 w-4" />
        Copy link
      </Button>
    </div>
  );
}
