import { useEffect, useRef, type ReactNode } from "react";
import { Check, Search, X, type LucideIcon } from "lucide-react";
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

/**
 * A heading over a group of rows inside a drawer. The one style: there were eight, two of them
 * paragraphs rather than headings.
 */
export function SheetSectionHeading({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 text-1 font-semibold text-muted-foreground">{children}</h3>;
}

/**
 * The control that opens a drawer's search, for the Sheet's `titleAction` slot.
 *
 * Search is collapsed when a drawer opens (owner, 24 Sep 2026). A drawer shows its options first —
 * that is what you came for — and the box opens on tap. It used to be the other way round: a list
 * of more than eight auto-expanded a search box that pushed the options down the panel.
 */
export function DrawerSearchButton({
  open,
  onToggle,
  label,
}: {
  open: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={open ? "Close search" : label}
      aria-expanded={open}
      className="state-layer hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground"
    >
      {open ? (
        <X size={iconSize.md} strokeWidth={1.75} aria-hidden />
      ) : (
        <Search size={iconSize.md} strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}

/** The search box itself, shown once DrawerSearchButton opens it. */
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
  const field = useRef<HTMLInputElement>(null);
  // The box only exists because the person just tapped Search, so the caret belongs in it. Done
  // on mount rather than with autoFocus, which the accessibility rules reject outright.
  useEffect(() => {
    field.current?.focus();
  }, []);
  return (
    <div className="relative">
      <Search
        size={iconSize.md}
        className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-foreground"
        aria-hidden
      />
      <input
        ref={field}
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
    <li>
      <button
        type="button"
        aria-pressed={selected}
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
      {/*
        A plain list of buttons, not a listbox. `role="option"` must not contain an interactive
        descendant, and every row here is a <button> — invalid markup in the shared option list
        behind every picker sheet. The rows carry aria-pressed instead, which is what they are
        (audit B10, 29 Sep 2026).
      */}
      <ul className="max-h-[50dvh] space-y-2 overflow-y-auto" aria-label={label}>
        {children}
      </ul>
      {!hasRows && empty ? <p className="px-4 py-3 text-1 text-foreground">{empty}</p> : null}
    </>
  );
}
