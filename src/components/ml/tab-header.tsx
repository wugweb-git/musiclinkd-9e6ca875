import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/*
 * Search as an icon: the button sits with a screen header's other actions; tapping it opens the
 * search field in the row below, focused. Submitting opens the screen's search page with the query;
 * ✕ or Escape closes the field.
 */

export function SearchIconButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={open ? "Close search" : "Search"}
      aria-expanded={open}
      onClick={onToggle}
      className="hit-area state-layer flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-transform duration-125 ease-standard active:scale-95"
    >
      {open ? <X size={18} aria-hidden /> : <Search size={18} aria-hidden />}
    </button>
  );
}

export function SearchField({
  to,
  placeholder,
  onClose,
}: {
  to: "/search" | "/marketplace/search";
  placeholder: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => input.current?.focus(), []);

  return (
    <form
      role="search"
      className="animate-in fade-in slide-in-from-top-2 duration-200"
      onSubmit={(e) => {
        e.preventDefault();
        void navigate({ to, search: q.trim() ? { q: q.trim() } : {} });
      }}
    >
      <label className="flex h-14 items-center gap-3 rounded-full border border-border bg-card px-5 focus-within:ring-2 focus-within:ring-ring">
        <Search size={18} className="shrink-0 text-muted-foreground" aria-hidden />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
          placeholder={placeholder}
          aria-label={placeholder}
          enterKeyHint="search"
          className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </label>
    </form>
  );
}
