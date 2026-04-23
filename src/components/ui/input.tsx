import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#d9cdbb] bg-white px-3 py-2 text-sm text-[#1f2937] shadow-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

export { Input };
