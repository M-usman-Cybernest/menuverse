"use client";

import { jsPDF } from "jspdf";
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

  function downloadAsPdf() {
    if (!restaurant || !globalQr) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header Section with professional gradient-like background
    doc.setFillColor(15, 118, 110); // #0f766e
    doc.rect(0, 0, pageWidth, 45, "F");

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text(restaurant.name.toUpperCase(), pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("POWERED BY MENUVERSE AR - THE FUTURE OF DINING", pageWidth / 2, 30, { align: "center" });

    // Main QR Section
    doc.setTextColor(17, 24, 39); // #111827
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("SCAN OUR DIGITAL INVENTORY", pageWidth / 2, 62, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128); // #6b7280
    doc.text(
      "Experience our menu in stunning 3D and Augmented Reality.",
      pageWidth / 2,
      68,
      { align: "center" }
    );

    // QR Code with frame
    const qrSize = 85;
    const qrX = (pageWidth - qrSize) / 2;
    doc.setDrawColor(231, 223, 210); // #e7dfd2
    doc.setLineWidth(0.5);
    doc.roundedRect(qrX - 5, 75, qrSize + 10, qrSize + 10, 5, 5, "D");
    doc.addImage(globalQr, "PNG", qrX, 80, qrSize, qrSize);

    // Business Website URL
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 118, 110);
    doc.setFontSize(11);
    doc.text(publicUrl, pageWidth / 2, 182, { align: "center" }) ;

    // --- SECOND SECTION: DETAILS ---
    let currentY = 195;
    const margin = 20;

    // Line separator
    doc.setDrawColor(209, 213, 219); // gray-300
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Create 2-column layout for details
    const colWidth = (pageWidth - (margin * 3)) / 2;

    // COLUMN 1: Locations
    doc.setTextColor(15, 118, 110);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("OUR LOCATIONS", margin, currentY);
    currentY += 6;

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    if (restaurant.branches && restaurant.branches.length > 0) {
      restaurant.branches.forEach((branch) => {
        if (currentY > pageHeight - 30) return; // Basic overflow protection
        doc.setFont("helvetica", "bold");
        doc.text(branch.name, margin, currentY);
        currentY += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(75, 85, 99);
        doc.text(`${branch.address}, ${branch.city}`, margin, currentY);
        currentY += 7;
        doc.setTextColor(17, 24, 39);
      });
    } else {
      doc.text("Main Location: " + restaurant.locationLabel, margin, currentY);
      currentY += 10;
    }

    // COLUMN 2: Hours (Parallel to Column 1)
    let hoursY = 205;
    const col2X = margin + colWidth + 10;

    doc.setTextColor(15, 118, 110);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("OPERATING HOURS", col2X, hoursY);
    hoursY += 6;

    doc.setTextColor(17, 24, 39);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");

    if (restaurant.timings && restaurant.timings.length > 0) {
      restaurant.timings.forEach((t) => {
        const status = t.closed ? "CLOSED" : `${t.open} - ${t.close}`;
        doc.setFont("helvetica", "bold");
        doc.text(t.day.slice(0, 3).toUpperCase(), col2X, hoursY);
        doc.setFont("helvetica", "normal");
        doc.text(status, col2X + 15, hoursY);
        hoursY += 5;
      });
    }

    // Business Description at the very bottom
    const footerY = pageHeight - 35;
    doc.setDrawColor(231, 223, 210);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    if (restaurant.description) {
      const splitDesc = doc.splitTextToSize(restaurant.description, pageWidth - (margin * 2));
      doc.text(splitDesc, pageWidth / 2, footerY + 8, { align: "center" });
    }

    doc.save(`${restaurant.slug}-menu-professional.pdf`);
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

      {/* Global QR Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card id="global-qr-card" className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#0f766e]">
              <FileText className="h-4 w-4" />
              Global QR
            </CardTitle>
            <CardDescription className="text-[#4b5563]">
              Scan to open the full menu page. Perfect for storefronts, tables, and print materials.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col items-center justify-center space-y-6 pb-8">
            <div className="flex items-center justify-center rounded-2xl bg-[#f7f3eb] p-6 shadow-inner">
              {globalQr ? (
                <Image
                  alt="QR code"
                  className="rounded-xl bg-white p-4 shadow-md transition-transform hover:scale-[1.02]"
                  height={240}
                  src={globalQr}
                  unoptimized
                  width={240}
                />
              ) : (
                <div className="flex h-[240px] w-[240px] items-center justify-center rounded-xl bg-white text-sm text-[#6b7280]">
                  Generating...
                </div>
              )}
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
              <Button
                asChild
                className="w-full"
                variant="outline"
                size="sm"
              >
                <a
                  download={`${restaurant.slug}-restaurant-qr.png`}
                  href={globalQr || undefined}
                >
                  <Download className="h-4 w-4" />
                  PNG
                </a>
              </Button>
              <Button
                className="w-full"
                onClick={downloadAsPdf}
                variant="outline"
                size="sm"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                className="w-full"
                onClick={() => void copy(publicUrl)}
                variant="secondary"
                size="sm"
              >
                <Copy className="h-4 w-4" />
                Link
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Share links */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Share Links</CardTitle>
            <CardDescription className="text-[#4b5563]">
              Copy the exact destinations behind the QR codes.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto max-h-[480px] pr-2 custom-scrollbar">
            <ShareRow
              label="Public Site"
              value={publicUrl}
              onCopy={() => void copy(publicUrl)}
            />
            {itemQrs.map((qr) => (
              <ShareRow
                key={qr.id}
                label={qr.label}
                value={qr.url}
                onCopy={() => void copy(qr.url)}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Item-Level QR codes */}
      {itemQrs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Item-Level QR Codes</CardTitle>
            <CardDescription className="text-[#4b5563]">
              {generating
                ? "Generating QR codes..."
                : `${itemQrs.length} item QR codes ready for download`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {itemQrs.map((qr) => {
                const item = items.find((i) => i.id === qr.id);
                return (
                  <div
                    key={qr.id}
                    className="group rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-5 text-center transition-all hover:border-[#0f766e] hover:shadow-md"
                  >
                    <div className="mx-auto mb-4 flex items-center justify-center rounded-xl bg-[#f7f3eb] p-4 shadow-inner">
                      {qr.dataUrl ? (
                        <Image
                          alt={`${qr.label} QR`}
                          className="rounded-lg bg-white p-2 shadow-sm"
                          height={140}
                          src={qr.dataUrl}
                          unoptimized
                          width={140}
                        />
                      ) : (
                        <div className="flex h-[140px] w-[140px] items-center justify-center bg-white text-xs text-[#6b7280]">
                          ...
                        </div>
                      )}
                    </div>
                    <p className="mb-1 truncate text-sm font-bold text-[#111827]">
                      {qr.label}
                    </p>
                    {item ? (
                      <p className="mb-4 text-xs font-medium text-[#0f766e]">
                        {formatPrice(item.price)}
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
                        Download PNG
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
    <div className="group rounded-xl border border-[#ece4d8] bg-[#fffcf8] p-4 transition-colors hover:border-[#0f766e]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0f766e]">
          {label}
        </p>
        <button
          onClick={onCopy}
          className="text-[#6b7280] transition-colors hover:text-[#0f766e]"
          title="Copy link"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-1 line-clamp-1 truncate break-all text-xs text-[#4b5563]">
        {value}
      </p>
    </div>
  );
}
