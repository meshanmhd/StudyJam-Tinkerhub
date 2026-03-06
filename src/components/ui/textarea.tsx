import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-xl border-none bg-gray-100 dark:bg-zinc-900 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-inner transition-[box-shadow,background-color] outline-none placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-gray-300 dark:focus-visible:ring-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 aria-invalid:ring-destructive/50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
