/**
 * FLOW-23 · QR-22 "QR & sharing settings" · route: /identity/settings
 * Privacy controls that decide what any share can contain.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { useMyIdentity } from "@/hooks/use-my-identity";

export const Route = createFileRoute("/identity/settings")({
  head: () => ({
    meta: [
      { title: "QR & sharing settings — MusicLinkd" },
      {
        name: "description",
        content:
          "Control what your MusicLinkd QR shares, who can find you by code, and whether scan analytics are collected.",
      },
      { property: "og:title", content: "QR & sharing settings" },
      { property: "og:description", content: "You decide what leaves your profile." },
    ],
  }),
  component: QrSettings,
});

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[20px] bg-subtle px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {hint ? <span className="block text-1 text-muted-foreground">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 shrink-0 accent-[var(--pink)]"
      />
    </label>
  );
}

function QrSettings() {
  const me = useMyIdentity();
  const [state, setState] = useState({
    active: true,
    phone: false,
    email: false,
    website: false,
    company: false,
    analytics: true,
    discoverable: true,
  });
  const set = (k: keyof typeof state) => (v: boolean) => setState((s) => ({ ...s, [k]: v }));

  // Default each share toggle on only for a contact field the real profile actually has —
  // there is nothing to share, or fabricate a preference for, on an empty field.
  useEffect(() => {
    if (!me.ready) return;
    setState((s) => ({
      ...s,
      phone: Boolean(me.phone),
      email: Boolean(me.email),
      website: Boolean(me.website),
    }));
  }, [me.ready, me.phone, me.email, me.website]);

  return (
    <Screen>
      <TopBar title="QR & sharing" subtitle="Privacy controls" back="/identity/qr" />
      <main className="flex flex-col gap-2 px-5 pt-4">
        <Toggle
          label="My QR is active"
          hint="Turning this off shows a 'no longer active' page to anyone scanning."
          value={state.active}
          onChange={set("active")}
        />
        <Toggle
          label="Findable by code"
          hint="Allow people to open your profile from a scanned code."
          value={state.discoverable}
          onChange={set("discoverable")}
        />

        <p className="pill mt-3 px-1 bg-background text-muted-foreground">
          Shared on my digital card
        </p>
        <Toggle label="Phone number" value={state.phone} onChange={set("phone")} />
        <Toggle label="Email address" value={state.email} onChange={set("email")} />
        <Toggle label="Company" value={state.company} onChange={set("company")} />
        <Toggle label="Website" value={state.website} onChange={set("website")} />

        <p className="pill mt-3 px-1 bg-background text-muted-foreground">Insights</p>
        <Toggle
          label="Count scans of my QR"
          hint="Aggregate counts only — never who scanned it."
          value={state.analytics}
          onChange={set("analytics")}
        />

        <div className="mt-4 flex gap-2">
          <Btn className="flex-1" onClick={() => toast.success("Sharing preferences updated")}>
            Save
          </Btn>
          <BtnLink to="/identity/analytics" variant="outline" className="flex-1 w-full">
            View Analytics
          </BtnLink>
        </div>

        <p className="mt-3 px-1 pb-2 text-1 text-muted-foreground">
          MusicLinkd QR codes never contain contact details, tokens or location — only a public
          link.
        </p>
      </main>
    </Screen>
  );
}
