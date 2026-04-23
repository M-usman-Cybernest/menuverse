import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-[#efe8dc] text-[#4b5563]",
        accent: "bg-[#dbf4ef] text-[#0f766e]",
        warm: "bg-[#ffe8d6] text-[#c2410c]",
        dark: "bg-[#111827] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
