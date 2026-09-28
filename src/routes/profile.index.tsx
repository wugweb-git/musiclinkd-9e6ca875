import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { isMyAccountBusiness } from "@/lib/profile-groups.functions";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { PersonProfileExperience } from "@/components/ml/person-profile";
import { ProfileSkeleton } from "@/components/ml/profile";
import { StateCard } from "@/components/ml/portfolio";
import { ownerProfile } from "@/data/profile";
import {
  getMyProfile,
  getMyProfileSections,
  getTaxonomyLabels,
  type ProfileSections,
  type TaxonomyLabels,
} from "@/lib/portfolio.functions";
import { mergeProfileRow, mergeSections, profileFromRow } from "@/lib/profile-view";
import type { ProfileRow } from "@/lib/profile-map";
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

/**
 * /profile is "my profile": a business account's is its business page, so it opens that
 * (/business/<username>, with Manage for the owner) instead of the talent profile.
 */
function MyProfile() {
  const { signedIn } = useAuth();
  const navigate = useNavigate();
  const checkBusiness = useServerFn(isMyAccountBusiness);
  const loadProfile = useServerFn(getMyProfile);
  const business = useQuery({
    queryKey: ["profile", "me", "business-username"],
    queryFn: async () => {
      if (!(await checkBusiness())) return null;
      const p = (await loadProfile()) as { username?: string | null } | null;
      return p?.username ?? null;
    },
    enabled: signedIn,
  });
  useEffect(() => {
    if (business.data) {
      void navigate({ to: "/business/$id", params: { id: business.data }, replace: true });
    }
  }, [business.data, navigate]);
  if (signedIn && (business.isPending || business.data)) {
    return (
      <Screen>
        <ProfileSkeleton />
      </Screen>
    );
  }
  return <PersonProfile />;
}

function PersonProfile() {
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

  // After a gallery change: the sections carry the gallery the rest of the profile shows.
  const reloadSections = () => {
    loadSections()
      .then(setSections)
      .catch(() => undefined);
  };

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
    return <PersonProfileExperience p={ownerProfile} owner />;
  }
  const view = mergeSections(
    mergeProfileRow(profileFromRow(row ?? {}), row, labels),
    sections,
    labels,
  );
  return <PersonProfileExperience p={view} owner onGalleryChange={reloadSections} />;
}
