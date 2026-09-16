import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { BtnLink, TopBar } from "@/components/ml/ui";
import { OnboardingProvider, useOnboarding } from "@/components/ml/onboarding";
import { ProfileHero } from "@/components/ml/profile";
import { linkPlatforms, visibilityOptions, visibleSteps } from "@/data/onboarding";
import type { TaxonomyLabels } from "@/lib/portfolio.functions";
import { draftToProfile, type ProfileRow } from "@/lib/profile-map";
import { mergeProfileRow, profileFromRow } from "@/lib/profile-view";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { AuthLink } from "@/components/ml/auth";

export const Route = createFileRoute("/onboarding/preview")({
  head: () => ({
    meta: [
      { title: "Preview your profile — MusicLinkd" },
      {
        name: "description",
        content:
          "See exactly how your MusicLinkd profile looks to other musicians, studios and clients before you publish.",
      },
      { property: "og:title", content: "Preview your profile — MusicLinkd" },
      {
        property: "og:description",
        content: "How your profile looks to the rest of the industry.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <Preview />
    </OnboardingProvider>
  ),
});

/** One detail row: what it is, what's set (or "Add"), and a tap to the step that edits it. */
function DetailRow({
  label,
  values,
  onEdit,
}: {
  label: string;
  values: string[];
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="state-layer flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
    >
      <span className="w-28 shrink-0 text-sm font-medium">{label}</span>
      <span
        className={`min-w-0 flex-1 text-sm ${values.length ? "text-foreground" : "text-muted-foreground"}`}
      >
        {values.length ? values.join(", ") : "Add"}
      </span>
      <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}

function Preview() {
  const { draft: d, bucket } = useOnboarding();
  const navigate = useNavigate();
  const tx = useTaxonomy().options;
  const list = visibleSteps(d, bucket);
  const edit = (id: string) => navigate({ to: "/onboarding/step/$id", params: { id } });

  // The real profile header, built from these answers the way the profile page builds it.
  const labels: TaxonomyLabels = Object.fromEntries(
    Object.entries(tx ?? {}).map(([cat, opts]) => [
      cat,
      Object.fromEntries(opts.map((o) => [o.slug, o.label])),
    ]),
  );
  const row = draftToProfile(d) as unknown as ProfileRow;
  const view = mergeProfileRow(profileFromRow(row), row, labels);
  const names = (cat: keyof NonNullable<typeof tx>, slugs: string[]) =>
    slugs.map((s) => labelFor(tx?.[cat], s));
  const linkNames = linkPlatforms.filter((p) => d.links[p.key]).map((p) => p.label);
  const visibility = visibilityOptions.find((v) => v.key === d.visibility)?.label;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-36">
      <TopBar
        title="Review profile"
        subtitle="This is what others see"
        back={`/onboarding/step/${list[list.length - 1]?.id ?? "contact"}`}
      />

      <ProfileHero p={view} />

      <main className="px-5 pt-6">
        <h2 className="text-2">Your details</h2>
        <div className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          <DetailRow
            label="Roles"
            values={names(
              "person_types",
              [d.primaryRole, ...d.secondaryRoles].filter(Boolean) as string[],
            )}
            onEdit={() => edit("role")}
          />
          {list.some((s) => s.id === "instruments") ? (
            <DetailRow
              label="Instruments"
              values={names("instruments", d.instruments)}
              onEdit={() => edit("instruments")}
            />
          ) : null}
          <DetailRow
            label="Genres"
            values={names("genres", d.genres)}
            onEdit={() => edit("genres")}
          />
          <DetailRow
            label="Languages"
            values={names("languages", d.languages)}
            onEdit={() => edit("languages")}
          />
          <DetailRow
            label="Available for"
            values={d.availability}
            onEdit={() => edit("work-mode")}
          />
          <DetailRow label="Work mode" values={d.workModes} onEdit={() => edit("work-mode")} />
          <DetailRow label="Links" values={linkNames} onEdit={() => edit("contact")} />
          <DetailRow
            label="Visibility"
            values={visibility ? [visibility] : []}
            onEdit={() => edit("contact")}
          />
        </div>
        <p className="mt-3 text-1 text-muted-foreground">
          Anything left empty doesn't show on your profile.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app space-y-2 border-t border-border bg-background/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <BtnLink to="/onboarding/complete" className="w-full">
          Publish My Profile
        </BtnLink>
        <p className="flex justify-center text-1">
          <AuthLink to="/onboarding/skip" className="text-muted-foreground">
            Finish Later
          </AuthLink>
        </p>
      </div>
    </div>
  );
}
