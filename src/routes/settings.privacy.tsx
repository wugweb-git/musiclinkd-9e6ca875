import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Briefcase,
  Calendar,
  Check,
  ChevronRight,
  Circle,
  Compass,
  Download,
  Eye,
  MessageSquare,
  Phone,
  Send,
  Trash2,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { SoonBadge, Switch } from "@/components/ml/kit";
import { ChipPicker, OptionList } from "@/components/ml/onboarding";
import { privacyControls } from "@/data/settings";
import { contactChannels, intents as intentOptions, workModes } from "@/data/onboarding";
import { getMyProfile, saveMyProfile } from "@/lib/portfolio.functions";
import { exportMyData } from "@/lib/account.functions";
import { iconSize } from "@/lib/tokens";
import { analyticsConfigured, analyticsConsent, setAnalyticsConsent } from "@/lib/analytics";
import { DOWNLOAD_UNAVAILABLE, downloadBlob } from "@/lib/download";

export const Route = createFileRoute("/settings/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy | MusicLinkd" },
      {
        name: "description",
        content: "Choose who can see your profile, message you and find you in Discover.",
      },
      { property: "og:title", content: "Privacy | MusicLinkd" },
      { property: "og:description", content: "Control your visibility on MusicLinkd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyScreen,
});

const controlIcons: Record<string, LucideIcon> = {
  eye: Eye,
  message: MessageSquare,
  phone: Phone,
  compass: Compass,
};

/*
 * "Profile visibility" is its own column. Everything else here lives in the same
 * profiles.discovery_prefs jsonb, so a save always sends the whole object back — a plain
 * upsert would otherwise silently drop whichever key isn't part of this particular change.
 */
const LIVE_KEYS = new Set(["visibility", "discovery", "contact", "phone"]);

const visibilityToDb: Record<string, string> = {
  Public: "public",
  Members: "members",
  Limited: "limited",
};
const visibilityFromDb: Record<string, string> = {
  public: "Public",
  members: "Members",
  limited: "Limited",
};

const contactToDb: Record<string, string> = {
  Anyone: "anyone",
  Connections: "connections",
  Nobody: "nobody",
};
const contactFromDb: Record<string, string> = {
  anyone: "Anyone",
  connections: "Connections",
  nobody: "Nobody",
};
const phoneToDb: Record<string, string> = { Never: "never", Booked: "booked", Always: "always" };
const phoneFromDb: Record<string, string> = { never: "Never", booked: "Booked", always: "Always" };

function PrivacyScreen() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyProfile);
  const save = useServerFn(saveMyProfile);
  const profile = useQuery({ queryKey: ["profile", "me"], queryFn: () => load() });
  const row = profile.data as
    | {
        visibility?: string | null;
        discovery_prefs?: {
          appear?: boolean;
          who_can_message?: string;
          show_phone?: string;
        } | null;
        contact_channels?: string[] | null;
        work_modes?: string[] | null;
        intents?: string[] | null;
        // "Available" or null: the one "Open to work" switch (owner, 10 Oct 2026).
        availability?: string | null;
      }
    | null
    | undefined;

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(privacyControls.map((c) => [c.key, c.value])),
  );

  // Three more, each a multi-select drawer, each saving straight to its own column on tap.
  const [reach, setReach] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [openToWork, setOpenToWork] = useState(false);
  const [myIntents, setMyIntents] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<"reach" | "modes" | "intents" | null>(null);
  // Read after mount so the server render and the first client render agree; storage is per device.
  const [analyticsOn, setAnalyticsOn] = useState(false);
  useEffect(() => setAnalyticsOn(analyticsConsent()), []);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!row) return;
    setReach(row.contact_channels ?? []);
    setModes(row.work_modes ?? []);
    setOpenToWork(row.availability === "Available");
    setMyIntents(row.intents ?? []);
    setValues((v) => ({
      ...v,
      visibility: visibilityFromDb[row.visibility ?? "public"] ?? "Public",
      discovery: row.discovery_prefs?.appear === false ? "No" : "Yes",
      contact: contactFromDb[row.discovery_prefs?.who_can_message ?? "anyone"] ?? "Anyone",
      phone: phoneFromDb[row.discovery_prefs?.show_phone ?? "booked"] ?? "Booked",
    }));
  }, [row]);

  // Your data: the account's own rows, saved to this device as one JSON file.
  const exportData = useServerFn(exportMyData);
  const [exporting, setExporting] = useState(false);
  async function requestCopy() {
    setExporting(true);
    try {
      const { fileName, json } = await exportData();
      const blob = new Blob([json], { type: "application/json" });
      // A "download my data" request that quietly does nothing is the worst kind to get wrong.
      if (!downloadBlob(fileName, blob)) toast.error(DOWNLOAD_UNAVAILABLE);
    } catch {
      toast.error("Couldn't prepare your copy — try again");
    } finally {
      setExporting(false);
    }
  }

  const [editing, setEditing] = useState<string | null>(null);
  const open = privacyControls.find((c) => c.key === editing);

  /** Every one of the three writes its own column, so a save carries only what changed. */
  async function saveMulti(patch: Record<string, unknown>) {
    setBusy(true);
    try {
      await save({ data: patch });
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
    } catch {
      toast.error("Couldn't save that — try again");
    } finally {
      setBusy(false);
    }
  }

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const summarise = (list: string[], labelFor: (v: string) => string) =>
    list.length ? list.map(labelFor).join(", ") : "Not set";

  const workRows = [
    {
      key: "reach" as const,
      icon: Send,
      label: "How people reach you",
      hint: summarise(reach, (k) => contactChannels.find((c) => c.key === k)?.label ?? k),
    },
    {
      key: "modes" as const,
      icon: Briefcase,
      label: "Where you work",
      hint: summarise(modes, (k) => workModes.find((w) => w.key === k)?.label ?? k),
    },
  ];

  async function choose(key: string, option: string) {
    const next = { ...values, [key]: option };
    setValues(next);
    setEditing(null);
    if (!LIVE_KEYS.has(key)) return;
    try {
      if (key === "visibility") {
        await save({ data: { visibility: visibilityToDb[option] ?? "public" } });
      } else {
        await save({
          data: {
            discovery_prefs: {
              appear: next["discovery"] !== "No",
              who_can_message: contactToDb[next["contact"] ?? "Anyone"] ?? "anyone",
              show_phone: phoneToDb[next["phone"] ?? "Booked"] ?? "booked",
            },
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Saved");
    } catch {
      toast.error("Couldn't save that — try again");
    }
  }

  return (
    <Screen tone="white">
      <TopBar title="Privacy" subtitle="Who sees and contacts you" back="/settings" />
      <div className="space-y-6 px-5 pt-4 pb-6">
        {/* One list, not a card per question: the hairlines already separate them. */}
        <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
          {privacyControls.map((c) => {
            const Icon = controlIcons[c.icon] ?? Circle;
            const live = LIVE_KEYS.has(c.key);
            return (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => (live ? setEditing(c.key) : toast(`${c.label} — coming soon`))}
                  aria-disabled={!live}
                  className="state-layer flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="flex h-10 w-7 shrink-0 items-center justify-center">
                    <Icon size={24} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-2 font-semibold">{c.label}</span>
                    <span className="block text-1 text-muted-foreground">{c.hint}</span>
                  </span>
                  {live ? (
                    <>
                      <span className="shrink-0 text-1 font-semibold">
                        {values[c.key] ?? c.value}
                      </span>
                      <ChevronRight
                        size={iconSize.md}
                        className="shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </>
                  ) : (
                    <SoonBadge />
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Usage analytics. Only offered when the build actually has a measurement id, and off
            until it is switched on here — nothing reports on first paint. */}
        {analyticsConfigured() ? (
          <section className="rounded-lg bg-subtle p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Usage analytics</p>
              <Switch
                checked={analyticsOn}
                onChange={(next) => {
                  setAnalyticsOn(next);
                  setAnalyticsConsent(next);
                }}
                label="Usage analytics"
              />
            </div>
            <p className="mt-1 text-1 text-muted-foreground">
              Sends which screens are opened. Never your name, your handle or anything you type.
            </p>
          </section>
        ) : null}

        {/* The other three of the four: each opens its own drawer, each saves on tap. */}
        <section>
          <h2 className="pill mb-2 px-1 text-muted-foreground">Work and availability</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
            {workRows.map((r) => (
              <li key={r.key}>
                <button
                  type="button"
                  onClick={() => setDrawer(r.key)}
                  className="state-layer flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="flex h-10 w-7 shrink-0 items-center justify-center">
                    <r.icon size={24} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-2 font-semibold">{r.label}</span>
                    <span className="block truncate text-1 text-muted-foreground">{r.hint}</span>
                  </span>
                  <ChevronRight
                    size={iconSize.md}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </button>
              </li>
            ))}
            {/* Availability is one switch, "Available" or nothing; the old "Available for" list
                is retired (owner, 10 Oct 2026). */}
            <li className="flex min-h-touch items-center gap-3 px-4 py-3.5">
              <span className="flex h-10 w-7 shrink-0 items-center justify-center">
                <Calendar size={24} aria-hidden />
              </span>
              <span className="min-w-0 flex-1 text-2 font-semibold">Open to work</span>
              <Switch
                label="Open to work"
                checked={openToWork}
                onChange={(on) => {
                  setOpenToWork(on);
                  void saveMulti({ availability: on ? "Available" : null });
                }}
              />
            </li>
          </ul>
        </section>

        <section>
          <h2 className="pill mb-2 px-1 text-muted-foreground">What you're here for</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
            <li>
              <button
                type="button"
                onClick={() => setDrawer("intents")}
                className="state-layer flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex h-10 w-7 shrink-0 items-center justify-center">
                  <Compass size={24} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-2 font-semibold">Goals on MusicLinkd</span>
                  <span className="block truncate text-1 text-muted-foreground">
                    {summarise(myIntents, (v) => v)}
                  </span>
                </span>
                <ChevronRight
                  size={iconSize.md}
                  className="shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </button>
            </li>
          </ul>
          <p className="mt-2 px-1 text-1 text-muted-foreground">
            Set when you joined; shapes your home feed and recommendations.
          </p>
        </section>

        <section>
          <h2 className="pill mb-2 px-1 text-muted-foreground">Your data</h2>
          <p className="mb-3 px-1 text-1 text-muted-foreground">
            A copy covers your profile, portfolio and bookings. Deleting removes them.
          </p>
          <div className="flex items-center gap-2">
            <Btn
              variant="outline"
              className="min-w-0 flex-1 px-3"
              icon={<Download size={iconSize.sm} aria-hidden />}
              loading={exporting}
              onClick={() => void requestCopy()}
            >
              Request Copy
            </Btn>
            <BtnLink
              to="/settings/delete-account"
              variant="outline"
              className="min-w-0 flex-1 px-3"
              icon={<Trash2 size={iconSize.sm} aria-hidden />}
            >
              Delete Account
            </BtnLink>
          </div>
        </section>
      </div>
      <Sheet open={drawer === "reach"} onClose={() => setDrawer(null)} title="How people reach you">
        <OptionList
          options={contactChannels.filter((c) => c.key !== "business")}
          selected={reach}
          onToggle={(k) => {
            const next = toggleIn(reach, k);
            setReach(next);
            void saveMulti({ contact_channels: next });
          }}
        />
        <p className="mt-3 text-1 text-muted-foreground">
          {busy ? "Saving…" : "Nothing private is published. You choose what to share per enquiry."}
        </p>
      </Sheet>

      <Sheet open={drawer === "modes"} onClose={() => setDrawer(null)} title="Where you work">
        <OptionList
          options={workModes}
          selected={modes}
          onToggle={(k) => {
            const next = toggleIn(modes, k);
            setModes(next);
            void saveMulti({ work_modes: next });
          }}
        />
      </Sheet>

      <Sheet
        open={drawer === "intents"}
        onClose={() => setDrawer(null)}
        title="Goals on MusicLinkd"
      >
        <ChipPicker
          options={intentOptions}
          selected={myIntents}
          onToggle={(v) => {
            const next = toggleIn(myIntents, v);
            setMyIntents(next);
            void saveMulti({ intents: next });
          }}
        />
      </Sheet>

      <Sheet
        open={!!open}
        onClose={() => setEditing(null)}
        {...(open ? { title: open.label } : {})}
      >
        {open ? (
          <div role="radiogroup" aria-label={open.label}>
            {open.options.map((o) => {
              const checked = (values[open.key] ?? open.value) === o;
              return (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => void choose(open.key, o)}
                  className="state-layer flex w-full items-center justify-between py-3.5 text-left text-sm font-semibold"
                >
                  {o}
                  {checked ? (
                    <Check
                      size={iconSize.md}
                      className="animate-pop text-pink-strong"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </Sheet>
    </Screen>
  );
}
