import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { ownerProfile } from "@/data/profile";
import { getMyProfile } from "@/lib/portfolio.functions";
import { mergeProfileRow, profileFromRow } from "@/lib/profile-view";
import type { ProfileRow } from "@/lib/profile-map";
import { useAuth } from "@/hooks/use-auth";
import { Screen, TopBar } from "@/components/ml/ui";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "My Professional Profile | MusicLinkd" },
      {
        name: "description",
        content:
          "Manage your MusicLinkd professional identity, portfolio and collaboration profile.",
      },
      { property: "og:title", content: "My Professional Profile | MusicLinkd" },
      {
        property: "og:description",
        content: "Your MusicLinkd professional identity and portfolio.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyProfile,
});

function MyProfile() {
  const { signedIn, loading } = useAuth();
  const load = useServerFn(getMyProfile);
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (loading || !signedIn) return;
    setState("loading");
    load()
      .then((r) => {
        setRow((r ?? null) as ProfileRow | null);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [loading, signedIn, load]);

  if (loading || (signedIn && (state === "idle" || state === "loading"))) {
    return (
      <Screen>
        <TopBar title="My profile" />
        <div className="space-y-3 px-5 py-6" aria-busy>
          <div className="h-32 animate-pulse rounded-lg bg-subtle" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-subtle" />
          ))}
        </div>
      </Screen>
    );
  }

  // Signed in: your own record, with empty states for what it doesn't hold. Signed out: the demo owner.
  const view = signedIn ? mergeProfileRow(profileFromRow(row ?? {}), row) : ownerProfile;
  return <PersonProfileExperience p={view} owner />;
}
