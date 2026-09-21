import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { AccountRow } from "@/components/ml/accounts";
import { useAuth } from "@/hooks/use-auth";
import {
  addAnotherAccount,
  forgetAccount,
  readAccounts,
  switchTo,
  type SavedAccount,
} from "@/lib/saved-accounts";
import { iconSize } from "@/lib/tokens";

/*
 * Switch account: the talent and business accounts signed in on this device, one tap apart
 * (src/lib/saved-accounts.ts). Each stays its own account with its own @username.
 */
export const Route = createFileRoute("/accounts")({
  head: () => ({
    meta: [
      { title: "Switch account | MusicLinkd" },
      {
        name: "description",
        content: "Move between your talent and business accounts without signing out.",
      },
      { property: "og:title", content: "Switch account | MusicLinkd" },
      { property: "og:description", content: "Your accounts on this device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Accounts,
});

function Accounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => setAccounts(readAccounts()), [user]);

  async function pick(userId: string) {
    setBusy(true);
    try {
      await switchTo(userId);
      // A fresh start, so nothing from the other account stays on screen.
      window.location.assign("/");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't switch account");
      setAccounts(readAccounts());
      setBusy(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Switch account" subtitle="On this device" back="/settings" />
      <div className="space-y-4 px-5 pt-4 pb-8">
        <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
          {accounts.map((a) => (
            <AccountRow
              key={a.userId}
              account={a}
              current={a.userId === user?.id}
              busy={busy}
              onPick={() => void pick(a.userId)}
              onRemove={() => {
                forgetAccount(a.userId);
                setAccounts(readAccounts());
              }}
            />
          ))}
        </ul>
        <Btn variant="outline" className="w-full" onClick={addAnotherAccount} disabled={busy}>
          <Plus size={iconSize.sm} className="mr-1.5" aria-hidden /> Add Account
        </Btn>
      </div>
    </Screen>
  );
}
