import type { ReactNode } from "react";
import { Check, Search, type LucideIcon } from "lucide-react";
import { iconSize } from "@/lib/tokens";

/*
 * The one option list every bottom sheet uses (owner, 22 Sep 2026: "recycle blocks"): pickers in
 * the listing, service and onboarding flows, and Market's categories and location. A search box on
 * top when the list is long, then rows — round icon, label, optional hint line, a check when
 * picked — on the white row with a dark border for the picked one.
 */

export type DrawerOption = {
  value: string;
  label: string;
  /** A second line under the label ("Studios, stages, sets"). */
  hint?: string | undefined;
  icon?: LucideIcon;
  iconNode?: ReactNode;
};

/** The search box at the top of a long list. */
export function DrawerSearch({
  value,
  onChange,
  placeholder = "Search",
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
}) {
  return (
    <div className="relative mb-3">
      <Search
        size={18}
        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-foreground"
        aria-hidden
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-13 w-full rounded-full border border-border bg-card py-3.5 pl-12 pr-5 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

/** Options whose label contains the query, case-insensitive. */
export function matching<T extends { label: string }>(options: readonly T[], query: string) {
  const q = query.trim().toLowerCase();
  return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
}

function OptionIcon({ option: o }: { option: DrawerOption }) {
  if (!o.iconNode && !o.icon) return null;
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-icon-chip text-primary-foreground">
      {o.iconNode ?? (o.icon ? <o.icon size={iconSize.md} strokeWidth={1.75} aria-hidden /> : null)}
    </span>
  );
}

/** One row: icon, label (and hint), a check when it's picked. */
export function DrawerOptionRow({
  option,
  selected = false,
  disabled = false,
  onClick,
}: {
  option: DrawerOption;
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`state-layer flex w-full items-center gap-3 rounded-lg border-2 bg-subtle px-4 py-3 text-left ${selected ? "border-foreground" : "border-transparent"} ${disabled ? "opacity-50" : ""}`}
      >
        <OptionIcon option={option} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">
            {option.label}
          </span>
          {option.hint ? (
            <span className="mt-0.5 block text-1 text-muted-foreground">{option.hint}</span>
          ) : null}
        </span>
        {selected ? <Check size={iconSize.md} className="shrink-0" aria-hidden /> : null}
      </button>
    </li>
  );
}

/** The scrolling list the rows sit in. */
export function DrawerList({
  label,
  multiple = false,
  empty,
  children,
}: {
  label: string;
  multiple?: boolean;
  /** Shown when the list has no rows (a search that matched nothing). */
  empty?: ReactNode;
  children: ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <>
      <ul
        className="max-h-[50vh] space-y-2 overflow-y-auto"
        role="listbox"
        aria-label={label}
        {...(multiple ? { "aria-multiselectable": true } : {})}
      >
        {children}
      </ul>
      {!hasRows && empty ? <p className="px-4 py-3 text-1 text-foreground">{empty}</p> : null}
    </>
  );
}
