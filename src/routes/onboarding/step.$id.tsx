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
import { AuthNotice, AuthTextButton } from "@/components/ml/auth";
import {
  labelFor,
  talentGroups,
  talentTypes,
  useTaxonomy,
  type TaxonomyOption,
} from "@/lib/taxonomy";
import { haptic } from "@/lib/haptics";
import { useFlowBack } from "@/lib/flow-back";
import { useUsernameAvailability, type UsernameStatus } from "@/lib/username";
import type { UsernameClaim } from "@/lib/portfolio.functions";
import {
  ChipPicker,
  PersonTypePicker,
  InlineField,
  OnboardingProvider,
  OptionList,
  PhotoPicker,
  SelectField,
  StepShell,
  StepSkeleton,
  SyncBanner,
  SyncStatus,
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
/** The profile's single experience level: the highest across instruments. */
function topExperience(map: Record<string, string>): string | null {
  const rank = (key: string) => experienceLevels.findIndex((e) => e.key === key);
  return Object.values(map).sort((x, y) => rank(y) - rank(x))[0] ?? null;
}

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

type Banner = "none" | "error" | "claim";
type RoleStage = "primary" | "secondary";

/** The step Back is heading to, so a two-question screen reopens on its second question. */
let backInto: string | null = null;

function StepRoute() {
  const { id } = Route.useParams();
  const {
    draft,
    set,
    toggle,
    markComplete,
    hydrated,
    sync,
    retry,
    bucket,
    claimedUsername,
    claimUsername,
  } = useOnboarding();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<Banner>("none");
  // Bumped on each blocked Continue so the button re-mounts and the shake replays.
  const [nudge, setNudge] = useState(0);
  const flowBack = useFlowBack();
  const usernameStatus = useUsernameAvailability(
    draft.username,
    validateUsername(draft.username).ok,
  );
  // The username is claimed on Continue from About you; the database is the final word.
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  useEffect(() => setClaimError(null), [draft.username]);
  // Role and instruments ask twice on one screen: the choice, then a follow-up (extra roles; how
  // long each instrument has been played).
  const [roleStage, setRoleStage] = useState<RoleStage>("primary");
  const stageReady =
    id === "role"
      ? Boolean(draft.primaryRole)
      : id === "instruments" && draft.instruments.length > 0;
  // One wizard: arriving forward opens a screen's first question; Back from the next screen
  // returns to its last one.
  useEffect(() => {
    if ((id === "role" || id === "instruments") && hydrated)
      setRoleStage(stageReady && backInto === id ? "secondary" : "primary");
    backInto = null;
    // Only on arrival; picking a role moves the stage itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hydrated]);

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

  const valid = isValid(def.id, draft, usernameStatus);

  const blocked = () => {
    haptic("error");
    setBanner("error");
    setNudge((n) => n + 1);
    // The message renders above the question; on a long step it would be off screen.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    const prev = list[index - 1];
    backInto = prev?.id ?? null;
    if (!prev) {
      flowBack("/onboarding", () => void navigate({ to: "/onboarding", replace: true }));
      return;
    }
    flowBack(
      `/onboarding/step/${prev.id}`,
      () => void navigate({ to: "/onboarding/step/$id", params: { id: prev.id }, replace: true }),
    );
  };

  const claimAndAdvance = async () => {
    if (claiming) return;
    setClaiming(true);
    setBanner("none");
    try {
      const status = await claimUsername();
      if (status === "claimed") {
        advance(true);
        return;
      }
      setClaimError(claimMessages[status]);
      haptic("error");
      setNudge((n) => n + 1);
    } catch {
      setBanner("claim");
      haptic("error");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setClaiming(false);
    }
  };

  // Second stage: same screen, new question, optional.
  const secondStage = stageReady && roleStage === "secondary";
  const copy = !secondStage
    ? def
    : def.id === "role"
      ? {
          title: "Anything else you do?",
          subtitle: "Pick up to two.",
          why: "Extra roles widen the work you show up for, without diluting your main one.",
          optional: true,
        }
      : {
          title: "How long have you played?",
          subtitle: "Not a ranking — just context.",
          why: "Helps match you to the right briefs. Never shown as a score.",
          optional: true,
        };
  const toFirstStage = () => {
    haptic("select");
    setRoleStage("primary");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit =
    stageReady && !secondStage
      ? () => {
          haptic("select");
          setRoleStage("secondary");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      : def.id === "identity" && valid
        ? () => void claimAndAdvance()
        : valid
          ? () => advance(true)
          : blocked;

  return (
    <StepShell
      step={index + 1}
      total={list.length}
      group={def.group}
      title={copy.title}
      subtitle={copy.subtitle}
      why={copy.why}
      optional={copy.optional}
      status={<SyncStatus state={sync} />}
      onBack={secondStage ? toFirstStage : back}
      onSubmit={submit}
      {...(copy.optional ? { onSkip: () => advance(secondStage) } : {})}
      banner={
        banner === "error" ? (
          <AuthNotice title="Add the required details to continue" />
        ) : banner === "claim" ? (
          <AuthNotice title="We couldn't save your username">
            Check your connection, then tap Continue again.
          </AuthNotice>
        ) : (
          <SyncBanner state={sync} onRetry={retry} />
        )
      }
      footer={
        <div className="space-y-2">
          <Btn
            key={nudge}
            type="submit"
            loading={claiming}
            className={`w-full ${valid ? "" : "opacity-50"} ${nudge ? "animate-shake" : ""}`}
          >
            {index === list.length - 1 ? "Review profile" : "Continue"}
          </Btn>
          <AuthTextButton
            onClick={() => navigate({ to: "/onboarding/skip" })}
            className="flex w-full justify-center text-1 text-muted-foreground"
          >
            Finish later
          </AuthTextButton>
        </div>
      }
    >
      <StepBody
        id={def.id}
        draft={draft}
        set={set}
        toggle={toggle}
        usernameStatus={usernameStatus}
        claimedUsername={claimedUsername}
        claimError={claimError}
        roleStage={secondStage ? "secondary" : "primary"}
      />
    </StepShell>
  );
}

const claimMessages: Record<Exclude<UsernameClaim, "claimed">, string> = {
  taken: "That one's taken. Try another.",
  reserved: "That username is reserved. Try another.",
  invalid: "Lowercase letters, numbers, dots and underscores only.",
  locked: "Your username is already set and can't be changed.",
};

function isValid(id: string, d: OnboardingDraft, usernameStatus: UsernameStatus): boolean {
  switch (id) {
    case "identity":
      // A name that is taken, or still being checked, cannot go forward.
      return (
        Boolean(d.displayName.trim()) &&
        validateUsername(d.username).ok &&
        usernameStatus !== "taken" &&
        usernameStatus !== "checking" &&
        Boolean(d.state && d.city)
      );
    case "role":
      return Boolean(d.primaryRole);
    case "contact":
      return Boolean(d.visibility) && Object.values(d.links).every((v) => !v || validateUrl(v));
    default:
      return true;
  }
}

function StepBody({
  id,
  draft: d,
  set,
  toggle,
  usernameStatus,
  claimedUsername,
  claimError,
  roleStage,
}: {
  id: string;
  draft: OnboardingDraft;
  set: (p: Partial<OnboardingDraft>) => void;
  toggle: (field: keyof OnboardingDraft, value: string) => void;
  usernameStatus: UsernameStatus;
  claimedUsername: string | null;
  claimError: string | null;
  roleStage: RoleStage;
}) {
  const { bucket, bucketState, retryBucket } = useOnboarding();
  const taxonomy = useTaxonomy();
  const needsTaxonomy = ["role", "instruments", "genres", "languages"].includes(id);
  const needsBucket = id === "instruments" || id === "genres";
  if (needsTaxonomy && taxonomy.state === "error") {
    return (
      <AuthNotice
        title="We couldn't load the choices"
        action={<AuthTextButton onClick={taxonomy.retry}>Try again</AuthTextButton>}
      >
        Check your connection, then try again.
      </AuthNotice>
    );
  }
  if (needsBucket && bucketState === "error") {
    return (
      <AuthNotice
        title="We couldn't load the choices for your roles"
        action={<AuthTextButton onClick={retryBucket}>Try again</AuthTextButton>}
      >
        Check your connection, then try again.
      </AuthNotice>
    );
  }
  if ((needsTaxonomy && !taxonomy.options) || (needsBucket && !bucket)) return <StepSkeleton />;
  const tx = taxonomy.options;

  switch (id) {
    case "identity": {
      const check = validateUsername(d.username);
      return (
        <div className="space-y-5">
          <PhotoPicker photo={d.photo} onChange={(v) => set({ photo: v })} />
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
            readOnly={Boolean(claimedUsername)}
            {...(claimedUsername
              ? { hint: "This is your profile link. Usernames can't be changed." }
              : claimError
                ? { error: claimError }
                : !d.username
                  ? { hint: "Your profile link: lowercase letters, numbers, dots and underscores." }
                  : !check.ok
                    ? { error: check.message }
                    : usernameStatus === "taken"
                      ? { error: "That one's taken. Try another." }
                      : usernameStatus === "available"
                        ? { ok: `${check.message} is available` }
                        : usernameStatus === "checking"
                          ? { hint: "Checking…" }
                          : { hint: check.message })}
          />
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              selectId="state"
              label="State"
              value={d.state}
              options={statesByCountry[d.country] ?? []}
              placeholder="Choose"
              onChange={(v) => set({ state: v, city: "" })}
            />
            <SelectField
              selectId="city"
              label="City"
              value={d.city}
              options={citiesByState[d.state] ?? []}
              placeholder={d.state ? "Choose" : "State first"}
              disabled={!d.state}
              onChange={(v) => set({ city: v })}
            />
          </div>
          <InlineField
            inputId="locality"
            label="Area (optional)"
            value={d.locality}
            onChange={(v) => set({ locality: v })}
            placeholder="Andheri West, Indiranagar…"
            autoComplete="address-level3"
            hint="Only the area is shown, never a full address."
          />
          <InlineField
            inputId="bio"
            label="Short bio (optional)"
            value={d.bio}
            onChange={(v) => set({ bio: v })}
            placeholder="What you do, who you've worked with, what you're looking for."
            multiline
            maxLength={BIO_LIMIT}
            hint="Two lines is plenty. You can rewrite it any time."
          />
        </div>
      );
    }

    case "role": {
      const types = talentTypes(tx?.person_types ?? []);
      if (roleStage === "primary" || !d.primaryRole) {
        return (
          <PersonTypePicker
            groups={talentGroups}
            options={types}
            selected={d.primaryRole ? [d.primaryRole] : []}
            icon={typeIcon}
            onToggle={(slug) => {
              set({
                primaryRole: slug,
                secondaryRoles: d.secondaryRoles.filter((s) => s !== slug),
              });
            }}
          />
        );
      }
      // Back returns to the main-role question.
      return (
        <PersonTypePicker
          key="secondary"
          groups={talentGroups}
          options={types}
          selected={d.secondaryRoles}
          exclude={[d.primaryRole]}
          multi
          max={2}
          onToggle={(slug) => toggle("secondaryRoles", slug)}
        />
      );
    }

    case "instruments": {
      if (roleStage === "primary" || !d.instruments.length) {
        return (
          <ChipPicker
            options={withSelected(bucket?.instruments ?? [], d.instruments, tx?.instruments)}
            selected={d.instruments}
            max={2}
            onToggle={(slug) => {
              if (d.instruments.includes(slug)) {
                const map = { ...d.instrumentExperience };
                delete map[slug];
                set({
                  instruments: d.instruments.filter((x) => x !== slug),
                  primaryInstrument: null,
                  instrumentExperience: map,
                  experience: topExperience(map),
                });
                return;
              }
              set({ instruments: [...d.instruments, slug], primaryInstrument: null });
            }}
          />
        );
      }
      // Back returns to the instruments.
      return (
        <div key="secondary" className="space-y-4">
          {d.instruments.map((slug) => {
            const key = d.instrumentExperience[slug];
            return (
              <SelectField
                key={slug}
                selectId={`experience-${slug}`}
                label={labelFor(tx?.instruments, slug)}
                value={experienceLevels.find((e) => e.key === key)?.label ?? ""}
                options={experienceLevels.map((e) => e.label)}
                placeholder="Choose"
                onChange={(label) => {
                  const nextKey = experienceLevels.find((e) => e.label === label)?.key;
                  const map = { ...d.instrumentExperience };
                  if (nextKey) map[slug] = nextKey;
                  else delete map[slug];
                  set({ instrumentExperience: map, experience: topExperience(map) });
                }}
              />
            );
          })}
        </div>
      );
    }

    case "languages":
      return (
        <ChipPicker
          options={(tx?.languages ?? []).map((o) => ({ value: o.slug, label: o.label }))}
          selected={d.languages}
          onToggle={(v) => toggle("languages", v)}
        />
      );

    case "genres":
      return (
        <ChipPicker
          options={withSelected(bucket?.genres ?? [], d.genres, tx?.genres)}
          selected={d.genres}
          onToggle={(v) => toggle("genres", v)}
        />
      );

    case "work-mode":
      return (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium">Where you work</p>
            <OptionList
              options={workModes}
              selected={d.workModes}
              onToggle={(k) => toggle("workModes", k)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Available for</p>
            <ChipPicker
              options={availabilityFor}
              selected={d.availability}
              onToggle={(v) => toggle("availability", v)}
            />
          </div>
        </div>
      );

    case "intent":
      return (
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium">You're here to</p>
            <ChipPicker
              options={intents}
              selected={d.intents}
              onToggle={(v) => toggle("intents", v)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Show me more</p>
            <ChipPicker
              options={discoveryPrefs}
              selected={d.discovery}
              onToggle={(v) => toggle("discovery", v)}
            />
          </div>
        </div>
      );

    case "contact":
      return (
        <div className="space-y-6">
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
          <div>
            <p className="mb-2 text-sm font-medium">How people can reach you</p>
            <OptionList
              options={contactChannels.filter((c) => c.key !== "business")}
              selected={d.contact}
              onToggle={(k) => toggle("contact", k)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Who can see your profile</p>
            <OptionList
              options={visibilityOptions}
              selected={[d.visibility]}
              onToggle={(k) => set({ visibility: k })}
              multi={false}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}
