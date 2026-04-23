import * as React from "react";

import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentProps<"select">
>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-[#d9cdbb] bg-white px-3 py-2 text-sm text-[#1f2937] shadow-sm outline-none transition focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15",
        className,
      )}
      {...props}
    />
  );
});

Select.displayName = "Select";

export { Select };
