import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
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
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { SegmentedField } from "@/components/ml/kit";
import { privacyControls } from "@/data/settings";

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

function PrivacyScreen() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(privacyControls.map((c) => [c.key, c.value])),
  );

  return (
    <Screen>
      <TopBar title="Privacy" subtitle="Who sees and contacts you" back="/settings" />
      <div className="space-y-6 px-5 pt-4 pb-6">
        {/* One list, not a card per question: the hairlines already separate them. */}
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          {privacyControls.map((c) => {
            const Icon = controlIcons[c.icon] ?? Circle;
            return (
              <li key={c.key} className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-subtle">
                    <Icon size={18} strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-2 font-semibold">{c.label}</p>
                    <p className="text-1 text-muted-foreground">{c.hint}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <SegmentedField
                    label={c.label}
                    value={values[c.key] ?? c.value}
                    options={c.options}
                    onChange={(next) => setValues((v) => ({ ...v, [c.key]: next }))}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <section>
          <h2 className="pill mb-2 px-1 text-muted-foreground">Blocked people</h2>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-subtle">
              <UserX size={18} strokeWidth={1.75} aria-hidden />
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
              icon={<Download size={16} aria-hidden />}
            >
              Request Copy
            </Btn>
            <BtnLink
              to="/settings/delete-account"
              variant="outline"
              className="min-w-0 flex-1 px-3"
              icon={<Trash2 size={16} aria-hidden />}
            >
              Delete Account
            </BtnLink>
          </div>
        </section>
      </div>
    </Screen>
  );
}
