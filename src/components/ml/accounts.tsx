import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronsUpDown, Plus, Check, X } from "lucide-react";
import { StatusPill } from "@/components/ml/kit";
import { Sheet } from "@/components/ml/ui";
import { PersonAvatar } from "@/components/ml/person-avatar";
import { useViewer } from "@/components/ml/viewer";
import { useAuth } from "@/hooks/use-auth";
import { enterLinkedProfile, listLinkedProfiles } from "@/lib/pages.functions";
import {
  addAnotherAccount,
  switchTo as switchSaved,
  switchToLinked,
  useSavedAccounts,
} from "@/lib/saved-accounts";
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
  // `||`, not `??`: a saved sign-in can carry an empty name, which must not show as a blank row.
  const title = account.name || account.username || account.email || "Unnamed account";
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

/*
 * Personal ↔ business switcher (plan §7.4): a pill with the identity you are acting as (avatar,
 * name, ⇅). Like tapping your username on Instagram, it opens the account switcher.
 */
/** The name to show for the signed-in identity: profile name, else email name, else phone. */
function useIdentityName() {
  const { user } = useAuth();
  const { displayName } = useViewer();
  return displayName || user?.email?.split("@")[0] || user?.phone || "You";
}

export function IdentityPill() {
  const { signedIn } = useAuth();
  const { photo } = useViewer();
  const displayName = useIdentityName();
  const [open, setOpen] = useState(false);
  if (!signedIn) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`Acting as ${displayName || "you"}. Switch or open your account`}
        className="hit-area state-layer inline-flex max-w-full min-w-0 items-center gap-2 rounded-full bg-card py-1 pl-1 pr-3 shadow-xs ring-1 ring-border"
      >
        <PersonAvatar
          name={displayName}
          photo={photo ? sized(photo, { width: 64 }) : null}
          className="h-8 w-8 shrink-0 text-1"
        />
        <span className="truncate text-2 font-semibold">{displayName}</span>
        <ChevronsUpDown size={iconSize.sm} className="shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <AccountSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/**
 * Instagram's account switcher (owner, 5 Oct: "refer Instagram as is"): one sheet with every
 * identity you can act as — your profile, your business pages, other sign-ins saved on this
 * device — the current one ticked, a tap on another switches; then Add account. Navigation
 * (Inbox, Settings…) is not in here, as on Instagram.
 */
export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const saved = useSavedAccounts();
  const loadLinked = useServerFn(listLinkedProfiles);
  const enter = useServerFn(enterLinkedProfile);
  const linked = useQuery({
    queryKey: ["accounts", "linked", user?.id ?? null],
    queryFn: () => loadLinked(),
    enabled: open && !!user,
  });
  const [busy, setBusy] = useState(false);
  const mine = linked.data ?? [];
  const linkedIds = new Set(mine.map((p) => p.id));
  const others = saved.filter((a) => !linkedIds.has(a.userId));

  async function pick(id: string) {
    setBusy(true);
    try {
      if (linkedIds.has(id)) await switchToLinked(id, enter);
      else await switchSaved(id);
      // A fresh start as the other identity, so nothing from this one stays on screen.
      window.location.assign("/");
    } catch {
      toast.error("Couldn't switch account. Try again.");
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Switch account">
      <ul className="divide-y divide-border">
        {mine.map((p) => (
          <AccountRow
            key={p.id}
            account={{ ...p, email: null }}
            current={p.id === user?.id}
            busy={busy}
            onPick={() => void pick(p.id)}
          />
        ))}
        {others.map((a) => (
          <AccountRow
            key={a.userId}
            account={a}
            current={a.userId === user?.id}
            busy={busy}
            onPick={() => void pick(a.userId)}
          />
        ))}
      </ul>
      <button
        type="button"
        onClick={addAnotherAccount}
        disabled={busy}
        className="state-layer mt-1 flex min-h-touch w-full items-center gap-3 px-4 py-3 text-left text-2 font-semibold"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5">
          <Plus size={iconSize.md} aria-hidden />
        </span>
        Add account
      </button>
    </Sheet>
  );
}
