import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
  className?: string;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        {
          "border-transparent bg-slate-900 text-slate-50 hover:bg-slate-900/80": variant === "default",
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80": variant === "secondary",
          "border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80": variant === "destructive",
          "text-slate-950": variant === "outline",
          "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80": variant === "success",
          "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/80": variant === "warning",
          "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100/80": variant === "info",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Badge }