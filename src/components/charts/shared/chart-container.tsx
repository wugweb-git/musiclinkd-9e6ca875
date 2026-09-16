"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChartContainerProps extends React.ComponentProps<"div"> {
  config?: Record<string, { label?: React.ReactNode; color?: string }>
  children: React.ReactNode
}

/**
 * Plotcn Shared ChartContainer
 * Container-aware responsive wrapper using ResizeObserver with semantic token support.
 */
export function ChartContainer({
  id,
  className,
  children,
  config: _config,
  ...props
}: ChartContainerProps) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <div
      data-chart={chartId}
      className={cn(
        "@container plotcn-chart flex flex-col w-full h-full min-w-0 min-h-0 items-stretch justify-center text-xs",
        "[&_.recharts-cartesian-axis-tick_text]:fill-[var(--chart-axis)]",
        "[&_.recharts-cartesian-grid_line]:stroke-[var(--chart-grid)]",
        "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-[var(--chart-crosshair)]",
        "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
        
        "[&_.recharts-polar-grid_[stroke='#ccc']]:stroke-[var(--chart-grid)]",
        "[&_.recharts-radial-bar-background-sector]:fill-muted",
        "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/20",
        "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-[var(--chart-zero-line)]",
        "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
        
        "[&_.recharts-surface]:overflow-visible",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
