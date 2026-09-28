import { Check, X } from "lucide-react";
import { StatusPill } from "@/components/ml/kit";
import type { SavedAccount } from "@/lib/saved-accounts";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

/** One account saved on this device: Switch account and the welcome screen's "Continue as". */
export function AccountRow({
  account,
  current,
  busy,
  onPick,
  onRemove,
}: {
  account: Pick<SavedAccount, "name" | "username" | "email" | "avatarUrl" | "kind">;
  current: boolean;
  busy: boolean;
  onPick: () => void;
  onRemove?: () => void;
}) {
  const title = account.name ?? account.username ?? account.email ?? "Account";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={onPick}
        disabled={current || busy}
        aria-label={current ? `${title}, in use` : `Continue as ${title}`}
        className="state-layer flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {account.avatarUrl ? (
          <img
            src={sized(account.avatarUrl, { width: 44 })}
            alt=""
            loading="lazy"
            className={`h-11 w-11 shrink-0 object-cover ${account.kind === "business" ? "rounded-sm" : "rounded-full"}`}
          />
        ) : (
          <span
            aria-hidden
            className={`h-11 w-11 shrink-0 bg-background ${account.kind === "business" ? "rounded-sm" : "rounded-full"}`}
          />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{title}</span>
          <span className="block truncate text-1 text-muted-foreground">
            {account.username ? `@${account.username}` : account.email}
          </span>
        </span>
        {account.kind ? (
          <StatusPill label={account.kind === "business" ? "Business" : "Talent"} tone="neutral" />
        ) : null}
        {current ? <Check size={iconSize.sm} aria-hidden className="shrink-0" /> : null}
      </button>
      {onRemove && !current ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title} from this device`}
          className="hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        >
          <X size={iconSize.sm} aria-hidden />
        </button>
      ) : null}
    </li>
  );
}
