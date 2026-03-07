import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-[42px] w-full min-w-0 rounded-xl border-none bg-gray-100 dark:bg-zinc-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-inner transition-[box-shadow,background-color] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-gray-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-zinc-700",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
