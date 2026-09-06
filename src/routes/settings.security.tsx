import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, LogOut } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, StatusPill, Dialog } from "@/components/ml/kit";
import { sessions as seed, securityRows } from "@/data/settings";

export const Route = createFileRoute("/settings/security")({
  head: () => ({
    meta: [
      { title: "Security | MusicLinkd" },
      { name: "description", content: "Password, two-step verification and the devices signed in to your account." },
      { property: "og:title", content: "Security | MusicLinkd" },
      { property: "og:description", content: "Keep your MusicLinkd account safe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityScreen,
});

function SecurityScreen() {
  const [sessions, setSessions] = useState(seed);
  const [confirmAll, setConfirmAll] = useState(false);

  return (
    <Screen>
      <TopBar title="Security" subtitle="Password and devices" back="/settings" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="p-0">
          {securityRows.map((r) => (
            <Link key={r.key} to={r.to} className="flex items-center gap-3 border-b border-border p-4 last:border-0">
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold">{r.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{r.hint}</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>

        <Card className="space-y-1">
          <h2 className="text-[15px]">Where you are signed in</h2>
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-0">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-[13px] font-semibold">
                  {s.device}
                  {s.current ? <StatusPill label="this device" tone="good" /> : null}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {s.place} · {s.when}
                </p>
              </div>
              {!s.current ? (
                <button
                  type="button"
                  onClick={() => setSessions((list) => list.filter((x) => x.id !== s.id))}
                  className="shrink-0 text-[12px] font-semibold text-primary"
                >
                  Sign out
                </button>
              ) : null}
            </div>
          ))}
          <Btn variant="outline" className="mt-2 w-full" onClick={() => setConfirmAll(true)}>
            <span className="inline-flex items-center gap-2">
              <LogOut size={15} /> Sign out everywhere else
            </span>
          </Btn>
        </Card>
      </div>

      <Dialog
        open={confirmAll}
        title="Sign out other devices?"
        body="You stay signed in here. Everyone else will need your password again."
        onClose={() => setConfirmAll(false)}
      >
        <div className="space-y-2">
          <Btn
            className="w-full"
            onClick={() => {
              setSessions((list) => list.filter((s) => s.current));
              setConfirmAll(false);
            }}
          >
            Sign them out
          </Btn>
          <Btn variant="ghost" className="w-full" onClick={() => setConfirmAll(false)}>
            Cancel
          </Btn>
        </div>
      </Dialog>
    </Screen>
  );
}
