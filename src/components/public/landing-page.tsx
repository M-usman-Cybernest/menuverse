"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type LandingPageProps = {
  siteName: string;
  authenticated?: boolean;
};

export function LandingPage({ siteName, authenticated = false }: LandingPageProps) {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-black text-white">
      {/* Hero Background */}
      <Image
        src="/images/hero.jpg"
        alt="Hero Background"
        fill
        className="object-cover opacity-60"
        priority
        sizes="100vw"
      />

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Top Navigation */}
      <nav className="absolute top-0 right-0 z-50 p-6 sm:p-10">
        <div className="flex gap-4">
          {authenticated ? (
            <Button asChild className="rounded-full px-8 bg-white text-black hover:bg-gray-200" size="lg">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full px-8 text-white hover:bg-white/10" size="lg">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="rounded-full px-8 bg-white text-black hover:bg-gray-200" size="lg">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Center Content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center px-4"
        >
          <h1 className="text-6xl sm:text-8xl lg:text-[10rem] font-black tracking-tight uppercase leading-none select-none">
            {siteName}
          </h1>
          <p className="mt-4 text-lg sm:text-xl font-medium tracking-[0.4em] uppercase text-white/80">
            Evolution of Dining
          </p>
        </motion.div>
      </div>

      {/* Bottom Left Content */}
      <div className="absolute bottom-0 left-0 z-50 p-6 sm:p-10 max-w-xl">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-white" />
            <span className="text-sm font-bold tracking-[0.2em] uppercase">{siteName}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold leading-tight">
            The next generation AR menu experience for modern restaurants.
          </h2>
          <p className="text-white/60 text-base leading-relaxed">
            Elevate your guest experience with immersive 3D previews,
            real-time updates, and beautiful digital storefronts designed
            for the mobile-first world.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
