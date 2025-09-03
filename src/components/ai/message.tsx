import * as React from "react"
import { cn } from "@/lib/utils"

interface MessageProps {
  from: "user" | "assistant" | "system"
  children: React.ReactNode
  className?: string
}

interface MessageContentProps {
  children: React.ReactNode
  className?: string
}

export function Message({ from, children, className }: MessageProps) {
  return (
    <div
      className={cn(
        "flex w-full mb-4",
        from === "user" ? "justify-end" : "justify-start",
        className
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-2",
          from === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function MessageContent({ children, className }: MessageContentProps) {
  return (
    <div className={cn("text-sm", className)}>
      {children}
    </div>
  )
}
