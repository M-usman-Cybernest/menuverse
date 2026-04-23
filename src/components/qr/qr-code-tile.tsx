"use client";

import { Download, QrCode } from "lucide-react";
import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type QrCodeTileProps = {
  description: string;
  downloadName: string;
  title: string;
  value: string;
};

export function QrCodeTile({
  description,
  downloadName,
  title,
  value,
}: QrCodeTileProps) {
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let active = true;

    void QRCode.toDataURL(value, {
      width: 260,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    }).then((nextUrl) => {
      if (active) {
        setDataUrl(nextUrl);
      }
    });

    return () => {
      active = false;
    };
  }, [value]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2 text-[#0f766e]">
          <QrCode className="h-4 w-4" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-center rounded-lg bg-[#f7f3eb] p-4">
          {dataUrl ? (
            <Image
              alt={`${title} QR code`}
              className="h-40 w-40 rounded-md bg-white p-2"
              height={160}
              src={dataUrl}
              unoptimized
              width={160}
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-md bg-white text-sm text-[#6b7280]">
              Generating...
            </div>
          )}
        </div>
        <Button asChild variant="outline">
          <a download={`${downloadName}.png`} href={dataUrl || undefined}>
            <Download className="h-4 w-4" />
            Download PNG
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
