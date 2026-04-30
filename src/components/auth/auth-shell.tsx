import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/lib/env";

export function AuthShell({
  children,
  description,
  footer,
  title,
}: {
  children: React.ReactNode;
  description: string;
  footer: React.ReactNode;
  title: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#111827] px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center text-white">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#99f6e4]"
            href="/"
          >
            {env.siteName}
          </Link>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-white/70">{description}</p>
          </div>
        </div>

        <Card className="border-white/10 bg-white/95 shadow-[0_32px_80px_-32px_rgba(0,0,0,0.6)]">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {children}
            <div className="border-t border-[#ece4d8] pt-4 text-sm text-[#6b7280]">
              {footer}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
