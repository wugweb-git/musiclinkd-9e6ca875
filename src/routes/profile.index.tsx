import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { ProfileSkeleton } from "@/components/ml/profile";
import { StateCard } from "@/components/ml/portfolio";
import { ownerProfile, profileCompletion, profileInsights } from "@/data/profile";
import {
  getMyProfile,
  getMyProfileSections,
  getTaxonomyLabels,
  type ProfileSections,
  type TaxonomyLabels,
} from "@/lib/portfolio.functions";
import { mergeProfileRow, mergeSections, profileFromRow } from "@/lib/profile-view";
import { profileGaps, type ProfileRow } from "@/lib/profile-map";
import { useAuth } from "@/hooks/use-auth";
import { Btn, Screen } from "@/components/ml/ui";

export const Route = createFileRoute("/profile/")({
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
  const loadLabels = useServerFn(getTaxonomyLabels);
  const loadSections = useServerFn(getMyProfileSections);
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [labels, setLabels] = useState<TaxonomyLabels>({});
  const [sections, setSections] = useState<ProfileSections | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  // Bumped by Retry to run the load again.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (loading || !signedIn) return;
    setState("loading");
    // Without labels the chips fall back to slugs; the profile still renders.
    // Labels and sections are best-effort: without them the profile still renders.
    Promise.all([
      load(),
      loadLabels().catch((): TaxonomyLabels => ({})),
      loadSections().catch(() => null),
    ])
      .then(([r, l, sec]) => {
        setRow((r ?? null) as ProfileRow | null);
        setLabels(l);
        setSections(sec);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [loading, signedIn, load, loadLabels, loadSections, attempt]);

  if (loading || (signedIn && (state === "idle" || state === "loading"))) {
    return (
      <Screen>
        <ProfileSkeleton />
      </Screen>
    );
  }

  if (signedIn && state === "error") {
    return (
      <Screen>
        <div className="px-5 py-6">
          <StateCard
            tone="error"
            title="We couldn't load your profile"
            body="Check your connection and try again."
            action={<Btn onClick={() => setAttempt((n) => n + 1)}>Retry</Btn>}
          />
        </div>
      </Screen>
    );
  }

  // Signed in: your own record, with empty states for what it doesn't hold. Signed out: the demo owner.
  if (!signedIn) {
    return (
      <PersonProfileExperience
        p={ownerProfile}
        owner
        completion={profileCompletion}
        insights={profileInsights}
      />
    );
  }
  const view = mergeSections(
    mergeProfileRow(profileFromRow(row ?? {}), row, labels),
    sections,
    labels,
  );
  // Completion comes from the record itself; there are no insight figures for a real profile yet.
  // A new photo lands in the local row at once, so the hero shows it without a reload.
  const onImageChanged = (kind: "avatar" | "cover", url: string) =>
    setRow(
      (current) =>
        ({
          ...(current ?? {}),
          [kind === "avatar" ? "avatar_url" : "cover_url"]: url,
        }) as ProfileRow,
    );

  return (
    <PersonProfileExperience
      p={view}
      owner
      completion={profileGaps(row)}
      onImageChanged={onImageChanged}
    />
  );
}
