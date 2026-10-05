import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Bell,
  ChevronsUpDown,
  Check,
  CircleHelp,
  Inbox,
  LogOut,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { Row, RowGroup, StatusPill } from "@/components/ml/kit";
import { Sheet } from "@/components/ml/ui";
import { PersonAvatar } from "@/components/ml/person-avatar";
import { useViewer } from "@/components/ml/viewer";
import { useAuth } from "@/hooks/use-auth";
import { enterLinkedProfile, listLinkedProfiles } from "@/lib/pages.functions";
import { switchToLinked } from "@/lib/saved-accounts";
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

/*
 * Personal ↔ business switcher (plan §7.4, owner's img 3): a pill with the identity you are acting
 * as (avatar, name, ⇅) that opens the account sheet. The sheet (§7.3): who you are, your other
 * identities to switch to, then grouped rows; a › only on rows that lead to more choices.
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
          className="h-8 w-8 shrink-0 bg-ink/5 text-1"
        />
        <span className="truncate text-2 font-semibold">{displayName}</span>
        <ChevronsUpDown size={iconSize.sm} className="shrink-0 text-muted-foreground" aria-hidden />
      </button>
      <AccountSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { photo } = useViewer();
  const displayName = useIdentityName();
  const loadLinked = useServerFn(listLinkedProfiles);
  const enter = useServerFn(enterLinkedProfile);
  const linked = useQuery({
    queryKey: ["accounts", "linked", user?.id ?? null],
    queryFn: () => loadLinked(),
    enabled: open && !!user,
  });
  const [busy, setBusy] = useState(false);
  const others = (linked.data ?? []).filter((p) => p.id !== user?.id);
  const none = <></>;

  async function switchTo(id: string) {
    setBusy(true);
    try {
      await switchToLinked(id, enter);
      // A fresh start as the other identity, so nothing from this one stays on screen.
      window.location.assign("/");
    } catch {
      toast.error("Couldn't switch. Try again from Switch account.");
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Account">
      <div className="flex items-center gap-3 pb-4">
        <PersonAvatar
          name={displayName}
          photo={photo ? sized(photo, { width: 96 }) : null}
          className="h-12 w-12 shrink-0 bg-ink/5 text-2"
        />
        <div className="min-w-0">
          <p className="truncate text-2 font-semibold">{displayName}</p>
          {user?.email || user?.phone ? (
            <p className="truncate text-1 text-muted-foreground">{user.email || user.phone}</p>
          ) : null}
        </div>
      </div>

      {others.length ? (
        <RowGroup title="Switch to" flat>
          {others.map((p) => (
            <AccountRow
              key={p.id}
              account={{ ...p, email: null }}
              current={false}
              busy={busy}
              onPick={() => void switchTo(p.id)}
            />
          ))}
        </RowGroup>
      ) : null}

      <div className="border-t border-border pt-1">
        <Row
          grouped
          flat
          to="/inbox"
          icon={<Inbox size={iconSize.md} aria-hidden />}
          title="Inbox"
          right={none}
        />
        <Row
          grouped
          flat
          to="/notifications"
          icon={<Bell size={iconSize.md} aria-hidden />}
          title="Notifications"
          right={none}
        />
        <Row
          grouped
          flat
          to="/profile"
          icon={<User size={iconSize.md} aria-hidden />}
          title="Profile"
          right={none}
        />
        <Row
          grouped
          flat
          to="/settings"
          icon={<Settings size={iconSize.md} aria-hidden />}
          title="Settings"
          right={none}
        />
      </div>
      <div className="mt-1 border-t border-border pt-1">
        <Row
          grouped
          flat
          to="/accounts"
          icon={<Users size={iconSize.md} aria-hidden />}
          title="Switch account"
        />
        <Row
          grouped
          flat
          to="/help"
          icon={<CircleHelp size={iconSize.md} aria-hidden />}
          title="Help"
        />
        <Row
          grouped
          flat
          to="/auth/signout"
          icon={<LogOut size={iconSize.md} aria-hidden />}
          title="Log out"
          right={none}
        />
      </div>
    </Sheet>
  );
}
