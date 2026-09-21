import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, SoonBadge, StatusPill } from "@/components/ml/kit";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { claimMyUsername, getMyProfile } from "@/lib/portfolio.functions";
import { isPageEmail } from "@/lib/pages";
import { emailProblem, indianPhone, phoneProblem } from "@/lib/validation";

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

type FieldKey = "email" | "phone" | "username" | "language" | "currency";

/** Fixed for everyone (owner, 18 Sep 2026): English and ₹. Shown, not changeable. */
const FIXED_FIELDS = new Set<FieldKey>(["language", "currency"]);

function AccountScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const loadProfile = useServerFn(getMyProfile);
  const claimUsername = useServerFn(claimMyUsername);
  const profile = useQuery({ queryKey: ["profile", "me"], queryFn: () => loadProfile() });
  const row = profile.data as { username?: string | null } | null | undefined;

  const fields: {
    key: FieldKey;
    label: string;
    value: string;
    verified: boolean;
    action: string;
  }[] = [
    // A business page signs in through its owner, so it has no email of its own to show.
    ...(isPageEmail(user?.email)
      ? []
      : [
          {
            key: "email" as FieldKey,
            label: "Email",
            value: user?.email ?? "—",
            verified: !!user?.email_confirmed_at,
            action: "Change",
          },
        ]),
    {
      key: "phone",
      label: "Phone",
      value: user?.phone ?? "Not set",
      verified: !!user?.phone_confirmed_at,
      action: user?.phone ? "Change" : "Add",
    },
    {
      key: "username",
      label: "Username",
      value: row?.username ? `@${row.username}` : "Not set",
      verified: false,
      action: row?.username ? "Locked" : "Claim",
    },
    {
      key: "language",
      label: "Language",
      value: "English (India)",
      verified: false,
      action: "Change",
    },
    { key: "currency", label: "Currency", value: "INR ₹", verified: false, action: "Change" },
  ];

  const [editing, setEditing] = useState<FieldKey | null>(null);
  const field = fields.find((f) => f.key === editing);
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setInput(field?.key === "email" || field?.key === "phone" ? "" : ""), [field]);

  const problem =
    field?.key === "email" && input.trim()
      ? emailProblem(input)
      : field?.key === "phone" && input.trim()
        ? phoneProblem(input)
        : null;

  async function submit() {
    if (!field || !input.trim() || problem) return;
    setSaving(true);
    try {
      if (field.key === "email") {
        const { error } = await supabase.auth.updateUser({ email: input.trim().toLowerCase() });
        if (error) throw error;
        toast.success("Check your new email to confirm the change");
      } else if (field.key === "phone") {
        const { error } = await supabase.auth.updateUser({ phone: indianPhone(input)! });
        if (error) throw error;
        toast.success("Check your phone for a confirmation code");
      } else if (field.key === "username") {
        const result = await claimUsername({ data: { username: input.trim() } });
        if (result.status === "claimed") {
          toast.success("Username claimed");
          await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
        } else if (result.status === "taken") toast.error("That username is taken");
        else if (result.status === "invalid") toast.error("That username isn't valid");
        else toast.error("Usernames can't be changed once set");
      }
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save that — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Account" subtitle="Sign-in and basics" back="/settings" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="p-0">
          {fields.map((f) => {
            const fixed = FIXED_FIELDS.has(f.key);
            const locked = f.key === "username" && f.action === "Locked";
            return (
              <div
                key={f.key}
                className="flex items-center gap-3 border-b border-border p-4 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="pill bg-background text-muted-foreground">{f.label}</p>
                  <p className="mt-0.5 flex items-center gap-2 truncate text-1 font-semibold">
                    {f.value}
                    {f.verified ? <StatusPill label="verified" tone="good" /> : null}
                  </p>
                </div>
                {fixed ? null : locked ? (
                  <span className="shrink-0 text-1 text-muted-foreground">Locked</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing(f.key)}
                    className="shrink-0 text-1 font-semibold text-foreground"
                  >
                    {f.action}
                  </button>
                )}
              </div>
            );
          })}
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
            <span className="pill bg-background text-muted-foreground">
              New {field?.label.toLowerCase()}
            </span>
            {field?.key === "phone" ? (
              <span className="mt-1.5 flex min-h-control items-center rounded-lg border border-border bg-background focus-within:border-primary">
                <span className="pl-3 text-1 text-muted-foreground">+91</span>
                <input
                  value={input}
                  inputMode="tel"
                  autoComplete="tel-national"
                  onChange={(e) => setInput(e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
                  placeholder="98xxxxxxxx"
                  className="min-h-control w-full bg-transparent px-2 text-1 outline-none"
                />
              </span>
            ) : (
              <input
                value={input}
                {...(field?.key === "email"
                  ? { type: "email", inputMode: "email" as const, autoComplete: "email" }
                  : {})}
                onChange={(e) => setInput(e.target.value)}
                className="mt-1.5 min-h-control w-full rounded-lg border border-border bg-background px-3 text-1 outline-none focus:border-primary"
              />
            )}
          </label>
          {problem ? (
            <p role="alert" className="text-1 text-destructive">
              {problem}
            </p>
          ) : null}
          <p className="text-1 text-muted-foreground">
            We send a confirmation before anything changes.
          </p>
          <Btn
            className="w-full"
            onClick={() => void submit()}
            disabled={saving || !input.trim() || Boolean(problem)}
          >
            Send confirmation
          </Btn>
        </div>
      </Sheet>
    </Screen>
  );
}
