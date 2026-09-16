import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card } from "@/components/ml/kit";
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

function PrivacyScreen() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(privacyControls.map((c) => [c.key, c.value])),
  );

  return (
    <Screen>
      <TopBar title="Privacy" subtitle="Who sees and contacts you" back="/settings" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        {privacyControls.map((c) => (
          <Card key={c.key} className="space-y-2.5">
            <div>
              <p className="text-sm font-semibold">{c.label}</p>
              <p className="text-1 text-muted-foreground">{c.hint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {c.options.map((o) => (
                <Chip
                  key={o}
                  active={values[c.key] === o}
                  onClick={() => setValues((v) => ({ ...v, [c.key]: o }))}
                >
                  {o}
                </Chip>
              ))}
            </div>
          </Card>
        ))}

        <Card className="space-y-2">
          <p className="text-1 font-semibold">Blocked people</p>
          <p className="text-1 text-muted-foreground">
            Nobody blocked. Blocking hides your profile from them everywhere.
          </p>
        </Card>

        <Card className="space-y-2">
          <p className="text-1 font-semibold">Your data</p>
          <p className="text-1 text-muted-foreground">
            Request a copy of your profile, portfolio and bookings.
          </p>
          <Btn variant="outline" className="w-full">
            Request a Copy
          </Btn>
          <BtnLink to="/settings/delete-account" variant="ghost" className="w-full">
            Delete Account
          </BtnLink>
        </Card>
      </div>
    </Screen>
  );
}
