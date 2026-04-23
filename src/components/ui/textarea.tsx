import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-24 w-full rounded-md border border-[#d9cdbb] bg-white px-3 py-2 text-sm text-[#1f2937] shadow-sm outline-none transition placeholder:text-[#9ca3af] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/15",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
