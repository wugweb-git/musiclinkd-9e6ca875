import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AudioLines,
  Clapperboard,
  GraduationCap,
  Guitar,
  Headphones,
  Mic,
  MicVocal,
  Music,
  PenLine,
  Podcast,
  Radio,
  SlidersHorizontal,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Btn } from "@/components/ml/ui";
import {
  labelFor,
  talentGroups,
  talentTypes,
  useTaxonomy,
  type TaxonomyOption,
} from "@/lib/taxonomy";
import { haptic } from "@/lib/haptics";
import { useFlowBack } from "@/lib/flow-back";
import {
  ChipPicker,
  PersonTypePicker,
  ErrorBanner,
  InlineField,
  LocationHint,
  OnboardingProvider,
  OptionList,
  PhotoPicker,
  SelectField,
  StepShell,
  StepSkeleton,
  SyncBanner,
  useOnboarding,
} from "@/components/ml/onboarding";
import {
  BIO_LIMIT,
  availabilityFor,
  citiesByState,
  contactChannels,
  discoveryPrefs,
  experienceLevels,
  intents,
  linkPlatforms,
  specialisationByRole,
  statesByCountry,
  steps,
  validateUrl,
  validateUsername,
  visibilityOptions,
  visibleSteps,
  workModes,
  type OnboardingDraft,
  type StepDef,
} from "@/data/onboarding";

// Icons for person types: a few by slug, the rest by taxonomy group.
const typeIcons: Record<string, LucideIcon> = {
  producer: SlidersHorizontal,
  beatmaker: SlidersHorizontal,
  lyricist: PenLine,
  music_director: Clapperboard,
  voice_artist: MicVocal,
  dj: Headphones,
  rj: Radio,
  podcaster: Podcast,
};
const groupIcons: Record<string, LucideIcon> = {
  vocal: Mic,
  instrumentalist: Guitar,
  creator: Music,
  technical: AudioLines,
  media: Radio,
  education: GraduationCap,
  other: Sparkles,
};
function typeIcon(o: TaxonomyOption) {
  const Icon = typeIcons[o.slug] ?? groupIcons[o.metadata?.group ?? ""] ?? Sparkles;
  return <Icon size={24} aria-hidden />;
}

/** The options to show: the bucket's, plus anything already selected that the bucket left out. */
function withSelected(
  shown: TaxonomyOption[],
  selected: string[],
  catalogue: TaxonomyOption[] | undefined,
) {
  const extra = selected
    .filter((slug) => !shown.some((o) => o.slug === slug))
    .map((slug) => ({ value: slug, label: labelFor(catalogue, slug) }));
  return [...shown.map((o) => ({ value: o.slug, label: o.label })), ...extra];
}

export const Route = createFileRoute("/onboarding/step/$id")({
  head: () => ({
    meta: [
      { title: "Build your profile — MusicLinkd onboarding" },
      {
        name: "description",
        content:
          "Answer one short question at a time — role, instruments, genres, languages, city and availability — and resume whenever you like.",
      },
      { property: "og:title", content: "Build your profile — MusicLinkd onboarding" },
      {
        property: "og:description",
        content: "A role-adaptive, one-question-at-a-time profile setup you can pause any time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <StepRoute />
    </OnboardingProvider>
  ),
});

type Banner = "none" | "error";

function StepRoute() {
  const { id } = Route.useParams();
  const { draft, set, toggle, markComplete, hydrated, sync, retry, bucket } = useOnboarding();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<Banner>("none");
  // Bumped on each blocked Continue so the button re-mounts and the shake replays.
  const [nudge, setNudge] = useState(0);
  const flowBack = useFlowBack();

  const list = visibleSteps(draft, bucket);
  const def = steps.find((s) => s.id === id);
  const index = list.findIndex((s) => s.id === id);

  // A step that stopped applying (no instruments for these roles) moves on by itself.
  const skipTo =
    hydrated && def && index === -1
      ? (list.find((s) => steps.indexOf(s) > steps.indexOf(def))?.id ?? "preview")
      : null;
  useEffect(() => {
    if (!skipTo) return;
    if (skipTo === "preview") void navigate({ to: "/onboarding/preview", replace: true });
    else void navigate({ to: "/onboarding/step/$id", params: { id: skipTo }, replace: true });
  }, [skipTo, navigate]);

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background px-5 pt-16">
        <StepSkeleton />
      </div>
    );
  }

  if (!def || index === -1) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col justify-center bg-background px-6 text-center">
        <p className="text-2 font-semibold">This step isn't part of your setup</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your answers so far are safe. We'll take you to the next relevant question.
        </p>
        <Btn
          className="mt-5"
          onClick={() =>
            navigate({
              to: "/onboarding/step/$id",
              params: { id: list[0]?.id ?? "identity" },
            })
          }
        >
          Continue setup
        </Btn>
      </div>
    );
  }

  const goto = (target: StepDef | undefined) => {
    if (!target) {
      navigate({ to: "/onboarding/preview" });
      return;
    }
    navigate({ to: "/onboarding/step/$id", params: { id: target.id } });
  };

  const advance = (complete: boolean) => {
    haptic(complete ? "confirm" : "select");
    if (complete) markComplete(def.id);
    const after = visibleSteps(
      {
        ...draft,
        completedSteps: complete ? [...draft.completedSteps, def.id] : draft.completedSteps,
      },
      bucket,
    );
    const pos = after.findIndex((s) => s.id === def.id);
    setBanner("none");
    goto(after[pos + 1]);
  };

  const valid = isValid(def.id, draft);

  const blocked = () => {
    haptic("error");
    setBanner("error");
    setNudge((n) => n + 1);
    // The message renders above the question; on a long step it would be off screen.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    const prev = list[index - 1];
    if (!prev) {
      flowBack("/onboarding", () => void navigate({ to: "/onboarding", replace: true }));
      return;
    }
    flowBack(
      `/onboarding/step/${prev.id}`,
      () => void navigate({ to: "/onboarding/step/$id", params: { id: prev.id }, replace: true }),
    );
  };

  return (
    <StepShell
      step={index + 1}
      total={list.length}
      group={def.group}
      title={def.title}
      subtitle={def.subtitle}
      why={def.why}
      optional={def.optional}
      onBack={back}
      onSubmit={valid ? () => advance(true) : blocked}
      {...(def.optional ? { onSkip: () => advance(false) } : {})}
      banner={
        banner === "error" ? (
          <ErrorBanner
            message="Add the required details above before continuing."
            onRetry={() => setBanner("none")}
          />
        ) : (
          <SyncBanner state={sync} onRetry={retry} />
        )
      }
      footer={
        <div className="space-y-2">
          <Btn
            key={nudge}
            type="submit"
            className={`w-full ${valid ? "" : "opacity-50"} ${nudge ? "animate-shake" : ""}`}
          >
            {index === list.length - 1 ? "Review profile" : "Continue"}
          </Btn>
          <button
            type="button"
            onClick={() => navigate({ to: "/onboarding/skip" })}
            className="min-h-11 w-full text-1 font-semibold text-muted-foreground"
          >
            Finish later
          </button>
        </div>
      }
    >
      <StepBody id={def.id} draft={draft} set={set} toggle={toggle} />
    </StepShell>
  );
}

function isValid(id: string, d: OnboardingDraft): boolean {
  switch (id) {
    case "identity":
      return Boolean(d.displayName.trim()) && validateUsername(d.username).ok;
    case "role":
      return Boolean(d.primaryRole);
    case "location":
      return Boolean(d.state && d.city);
    case "visibility":
      return Boolean(d.visibility);
    default:
      return true;
  }
}

function StepBody({
  id,
  draft: d,
  set,
  toggle,
}: {
  id: string;
  draft: OnboardingDraft;
  set: (p: Partial<OnboardingDraft>) => void;
  toggle: (field: keyof OnboardingDraft, value: string) => void;
}) {
  const { bucket, bucketState, retryBucket } = useOnboarding();
  const taxonomy = useTaxonomy();
  const needsTaxonomy = ["role", "secondary-roles", "instruments", "genres", "languages"].includes(
    id,
  );
  const needsBucket = id === "instruments" || id === "genres";
  if (needsTaxonomy && taxonomy.state === "error") {
    return (
      <ErrorBanner
        message="We couldn't load the choices for this question."
        onRetry={taxonomy.retry}
      />
    );
  }
  if (needsBucket && bucketState === "error") {
    return (
      <ErrorBanner message="We couldn't load the choices for your roles." onRetry={retryBucket} />
    );
  }
  if ((needsTaxonomy && !taxonomy.options) || (needsBucket && !bucket)) return <StepSkeleton />;
  const tx = taxonomy.options;

  switch (id) {
    case "identity": {
      const check = validateUsername(d.username);
      return (
        <div className="space-y-5">
          <InlineField
            inputId="displayName"
            label="Display name"
            value={d.displayName}
            onChange={(v) => set({ displayName: v })}
            placeholder="Your professional name"
            autoComplete="name"
            hint="Use the name you're credited under."
          />
          <InlineField
            inputId="username"
            label="Username"
            prefix="musiclinkd.com/"
            value={d.username}
            onChange={(v) => set({ username: v.toLowerCase().replace(/\s/g, "") })}
            placeholder="yourname"
            autoComplete="username"
            {...(check.ok ? { ok: check.message } : { error: check.message })}
          />
        </div>
      );
    }

    case "photo":
      return (
        <div className="space-y-5">
          <PhotoPicker photo={d.photo} onChange={(v) => set({ photo: v })} />
          <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
            A clear photo of your face works better than a logo or a live shot from far away.
          </p>
        </div>
      );

    case "role":
      return (
        <PersonTypePicker
          groups={talentGroups}
          options={talentTypes(tx?.person_types ?? [])}
          selected={d.primaryRole ? [d.primaryRole] : []}
          icon={typeIcon}
          onToggle={(slug) =>
            set({ primaryRole: slug, secondaryRoles: d.secondaryRoles.filter((s) => s !== slug) })
          }
        />
      );

    case "secondary-roles":
      return (
        <PersonTypePicker
          groups={talentGroups}
          options={talentTypes(tx?.person_types ?? [])}
          selected={d.secondaryRoles}
          exclude={d.primaryRole ? [d.primaryRole] : []}
          multi
          max={2}
          onToggle={(slug) => toggle("secondaryRoles", slug)}
        />
      );

    case "instruments":
      return (
        <div className="space-y-5">
          <ChipPicker
            options={withSelected(bucket?.instruments ?? [], d.instruments, tx?.instruments)}
            selected={d.instruments}
            onToggle={(v) => toggle("instruments", v)}
          />
          {d.instruments.length > 1 ? (
            <div>
              <p className="mb-2 text-1 font-bold uppercase tracking-wide text-muted-foreground">
                Primary instrument
              </p>
              <ChipPicker
                options={d.instruments.map((slug) => ({
                  value: slug,
                  label: labelFor(tx?.instruments, slug),
                }))}
                selected={d.primaryInstrument ? [d.primaryInstrument] : []}
                onToggle={(v) => set({ primaryInstrument: d.primaryInstrument === v ? null : v })}
              />
            </div>
          ) : null}
        </div>
      );

    case "specialisation": {
      const spec = d.primaryRole ? specialisationByRole[d.primaryRole] : undefined;
      if (!spec)
        return <p className="text-sm text-muted-foreground">Nothing extra needed for your role.</p>;
      return (
        <div className="space-y-6">
          {spec.groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-1 font-bold uppercase tracking-wide text-muted-foreground">
                {g.label}
              </p>
              <ChipPicker
                options={g.options}
                selected={d.specialisation[g.label] ?? []}
                onToggle={(v) => {
                  const cur = d.specialisation[g.label] ?? [];
                  const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
                  set({ specialisation: { ...d.specialisation, [g.label]: next } });
                }}
              />
            </div>
          ))}
        </div>
      );
    }

    case "genres":
      return (
        <ChipPicker
          options={withSelected(bucket?.genres ?? [], d.genres, tx?.genres)}
          selected={d.genres}
          onToggle={(v) => toggle("genres", v)}
        />
      );

    case "languages":
      return (
        <ChipPicker
          options={(tx?.languages ?? []).map((o) => ({ value: o.slug, label: o.label }))}
          selected={d.languages}
          onToggle={(v) => toggle("languages", v)}
        />
      );

    case "location":
      return (
        <div className="space-y-4">
          <SelectField
            selectId="state"
            label="State"
            value={d.state}
            options={statesByCountry[d.country] ?? []}
            placeholder="Choose a state"
            onChange={(v) => set({ state: v, city: "" })}
          />
          <SelectField
            selectId="city"
            label="City"
            value={d.city}
            options={citiesByState[d.state] ?? []}
            placeholder={d.state ? "Choose a city" : "Pick a state first"}
            disabled={!d.state}
            onChange={(v) => set({ city: v })}
          />
          <InlineField
            inputId="locality"
            label="Locality (optional)"
            value={d.locality}
            onChange={(v) => set({ locality: v })}
            placeholder="Andheri West, Indiranagar…"
            autoComplete="address-level3"
            hint="Only shown as an area — never a full address."
          />
          <LocationHint />
        </div>
      );

    case "work-mode":
      return (
        <OptionList
          options={workModes}
          selected={d.workModes}
          onToggle={(k) => toggle("workModes", k)}
        />
      );

    case "availability":
      return (
        <ChipPicker
          options={availabilityFor}
          selected={d.availability}
          onToggle={(v) => toggle("availability", v)}
        />
      );

    case "intent":
      return (
        <ChipPicker
          options={intents}
          selected={d.intents}
          onToggle={(v) => toggle("intents", v)}
          columns
        />
      );

    case "experience":
      return (
        <OptionList
          options={experienceLevels}
          selected={d.experience ? [d.experience] : []}
          onToggle={(k) => set({ experience: d.experience === k ? null : k })}
          multi={false}
        />
      );

    case "bio":
      return (
        <div className="space-y-4">
          <InlineField
            inputId="bio"
            label="Short bio"
            value={d.bio}
            onChange={(v) => set({ bio: v })}
            placeholder="What you do, who you've worked with, what you're looking for."
            multiline
            maxLength={BIO_LIMIT}
            hint="Two lines is plenty. You can rewrite this any time."
          />
          <button
            type="button"
            onClick={() =>
              set({
                bio: `${d.primaryRole ? labelFor(tx?.person_types, d.primaryRole) : "Music professional"} based in ${
                  d.city || "India"
                }, working across ${
                  d.genres
                    .slice(0, 2)
                    .map((g) => labelFor(tx?.genres, g))
                    .join(" and ") || "multiple genres"
                }. Open to ${d.availability[0]?.toLowerCase() ?? "collaborations"}.`,
              })
            }
            className="min-h-11 w-full rounded-full border border-border text-1 font-semibold"
          >
            Suggest a starting point
          </button>
        </div>
      );

    case "links":
      return (
        <div className="space-y-4">
          {linkPlatforms.map((p) => {
            const val = d.links[p.key] ?? "";
            const bad = val.length > 0 && !validateUrl(val);
            return (
              <InlineField
                key={p.key}
                inputId={`link-${p.key}`}
                label={p.label}
                value={val}
                onChange={(v) => set({ links: { ...d.links, [p.key]: v } })}
                placeholder={p.placeholder}
                inputMode="url"
                autoComplete="url"
                {...(bad ? { error: "That doesn't look like a full URL." } : {})}
              />
            );
          })}
        </div>
      );

    case "contact":
      return (
        <OptionList
          options={contactChannels}
          selected={d.contact}
          onToggle={(k) => toggle("contact", k)}
        />
      );

    case "discovery":
      return (
        <ChipPicker
          options={discoveryPrefs}
          selected={d.discovery}
          onToggle={(v) => toggle("discovery", v)}
          columns
        />
      );

    case "visibility":
      return (
        <OptionList
          options={visibilityOptions}
          selected={[d.visibility]}
          onToggle={(k) => set({ visibility: k })}
          multi={false}
        />
      );

    case "business":
      return (
        <div className="space-y-4">
          <ChipPicker
            options={(tx?.person_types ?? [])
              .filter((o) => o.metadata?.flow === "business")
              .map((o) => ({ value: o.slug, label: o.label }))}
            selected={d.businessIntent ? [d.businessIntent] : []}
            onToggle={(v) => set({ businessIntent: d.businessIntent === v ? null : v })}
          />
          <p className="rounded-lg bg-subtle px-4 py-3 text-1 text-muted-foreground">
            Choosing one hands you over to Business setup after onboarding. Your personal profile
            stays yours.
          </p>
        </div>
      );

    default:
      return null;
  }
}
