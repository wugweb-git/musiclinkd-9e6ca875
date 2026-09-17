import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Circle,
  Compass,
  Download,
  Eye,
  MessageSquare,
  Phone,
  Trash2,
  UserX,
  type LucideIcon,
} from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { SoonBadge } from "@/components/ml/kit";
import { privacyControls } from "@/data/settings";
import { getMyProfile, saveMyProfile } from "@/lib/portfolio.functions";
import { iconSize } from "@/lib/tokens";

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
 * Only "Profile visibility" (profiles.visibility) and "Appear in Discover"
 * (profiles.discovery_prefs.appear) are backed by real columns. "Who can message you" and
 * "Show phone number" have no schema yet, so they stay local/soon rather than pretending to save.
 */
const LIVE_KEYS = new Set(["visibility", "discovery"]);

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

function PrivacyScreen() {
  const queryClient = useQueryClient();
  const load = useServerFn(getMyProfile);
  const save = useServerFn(saveMyProfile);
  const profile = useQuery({ queryKey: ["profile", "me"], queryFn: () => load() });
  const row = profile.data as
    | { visibility?: string | null; discovery_prefs?: { appear?: boolean } | null }
    | null
    | undefined;

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(privacyControls.map((c) => [c.key, c.value])),
  );
  useEffect(() => {
    if (!row) return;
    setValues((v) => ({
      ...v,
      visibility: visibilityFromDb[row.visibility ?? "public"] ?? "Public",
      discovery: row.discovery_prefs?.appear === false ? "No" : "Yes",
    }));
  }, [row]);

  const [editing, setEditing] = useState<string | null>(null);
  const open = privacyControls.find((c) => c.key === editing);

  async function choose(key: string, option: string) {
    setValues((v) => ({ ...v, [key]: option }));
    setEditing(null);
    if (!LIVE_KEYS.has(key)) return;
    try {
      if (key === "visibility") {
        await save({ data: { visibility: visibilityToDb[option] ?? "public" } });
      } else if (key === "discovery") {
        await save({ data: { discovery_prefs: { appear: option === "Yes" } } });
      }
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      toast.success("Saved");
    } catch {
      toast.error("Couldn't save that — try again");
    }
  }

  return (
    <Screen>
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
                  onClick={() =>
                    live ? setEditing(c.key) : toast(`${c.label} — coming soon`)
                  }
                  aria-disabled={!live}
                  className="state-layer flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="flex h-10 w-7 shrink-0 items-center justify-center">
                    <Icon size={24} strokeWidth={1.75} aria-hidden />
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

        <section>
          <h2 className="pill mb-2 px-1 text-muted-foreground">Blocked people</h2>
          <div className="flex items-center gap-3 rounded-lg bg-subtle px-4 py-3.5">
            <span className="flex h-10 w-7 shrink-0 items-center justify-center">
              <UserX size={iconSize.lg} strokeWidth={1.75} aria-hidden />
            </span>
            <p className="min-w-0 flex-1 text-1 text-muted-foreground">
              Nobody blocked. Blocking hides your profile from them everywhere.
            </p>
          </div>
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
              onClick={() => toast("Request copy — coming soon")}
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
