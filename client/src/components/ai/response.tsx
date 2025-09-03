import * as React from "react"
import { cn } from "@/lib/utils"

interface ResponseProps {
  children: React.ReactNode
  className?: string
  isStreaming?: boolean
}

export function Response({ children, className, isStreaming }: ResponseProps) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      {children}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
      )}
    </div>
  )
}
