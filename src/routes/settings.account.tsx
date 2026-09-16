import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, StatusPill } from "@/components/ml/kit";
import { accountFields } from "@/data/settings";

export const Route = createFileRoute("/settings/account")({
  head: () => ({
    meta: [
      { title: "Account details | MusicLinkd" },
      {
        name: "description",
        content: "Email, phone, username, language and currency for your account.",
      },
      { property: "og:title", content: "Account details | MusicLinkd" },
      { property: "og:description", content: "Keep your sign-in details up to date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountScreen,
});

function AccountScreen() {
  const [editing, setEditing] = useState<string | null>(null);
  const field = accountFields.find((f) => f.key === editing);

  return (
    <Screen>
      <TopBar title="Account" subtitle="Sign-in and basics" back="/settings" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="p-0">
          {accountFields.map((f) => (
            <div
              key={f.key}
              className="flex items-center gap-3 border-b border-border p-4 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <p className="pill bg-subtle text-muted-foreground">{f.label}</p>
                <p className="mt-0.5 flex items-center gap-2 truncate text-1 font-semibold">
                  {f.value}
                  {f.verified ? <StatusPill label="verified" tone="good" /> : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(f.key)}
                className="shrink-0 text-1 font-semibold text-foreground"
              >
                {f.action}
              </button>
            </div>
          ))}
        </Card>
        <p className="px-1 text-1 text-muted-foreground">
          Changing your email or phone asks you to confirm the new one before it becomes your
          sign-in.
        </p>
      </div>

      <Sheet
        open={!!field}
        onClose={() => setEditing(null)}
        title={field ? `Change ${field.label.toLowerCase()}` : ""}
      >
        <div className="space-y-3">
          <label className="block">
            <span className="pill bg-subtle text-muted-foreground">
              New {field?.label.toLowerCase()}
            </span>
            <input
              defaultValue={field?.value ?? ""}
              className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-1 outline-none focus:border-primary"
            />
          </label>
          <p className="text-1 text-muted-foreground">
            We send a confirmation before anything changes.
          </p>
          <Btn className="w-full" onClick={() => setEditing(null)}>
            Send confirmation
          </Btn>
        </div>
      </Sheet>
    </Screen>
  );
}
