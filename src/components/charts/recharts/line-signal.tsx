import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useChartReducedMotion } from "../shared/use-chart-reduced-motion";
import { ChartLegend } from "../shared/chart-legend";
import { ChartContainer } from "../shared/chart-container";
import { ChartTooltip } from "../shared/chart-tooltip";
import {
  ChartLoadingState,
  ChartEmptyState,
  ChartErrorState,
  ChartUnavailableState,
} from "../shared/chart-state";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Type Definitions                                                          */
/* -------------------------------------------------------------------------- */

export interface SignalSeriesConfig<
  TData extends Record<string, unknown> = Record<string, unknown>,
> {
  key: keyof TData & string;
  label?: string;
  valueFormatter?: (value: number) => string;
}

export interface SignalLineProps<TData extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * The array of data observations to visualize.
   * Accepts a readonly array and will not mutate caller data.
   */
  data: readonly TData[];

  /**
   * Key for the horizontal axis domain (e.g. date, timestamp, or ordered category).
   */
  xKey: keyof TData & string;

  /**
   * Direct key for the numeric series to plot.
   * Mutually exclusive or fallback to series.key.
   */
  seriesKey?: keyof TData & string;

  /**
   * Optional semantic series descriptor containing key, label, and formatter.
   */
  series?: SignalSeriesConfig<TData>;

  /**
   * Height of the chart container in pixels or standard CSS string.
   * Default: 320
   */
  height?: number | string;

  /**
   * Curve interpolation for the signal line.
   * Default: "monotone"
   */
  curve?: "monotone" | "linear" | "step";

  /**
   * Explicit Y-axis numeric domain, or "auto" calculation.
   */
  domain?: [number, number] | ["auto", "auto"];

  /**
   * Tick thinning policy for the horizontal X axis.
   * Default: "auto"
   */
  tickStrategy?: "auto" | "all" | "preserve-start" | "preserve-end" | "preserve-both";

  /**
   * Whether to display subtle horizontal background gridlines.
   * Default: true
   */
  showGrid?: boolean;

  /**
   * Whether to display a chart legend.
   * Default: false (Signal Line is focused single-series by default).
   */
  showLegend?: boolean;

  /**
   * Whether to display the horizontal X axis.
   * Default: true
   */
  showXAxis?: boolean;

  /**
   * Whether to display the vertical Y axis.
   * Default: true
   */
  showYAxis?: boolean;

  /**
   * Primary color for the signal line. Defaults to Plotcn semantic token.
   * Default: "var(--chart-1)"
   */
  color?: string;

  /**
   * How missing observations (null or undefined values) are rendered.
   * "gap": line breaks at the missing point (truthful representation).
   * "connect": line connects adjacent valid points across the gap.
   * Default: "gap"
   */
  missingValuePolicy?: "gap" | "connect";

  /**
   * Motion configuration or boolean toggle.
   * Respects prefers-reduced-motion automatically.
   * Default: true
   */
  motion?: boolean | { duration?: number };

  /**
   * Accessible title for screen-reader regions and figures.
   * Default: "Signal Line"
   */
  title?: string;

  /**
   * Accessible description of the chart trend and domain.
   */
  description?: string;

  /**
   * Loading state flag. Renders neutral skeleton preserving layout footprint.
   */
  loading?: boolean;

  /**
   * Error state or message. Renders actionable error state.
   */
  error?: Error | string | null;

  /**
   * Metric unavailability flag (e.g. lack of permissions or historical retention limit).
   */
  unavailable?: boolean | string | null;

  /**
   * Optional custom retry callback for error states.
   */
  onRetry?: () => void;

  /**
   * Custom empty state content fallback.
   */
  emptyContent?: React.ReactNode;

  /**
   * Custom error state content fallback.
   */
  errorContent?: React.ReactNode;

  /**
   * Custom loading state content fallback.
   */
  loadingContent?: React.ReactNode;

  /**
   * Additional CSS classes applied to the root container.
   */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Pure Data Safety & Domain Algorithms (Self-Contained for Registry)         */
/* -------------------------------------------------------------------------- */

function isFiniteNumber(val: unknown): val is number {
  return typeof val === "number" && Number.isFinite(val);
}

/**
 * Calculates a safe numeric Y-domain preventing zero-height scales and NaN attributes.
 */
function calculateSafeDomain(
  data: readonly Record<string, unknown>[],
  valueKey: string,
  explicitDomain?: [number, number] | ["auto", "auto"],
): [number, number] | ["auto", "auto"] {
  if (explicitDomain) {
    return explicitDomain;
  }

  const validValues: number[] = [];
  for (const item of data) {
    const v = item[valueKey];
    if (isFiniteNumber(v)) {
      validValues.push(v);
    }
  }

  if (validValues.length === 0) {
    return [0, 100];
  }

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  // Single-value domain expansion (Section 19: e.g. all values are 42)
  if (min === max) {
    if (min === 0) {
      return [-1, 1];
    }
    if (min > 0) {
      return [Math.floor(min * 0.9), Math.ceil(min * 1.1)];
    }
    return [Math.floor(min * 1.1), Math.ceil(min * 0.9)];
  }

  // Padding extent by 5%
  const span = max - min;
  const pad = span * 0.05;
  return [
    min >= 0 ? Math.max(0, Math.floor(min - pad)) : Math.floor(min - pad),
    Math.ceil(max + pad),
  ];
}

/**
 * Normalizes dataset without mutating caller data:
 * - Drops invalid non-finite values (NaN, Infinity)
 * - Converts missing points to null for truthful gap rendering
 */
function normalizeSignalData<TData extends Record<string, unknown>>(
  data: readonly TData[],
  xKey: string,
  valueKey: string,
  missingPolicy: "gap" | "connect",
): Record<string, unknown>[] {
  const normalized: Record<string, unknown>[] = [];

  for (let i = 0; i < data.length; i++) {
    const raw: Record<string, unknown> = data[i] ?? {};
    const rawVal = raw[valueKey];
    const xVal = raw[xKey] ?? `Point ${i + 1}`;

    let cleanVal: number | null = null;
    if (isFiniteNumber(rawVal)) {
      cleanVal = rawVal;
    } else if (rawVal === null || rawVal === undefined) {
      cleanVal = null;
    } else {
      // Non-finite strings or objects that don't parse to finite numbers
      cleanVal = null;
    }

    normalized.push({
      ...raw,
      [xKey]: xVal,
      [valueKey]: cleanVal,
    });
  }

  return normalized;
}

/* -------------------------------------------------------------------------- */
/*  Component Implementation                                                  */
/* -------------------------------------------------------------------------- */

export function SignalLine<TData extends Record<string, unknown> = Record<string, unknown>>({
  data = [],
  xKey,
  seriesKey,
  series,
  height = 320,
  curve = "monotone",
  domain,
  tickStrategy = "auto",
  showGrid = true,
  showLegend = false,
  showXAxis = true,
  showYAxis = true,
  color = "var(--chart-1)",
  missingValuePolicy = "gap",
  motion = true,
  title = "Signal Line",
  description,
  loading = false,
  error = null,
  unavailable = false,
  onRetry,
  emptyContent,
  errorContent,
  loadingContent,
  className,
}: SignalLineProps<TData>) {
  const reducedMotion = useChartReducedMotion();
  const activeSeriesKey = series?.key || seriesKey || ("value" as keyof TData & string);
  const activeSeriesLabel = series?.label || activeSeriesKey;
  const valueFormatter = series?.valueFormatter;

  const containerId = React.useId().replace(/[:]/g, "");
  const titleId = `signal-title-${containerId}`;
  const descId = `signal-desc-${containerId}`;
  const summaryId = `signal-summary-${containerId}`;

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Normalized safe data
  const safeData = normalizeSignalData(data, xKey, activeSeriesKey, missingValuePolicy);
  const safeDomain = calculateSafeDomain(safeData, activeSeriesKey, domain);

  // Factual screen-reader summary (Section 37: factual statements only, no business conclusions)
  const validValues = safeData
    .map((d) => d[activeSeriesKey])
    .filter((v): v is number => isFiniteNumber(v));

  const factualSummary = React.useMemo(() => {
    if (validValues.length === 0) return "No valid numeric observations recorded.";
    const count = validValues.length;
    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const start = validValues[0] ?? 0;
    const end = validValues[validValues.length - 1] ?? 0;
    const delta = end - start;
    const direction = delta > 0 ? "rose" : delta < 0 ? "declined" : "remained unchanged";

    const fmt = valueFormatter ?? ((n: number) => n.toLocaleString());
    const startStr = fmt(start);
    const endStr = fmt(end);
    const minStr = fmt(min);
    const maxStr = fmt(max);

    return `Visualizing ${count} observations. The signal ${direction} from ${startStr} to ${endStr}, reaching a minimum of ${minStr} and maximum of ${maxStr}.`;
  }, [validValues, valueFormatter]);

  // Motion config
  const isAnimated = motion !== false && !reducedMotion;
  const animationDuration =
    typeof motion === "object" && motion?.duration !== undefined ? motion.duration * 1000 : 350;

  // Tick interval calculation based on strategy
  const tickInterval = React.useMemo(() => {
    if (tickStrategy === "all") return 0;
    if (tickStrategy === "preserve-start") return "preserveStart";
    if (tickStrategy === "preserve-end") return "preserveEnd";
    if (tickStrategy === "preserve-both") return "preserveStartEnd";
    // "auto"
    if (safeData.length > 30) return Math.ceil(safeData.length / 8);
    if (safeData.length > 15) return Math.ceil(safeData.length / 6);
    return "preserveStartEnd";
  }, [tickStrategy, safeData.length]);

  if (error) {
    if (errorContent)
      return (
        <div className={cn("w-full", className)} style={{ height }}>
          {errorContent}
        </div>
      );
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ChartErrorState
          title="Unable to load signal"
          description={typeof error === "string" ? error : error.message}
          onRetry={onRetry}
        />
      </div>
    );
  }
  if (unavailable) {
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ChartUnavailableState
          title="Signal unavailable"
          description={typeof unavailable === "string" ? unavailable : undefined}
        />
      </div>
    );
  }
  if (loading) {
    if (loadingContent)
      return (
        <div className={cn("w-full", className)} style={{ height }}>
          {loadingContent}
        </div>
      );
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ChartLoadingState
          title="Loading signal visualization..."
          description="Preparing time-series metrics and calculating axes"
        />
      </div>
    );
  }
  if (data.length === 0) {
    if (emptyContent)
      return (
        <div className={cn("w-full", className)} style={{ height }}>
          {emptyContent}
        </div>
      );
    return (
      <div className={cn("w-full", className)} style={{ height }}>
        <ChartEmptyState
          title="No signal observations"
          description="Observations will appear when metrics are recorded for this timeline."
        />
      </div>
    );
  }

  // Keyboard navigation across observations (Section 33, 34)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (safeData.length === 0) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? 0 : Math.min(safeData.length - 1, prev + 1)));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveIndex((prev) => (prev === null ? safeData.length - 1 : Math.max(0, prev - 1)));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(safeData.length - 1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveIndex(null);
    }
  };

  const defaultFormatter = (val: number | string) => {
    if (typeof val === "number" && isFiniteNumber(val)) {
      return valueFormatter ? valueFormatter(val) : val.toLocaleString();
    }
    return String(val ?? "—");
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the chart is a focusable region on purpose: arrow keys walk the series and announce each reading
    <figure
      role="region"
      aria-labelledby={titleId}
      aria-describedby={description ? descId : summaryId}
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- see the note above
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onBlur={() => setActiveIndex(null)}
      className={cn(
        "group relative flex flex-col w-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--chart-focus)] rounded-3xl transition-all",
        className,
      )}
      style={{ height }}
    >
      <figcaption className="sr-only">
        <h3 id={titleId}>{title}</h3>
        {description && <p id={descId}>{description}</p>}
        <p id={summaryId}>{factualSummary}</p>
      </figcaption>

      <ChartContainer className="w-full h-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
          initialDimension={{ width: 320, height: typeof height === "number" ? height : 320 }}
        >
          <LineChart
            data={safeData}
            margin={{ top: 12, right: 14, left: showYAxis ? -16 : 10, bottom: showXAxis ? 4 : 4 }}
          >
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            )}

            <XAxis
              hide={!showXAxis}
              dataKey={xKey as string}
              tickLine={false}
              axisLine={false}
              interval={tickInterval}
              tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
              dy={6}
            />

            <YAxis
              hide={!showYAxis}
              domain={safeDomain as [number, number]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "var(--chart-axis)" }}
              {...(valueFormatter
                ? { tickFormatter: (v: unknown) => valueFormatter(Number(v)) }
                : {})}
              dx={-4}
            />

            <Tooltip
              content={
                <ChartTooltip
                  indicator="line"
                  formatter={(val, name) => defaultFormatter(val)}
                  labelFormatter={(label) => label}
                  compact={typeof height === "number" ? height <= 260 : false}
                />
              }
              cursor={{
                stroke: "var(--chart-crosshair)",
                strokeDasharray: "3 3",
                strokeWidth: 1.2,
              }}
            />

            {showLegend && <Legend content={<ChartLegend />} />}

            <Line
              type={curve}
              dataKey={activeSeriesKey}
              name={activeSeriesLabel}
              stroke={color}
              strokeWidth={2}
              dot={
                safeData.length === 1
                  ? { r: 4.5, fill: color, stroke: "var(--chart-background)", strokeWidth: 2 }
                  : false
              }
              activeDot={{
                r: 4.5,
                fill: color,
                stroke: "var(--chart-background)",
                strokeWidth: 2,
              }}
              connectNulls={missingValuePolicy === "connect"}
              isAnimationActive={isAnimated}
              animationDuration={animationDuration}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* Visual Indicator for Keyboard Inspection */}
      <div className="sr-only" aria-live="polite">
        {activeIndex !== null && safeData[activeIndex] && (
          <span>
            Observation {activeIndex + 1} of {safeData.length}:{" "}
            {String(safeData[activeIndex][xKey])} is{" "}
            {String(safeData[activeIndex][activeSeriesKey] ?? "missing")}
          </span>
        )}
      </div>
    </figure>
  );
}
