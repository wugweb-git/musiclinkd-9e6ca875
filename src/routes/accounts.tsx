import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Store } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { AccountRow } from "@/components/ml/accounts";
import { useAuth } from "@/hooks/use-auth";
import {
  addAnotherAccount,
  forgetAccount,
  switchTo,
  switchToLinked,
  useSavedAccounts,
} from "@/lib/saved-accounts";
import { enterLinkedProfile, listLinkedProfiles } from "@/lib/pages.functions";
import { iconSize } from "@/lib/tokens";

/*
 * Switch account. First you and your business page (one sign-in owns one page, like Facebook and
 * LinkedIn pages: src/lib/pages.functions.ts), then any other sign-ins saved on this device
 * (src/lib/saved-accounts.ts). A talent sign-in without a page can create one here.
 */
export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Switch account | MusicLinkd" },
      {
        name: "description",
        content: "Move between you and your business page without signing out.",
      },
      { property: "og:title", content: "Switch account | MusicLinkd" },
      { property: "og:description", content: "Your profiles and accounts on this device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Accounts,
});

function Accounts() {
  const { user, signedIn } = useAuth();
  const saved = useSavedAccounts();
  const loadLinked = useServerFn(listLinkedProfiles);
  const enter = useServerFn(enterLinkedProfile);
  const linked = useQuery({
    queryKey: ["accounts", "linked", user?.id ?? null],
    queryFn: () => loadLinked(),
    enabled: signedIn,
  });
  const [busy, setBusy] = useState(false);

  const mine = linked.data ?? [];
  const linkedIds = new Set(mine.map((p) => p.id));
  const others = saved.filter((a) => !linkedIds.has(a.userId));
  // A talent sign-in with no page yet: the business journey starts here.
  const canCreatePage = linked.isSuccess && mine.length === 1 && mine[0]!.kind === "talent";

  async function pick(id: string) {
    setBusy(true);
    try {
      if (linkedIds.has(id)) await switchToLinked(id, enter);
      else await switchTo(id);
      // A fresh start, so nothing from the other profile stays on screen.
      window.location.assign("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't switch account");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Switch account" subtitle="On this device" back="/settings" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
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
              onRemove={() => forgetAccount(a.userId)}
            />
          ))}
        </ul>
        {canCreatePage ? (
          <BtnLink
            to="/setup/$step"
            params={{ step: "role" }}
            search={{ as: "business" as const }}
            className="w-full"
          >
            <Store size={iconSize.sm} className="mr-1.5" aria-hidden /> Create Business Page
          </BtnLink>
        ) : null}
        <Btn variant="outline" className="w-full" onClick={addAnotherAccount} disabled={busy}>
          <Plus size={iconSize.sm} className="mr-1.5" aria-hidden /> Add Account
        </Btn>
      </div>
    </Screen>
  );
}
