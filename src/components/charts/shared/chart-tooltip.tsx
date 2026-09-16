"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChartTooltipItem {
  name?: string
  value?: number | string | null
  color?: string
  dataKey?: string | number
  unit?: string
  [key: string]: unknown
}

export interface ChartTooltipProps {
  active?: boolean
  payload?: ChartTooltipItem[]
  label?: React.ReactNode
  formatter?: (value: number | string, name?: string, item?: ChartTooltipItem) => React.ReactNode
  labelFormatter?: (label: React.ReactNode) => React.ReactNode
  className?: string
  indicator?: "dot" | "line" | "dashed"
  hideLabel?: boolean
  /**
   * Whether to render in ultra-compact mode for smaller charts and preview tiles.
   */
  compact?: boolean
}

/**
 * Standard Plotcn Tooltip
 * High-contrast, analytical developer styling with tabular numerals and semantic theme tokens.
 * Section 15, 16, 17, 12.31.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
  className,
  indicator = "dot",
  hideLabel = false,
  compact = false,
}: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null
  }

  const formattedLabel = labelFormatter ? labelFormatter(label) : label

  return (
    <div
      className={cn(
        "plotcn-chart-tooltip",
        compact && "plotcn-chart-tooltip-compact",
        className
      )}
      role="tooltip"
    >
      {!hideLabel && formattedLabel !== undefined && formattedLabel !== null && (
        <div
          className={cn(
            "font-mono text-[var(--chart-tooltip-muted)] border-b border-[var(--chart-tooltip-border)] truncate",
            compact ? "text-[10px] mb-1 pb-0.5" : "text-[11px] mb-1.5 pb-1"
          )}
        >
          {formattedLabel}
        </div>
      )}
      <div className={cn("flex flex-col", compact ? "gap-0.5" : "gap-1")}>
        {payload.map((item, index) => {
          const itemColor = item.color || "var(--chart-1)"
          const rawVal = item.value
          let displayVal: React.ReactNode = "—"

          if (typeof rawVal === "number" && Number.isFinite(rawVal)) {
            displayVal = formatter
              ? formatter(rawVal, item.name, item)
              : rawVal.toLocaleString()
          } else if (typeof rawVal === "string" && rawVal.trim() !== "") {
            displayVal = formatter ? formatter(rawVal, item.name, item) : rawVal
          }

          return (
            <div
              key={`${item.dataKey || item.name || index}`}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {indicator === "dot" && (
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: itemColor }}
                    aria-hidden="true"
                  />
                )}
                {indicator === "line" && (
                  <span
                    className="h-0.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: itemColor }}
                    aria-hidden="true"
                  />
                )}
                {indicator === "dashed" && (
                  <span
                    className="h-0.5 w-3 shrink-0 border-t-2 border-dashed"
                    style={{ borderColor: itemColor }}
                    aria-hidden="true"
                  />
                )}
                <span className="text-[11px] text-[var(--chart-tooltip-muted)] truncate">
                  {item.name || "Value"}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[var(--chart-tooltip-foreground)] shrink-0">
                {displayVal}
                {item.unit ? ` ${item.unit}` : ""}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
