import type { ComponentProps, ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  Database01Icon,
  Loading03Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";
export interface ChartStateProps extends ComponentProps<"div"> {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}
function State({
  title,
  description,
  icon,
  action,
  onRetry,
  retryLabel = "Try again",
  className = "",
  ...props
}: ChartStateProps) {
  return (
    <div
      className={
        "plotcn-chart-scope flex h-full min-h-32 w-full flex-col items-center justify-center rounded-lg border border-dashed border-border p-5 text-center " +
        className
      }
      {...props}
    >
      <span className="mb-3 text-muted-foreground">{icon}</span>
      <p className="text-xs font-medium">{title}</p>
      <p className="mt-1 max-w-72 text-xs text-muted-foreground">{description}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-3 rounded-sm border border-border px-3 py-2 text-xs focus-visible:outline-2"
          onClick={onRetry}
        >
          {retryLabel}
        </button>
      ) : (
        action
      )}
    </div>
  );
}
export function ChartLoadingState(props: ChartStateProps) {
  return (
    <State
      role="status"
      title="Loading visualization…"
      description="Preparing the visualization."
      icon={<HugeiconsIcon icon={Loading03Icon} size={20} className="motion-safe:animate-spin" />}
      {...props}
    />
  );
}
export function ChartEmptyState(props: ChartStateProps) {
  return (
    <State
      role="status"
      title="No data available"
      description="There are no records for this selection."
      icon={<HugeiconsIcon icon={Database01Icon} size={20} />}
      {...props}
    />
  );
}
export function ChartErrorState(props: ChartStateProps) {
  return (
    <State
      role="alert"
      title="Unable to load chart"
      description="Check the data or try again."
      icon={<HugeiconsIcon icon={AlertCircleIcon} size={20} />}
      {...props}
    />
  );
}
export function ChartUnavailableState(props: ChartStateProps) {
  return (
    <State
      role="status"
      title="Metric unavailable"
      description="This visualization is unavailable for this selection."
      icon={<HugeiconsIcon icon={UnavailableIcon} size={20} />}
      {...props}
    />
  );
}
