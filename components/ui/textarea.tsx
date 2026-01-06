import type * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-border placeholder:text-muted-foreground focus:border-accent aria-invalid:border-destructive flex field-sizing-content min-h-32 w-full border-4 bg-background px-4 py-3 text-base font-medium transition-all outline-none focus:shadow-brutal-sm disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
