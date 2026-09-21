/**
 * FLOW-23 · QR-22 "QR & sharing settings" · route: /identity/settings
 * Privacy controls that decide what any share can contain.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMyIdentity } from "@/hooks/use-my-identity";
import { defaultQrPrefs, type QrPrefs } from "@/lib/qr-prefs";
import { useAuth } from "@/hooks/use-auth";
import { saveMyProfile } from "@/lib/portfolio.functions";

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
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const save = useServerFn(saveMyProfile);
  const [state, setState] = useState<QrPrefs>(defaultQrPrefs);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof QrPrefs) => (v: boolean) => setState((s) => ({ ...s, [k]: v }));

  // What is stored (profiles.discovery_prefs.qr) wins; a share toggle for a contact field the
  // profile doesn't have starts off — there is nothing to share on an empty field.
  const stored = JSON.stringify(me.qr);
  useEffect(() => {
    if (!me.ready) return;
    const qr = JSON.parse(stored) as QrPrefs;
    setState({
      ...qr,
      phone: qr.phone && Boolean(me.contact.phone),
      email: qr.email && Boolean(me.contact.email),
      website: qr.website && Boolean(me.contact.website),
      company: qr.company && Boolean(me.contact.company),
    });
  }, [
    me.ready,
    stored,
    me.contact.phone,
    me.contact.email,
    me.contact.website,
    me.contact.company,
  ]);

  async function onSave() {
    if (!signedIn) return;
    setSaving(true);
    try {
      await save({ data: { discovery_prefs: { qr: state } } });
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Sharing preferences updated");
    } catch {
      toast.error("That didn't save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <TopBar title="QR & sharing" subtitle="Privacy controls" back="/settings" />
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
          <Btn
            className="flex-1"
            loading={saving}
            disabled={!signedIn}
            onClick={() => void onSave()}
          >
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
