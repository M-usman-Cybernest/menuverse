"use client";

import { Copy, Download, FileText, Printer, Save } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";

import { useDashboard } from "@/components/dashboard/dashboard-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

type QrItem = {
  id: string;
  label: string;
  url: string;
  dataUrl: string;
};

export function DashboardQrPage() {
  const { items, publicUrl, restaurant, saveRestaurant, saveSuccess, saving } =
    useDashboard();

  const [globalQr, setGlobalQr] = useState("");
  const [itemQrs, setItemQrs] = useState<QrItem[]>([]);
  const [generating, setGenerating] = useState(false);

  const generateQr = useCallback(
    async (value: string) => {
      return QRCode.toDataURL(value, {
        width: 300,
        margin: 1,
        color: { dark: "#111827", light: "#ffffff" },
      });
    },
    [],
  );

  // Auto-generate QR codes
  useEffect(() => {
    if (!publicUrl || !restaurant) return;

    let active = true;
    const generateCodes = async () => {
      setGenerating(true);

      // Global QR
      const globalDataUrl = await generateQr(publicUrl);
      if (!active) return;
      setGlobalQr(globalDataUrl);

      // Per-item QR codes
      const itemResults: QrItem[] = [];
      for (const item of items) {
        const itemUrl = `${publicUrl}?item=${item.id}`;
        const dataUrl = await generateQr(itemUrl);
        if (!active) return;
        itemResults.push({
          id: item.id,
          label: item.name,
          url: itemUrl,
          dataUrl,
        });
      }

      setItemQrs(itemResults);
      setGenerating(false);
    };

    void generateCodes();

    return () => {
      active = false;
    };
  }, [publicUrl, restaurant, items, generateQr]);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  function printQrCodes() {
    window.print();
  }

  function downloadAllAsPng() {
    // Create a canvas combining all QR codes
    const allQrs = [
      { label: restaurant?.name ?? "Restaurant", dataUrl: globalQr },
      ...itemQrs.map((q) => ({ label: q.label, dataUrl: q.dataUrl })),
    ].filter((q) => q.dataUrl);

    allQrs.forEach((qr) => {
      const link = document.createElement("a");
      link.download = `${qr.label.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
      link.href = qr.dataUrl;
      link.click();
    });
  }

  if (!restaurant || !publicUrl) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">QR Export</p>
          <h2 className="text-2xl font-semibold tracking-tight">
            Restaurant & Item QR Codes
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={printQrCodes}
            variant="outline"
            size="sm"
            className="no-print"
          >
            <Printer className="h-4 w-4" />
            Print All
          </Button>
          <Button
            onClick={downloadAllAsPng}
            variant="secondary"
            size="sm"
            className="no-print"
          >
            <Download className="h-4 w-4" />
            Download PNGs
          </Button>
          <Button
            onClick={() => void saveRestaurant()}
            disabled={saving}
            size="sm"
            className="no-print"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save first"}
          </Button>
        </div>
      </div>

      {saveSuccess ? <Badge variant="accent">{saveSuccess}</Badge> : null}

      {/* Global QR */}
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card id="global-qr-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0f766e]">
              <FileText className="h-4 w-4" />
              Global Restaurant QR
            </CardTitle>
            <CardDescription>
              Scan to open the full restaurant menu page. Perfect for
              storefronts, tables, and print materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center rounded-xl bg-[#f7f3eb] p-6">
              {globalQr ? (
                <Image
                  alt="Restaurant QR code"
                  className="rounded-lg bg-white p-3 shadow-sm"
                  height={200}
                  src={globalQr}
                  unoptimized
                  width={200}
                />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg bg-white text-sm text-[#6b7280]">
                  Generating...
                </div>
              )}
            </div>
            <div className="flex w-full gap-2">
              <Button
                asChild
                className="flex-1"
                variant="outline"
                size="sm"
              >
                <a
                  download={`${restaurant.slug}-restaurant-qr.png`}
                  href={globalQr || undefined}
                >
                  <Download className="h-4 w-4" />
                  Download PNG
                </a>
              </Button>
              <Button
                className="flex-1"
                onClick={() => void copy(publicUrl)}
                variant="secondary"
                size="sm"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share links */}
        <Card>
          <CardHeader>
            <CardTitle>Share Links</CardTitle>
            <CardDescription>
              Copy the exact destinations behind the QR codes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ShareRow
              label="Public Menu"
              value={publicUrl}
              onCopy={() => void copy(publicUrl)}
            />
            {itemQrs.slice(0, 3).map((qr) => (
              <ShareRow
                key={qr.id}
                label={qr.label}
                value={qr.url}
                onCopy={() => void copy(qr.url)}
              />
            ))}
            {itemQrs.length > 3 ? (
              <p className="text-center text-xs text-[#6b7280]">
                +{itemQrs.length - 3} more item QR codes below
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Per-item QR codes */}
      {itemQrs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Item-Level QR Codes</CardTitle>
            <CardDescription>
              {generating
                ? "Generating QR codes..."
                : `${itemQrs.length} item QR codes ready for download`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {itemQrs.map((qr) => {
                const item = items.find((i) => i.id === qr.id);
                return (
                  <div
                    key={qr.id}
                    className="rounded-lg border border-[#ece4d8] bg-[#fffcf8] p-4 text-center"
                  >
                    <div className="mx-auto mb-3 flex items-center justify-center rounded-lg bg-[#f7f3eb] p-3">
                      {qr.dataUrl ? (
                        <Image
                          alt={`${qr.label} QR`}
                          className="rounded-md bg-white p-1.5"
                          height={120}
                          src={qr.dataUrl}
                          unoptimized
                          width={120}
                        />
                      ) : (
                        <div className="flex h-[120px] w-[120px] items-center justify-center bg-white text-xs text-[#6b7280]">
                          ...
                        </div>
                      )}
                    </div>
                    <p className="mb-1 text-sm font-semibold text-[#111827]">
                      {qr.label}
                    </p>
                    {item ? (
                      <p className="mb-3 text-xs text-[#0f766e]">
                        {formatPrice(item.price)}
                        {item.arModelUrl ? " · AR Ready" : ""}
                      </p>
                    ) : null}
                    <Button
                      asChild
                      className="w-full"
                      size="sm"
                      variant="outline"
                    >
                      <a
                        download={`${qr.label.replace(/\s+/g, "-").toLowerCase()}-qr.png`}
                        href={qr.dataUrl || undefined}
                      >
                        <Download className="h-3.5 w-3.5" />
                        PNG
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
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
      <p className="mt-1 break-all text-sm leading-6 text-[#4b5563]">
        {value}
      </p>
      <Button
        className="mt-2"
        onClick={onCopy}
        size="sm"
        variant="outline"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy link
      </Button>
    </div>
  );
}
