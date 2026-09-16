import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Globe,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Btn } from "@/components/ml/ui";
import { AuthNotice, AuthTextButton } from "@/components/ml/auth";
import { BrandIcon } from "@/components/ml/brand-icons";
import {
  labelFor,
  talentGroups,
  talentTypes,
  useTaxonomy,
  type TaxonomyOption,
} from "@/lib/taxonomy";
import { haptic } from "@/lib/haptics";
import { roleIcon } from "@/lib/role-icons";
import {
  GENDERS,
  getMyPrivateDetails,
  readDeviceContext,
  saveMyPrivateDetails,
} from "@/lib/profile-private.functions";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { useFlowBack } from "@/lib/flow-back";
import { getLocationGuess } from "@/lib/location-guess.functions";
import { useUsernameAvailability, type UsernameStatus } from "@/lib/username";
import { listMyPortfolio, type UsernameClaim } from "@/lib/portfolio.functions";
import {
  ChipPicker,
  PersonTypePicker,
  InlineField,
  OnboardingProvider,
  OptionList,
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
  cityAliases,
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

function typeIcon(o: TaxonomyOption) {
  const Icon = roleIcon(o);
  return <Icon size={16} aria-hidden />;
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

/**
 * `q=2` is a two-question screen's second question (role: anything else; instruments: how long).
 * It is a real history entry, so the Android back gesture returns to the first question and the
 * page motion slides between them like it does between screens.
 */
type StepSearch = { q?: 2 };

export const Route = createFileRoute("/onboarding/step/$id")({
  validateSearch: (search: Record<string, unknown>): StepSearch =>
    Number(search["q"]) === 2 ? { q: 2 } : {},
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

/** Steps with a second question, and whether it applies yet. */
const secondQuestionReady = (id: string, d: OnboardingDraft) =>
  id === "role" ? Boolean(d.primaryRole) : id === "instruments" && d.instruments.length > 0;

function StepRoute() {
  const { id } = Route.useParams();
  const { q } = Route.useSearch();
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
  const listPortfolio = useServerFn(listMyPortfolio);
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

  // Google sign-in gives first and last name: prefill the display name and suggest first.last as
  // the username, once, only into empty fields. The availability check runs on the suggestion.
  const { user } = useAuth();
  const prefilled = useRef(false);
  useEffect(() => {
    if (!hydrated || !user || prefilled.current) return;
    prefilled.current = true;
    const meta = user.user_metadata as { given_name?: string; family_name?: string };
    const first = meta.given_name?.trim() ?? "";
    const last = meta.family_name?.trim() ?? "";
    if (!first) return;
    const patch: Partial<OnboardingDraft> = {};
    if (!draft.displayName.trim()) patch.displayName = [first, last].filter(Boolean).join(" ");
    if (!draft.username && !claimedUsername) {
      const slug = (s: string) =>
        s
          .normalize("NFKD")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
      const suggestion = [slug(first), slug(last)].filter(Boolean).join(".").slice(0, 30);
      if (validateUsername(suggestion).ok) patch.username = suggestion;
    }
    if (Object.keys(patch).length) set(patch);
  }, [hydrated, user, draft.displayName, draft.username, claimedUsername, set]);

  // State and city start from the connection's rough location (no permission prompt), once, only
  // when both are empty and the guess matches a listed state. The person confirms or changes it.
  const locate = useServerFn(getLocationGuess);
  const located = useRef(false);
  useEffect(() => {
    if (!hydrated || id !== "identity" || located.current || draft.state) return;
    located.current = true;
    void locate()
      .then(({ city, region }) => {
        const states = statesByCountry[draft.country] ?? [];
        const lower = (v: string | null) => (v ?? "").toLowerCase();
        const state = states.find((s) => lower(region).includes(s.toLowerCase()));
        if (!state) return;
        const wanted = cityAliases[lower(city)] ?? lower(city);
        const match = (citiesByState[state] ?? []).find((c) => c.toLowerCase() === wanted);
        set({ state, city: match ?? "" });
      })
      .catch(() => undefined);
  }, [hydrated, id, draft.state, draft.country, locate, set]);
  // Role and instruments ask twice on one screen: the choice, then a follow-up (extra roles; how
  // long each instrument has been played). The second question is `?q=2`.
  const stageReady = secondQuestionReady(id, draft);

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
      // After the last question: the first published work, then Review profile. Someone who
      // already has published work goes straight to Review.
      void (listPortfolio() as Promise<{ published: boolean }[]>)
        .then((items) => items.some((w) => w.published))
        .catch(() => false)
        .then((hasWork) =>
          navigate(
            hasWork
              ? { to: "/onboarding/preview" }
              : { to: "/portfolio/new", search: { from: "onboarding" } },
          ),
        );
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
    if (!prev) {
      flowBack("/onboarding", () => void navigate({ to: "/onboarding", replace: true }));
      return;
    }
    // One wizard: Back reopens the previous screen's last question.
    flowBack(
      `/onboarding/step/${prev.id}`,
      () =>
        void navigate({
          to: "/onboarding/step/$id",
          params: { id: prev.id },
          search: secondQuestionReady(prev.id, draft) ? { q: 2 } : {},
          replace: true,
        }),
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
  const secondStage = stageReady && q === 2;
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
    flowBack(
      `/onboarding/step/${def.id}`,
      () =>
        void navigate({
          to: "/onboarding/step/$id",
          params: { id: def.id },
          search: {},
          replace: true,
        }),
    );
  };
  const submit =
    stageReady && !secondStage
      ? () => {
          haptic("select");
          void navigate({ to: "/onboarding/step/$id", params: { id: def.id }, search: { q: 2 } });
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
            pending={!valid}
            className={`w-full ${nudge ? "animate-shake" : ""}`}
          >
            Continue
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
  // Languages start from the phone's own languages (e.g. hi-IN, en-IN), once, while none are picked.
  const langPrefilled = useRef(false);
  useEffect(() => {
    const options = taxonomy.options?.languages;
    if (id !== "languages" || !options?.length || langPrefilled.current) return;
    langPrefilled.current = true;
    if (d.languages.length || typeof navigator === "undefined") return;
    const names = new Intl.DisplayNames(["en"], { type: "language" });
    const picks = (navigator.languages ?? [navigator.language])
      .map((tag) => names.of(tag.split("-")[0] ?? "")?.toLowerCase())
      .map((name) => options.find((o) => o.label.toLowerCase() === name)?.slug)
      .filter((slug): slug is string => Boolean(slug));
    if (picks.length) set({ languages: [...new Set(picks)] });
  }, [id, taxonomy.options, d.languages.length, set]);
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
          <PrivateDetailsFields />
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
          icon={typeIcon}
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
                });
                return;
              }
              set({ instruments: [...d.instruments, slug], primaryInstrument: null });
            }}
          />
        );
      }
      // Back returns to the instruments. The career question comes first: it is the one the
      // profile header shows; the per-instrument answers stay with each instrument.
      return (
        <div key="secondary" className="space-y-4">
          <SelectField
            selectId="experience-music"
            label="How long have you worked in music?"
            value={experienceLevels.find((e) => e.key === d.experience)?.label ?? ""}
            options={experienceLevels.map((e) => e.label)}
            placeholder="Choose"
            onChange={(label) =>
              set({ experience: experienceLevels.find((e) => e.label === label)?.key ?? null })
            }
          />
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
                  set({ instrumentExperience: map });
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
            <p className="mb-2 text-sm font-medium text-muted-foreground">Where you work</p>
            <OptionList
              options={workModes}
              selected={d.workModes}
              onToggle={(k) => toggle("workModes", k)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Available for</p>
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
            <p className="mb-2 text-sm font-medium text-muted-foreground">You're here to</p>
            <ChipPicker
              options={intents}
              selected={d.intents}
              onToggle={(v) => toggle("intents", v)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Show me more</p>
            <ChipPicker
              options={discoveryPrefs}
              selected={d.discovery}
              onToggle={(v) => toggle("discovery", v)}
            />
          </div>
        </div>
      );

    case "contact":
      return <ContactStep draft={d} set={set} toggle={toggle} />;

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ contact */

const linkIcons: Record<string, ReactNode> = {
  website: <Globe size={18} strokeWidth={1.75} />,
  instagram: <BrandIcon brand="instagram" />,
  youtube: <BrandIcon brand="youtube" />,
  spotify: <BrandIcon brand="spotify" />,
  soundcloud: <BrandIcon brand="soundcloud" />,
};

const channelIcons: Record<string, ReactNode> = {
  messages: <MessageCircle size={16} aria-hidden />,
  email: <Mail size={16} aria-hidden />,
  phone: <Phone size={16} aria-hidden />,
  whatsapp: <BrandIcon brand="whatsapp" size={16} />,
};

const visibilityIcons: Record<string, LucideIcon> = {
  public: Globe,
  members: Users,
  limited: Lock,
};

/** Links shown before the person adds more. Any platform that already has a link shows too. */
const DEFAULT_LINKS = ["instagram", "youtube"];

function ContactStep({
  draft: d,
  set,
  toggle,
}: {
  draft: OnboardingDraft;
  set: (p: Partial<OnboardingDraft>) => void;
  toggle: (field: keyof OnboardingDraft, value: string) => void;
}) {
  const [shown, setShown] = useState<string[]>(() =>
    linkPlatforms.map((p) => p.key).filter((k) => DEFAULT_LINKS.includes(k) || Boolean(d.links[k])),
  );
  const [adding, setAdding] = useState(false);
  const hidden = linkPlatforms.filter((p) => !shown.includes(p.key));
  const visibility = visibilityOptions.find((v) => v.key === d.visibility);

  const add = (key: string) => {
    haptic("select");
    setShown((list) => [...list, key]);
    setAdding(false);
    window.setTimeout(() => document.getElementById(`link-${key}`)?.focus(), 50);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        {linkPlatforms
          .filter((p) => shown.includes(p.key))
          .map((p) => {
            const val = d.links[p.key] ?? "";
            const bad = val.length > 0 && !validateUrl(val);
            return (
              <InlineField
                key={p.key}
                inputId={`link-${p.key}`}
                label={p.label}
                leading={linkIcons[p.key]}
                value={val}
                onChange={(v) => set({ links: { ...d.links, [p.key]: v } })}
                placeholder={p.placeholder}
                inputMode="url"
                autoComplete="url"
                {...(bad ? { error: "That doesn't look like a full URL." } : {})}
              />
            );
          })}

        {hidden.length ? (
          adding ? (
            <div className="animate-message">
              <p className="mb-2 text-sm font-medium text-muted-foreground">Add a link</p>
              <ChipPicker
                options={hidden.map((p) => ({
                  value: p.key,
                  label: p.label,
                  media: linkIcons[p.key],
                }))}
                selected={[]}
                onToggle={add}
              />
            </div>
          ) : (
            <AuthTextButton
              icon={<Plus size={16} />}
              onClick={() => setAdding(true)}
              className="text-sm"
            >
              Add more
            </AuthTextButton>
          )
        ) : null}
      </section>

      <section>
        <p className="mb-2 text-sm font-medium text-muted-foreground">How people can reach you</p>
        <ChipPicker
          options={contactChannels
            .filter((c) => c.key !== "business")
            .map((c) => ({ value: c.key, label: c.label, media: channelIcons[c.key] }))}
          selected={d.contact}
          onToggle={(k) => toggle("contact", k)}
        />
      </section>

      <section>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Who can see your profile</p>
        <div
          role="radiogroup"
          aria-label="Who can see your profile"
          className="grid grid-cols-3 gap-2"
        >
          {visibilityOptions.map((v) => {
            const on = d.visibility === v.key;
            const Icon = visibilityIcons[v.key] ?? Globe;
            return (
              <button
                key={v.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  haptic("select");
                  set({ visibility: v.key });
                }}
                className={`state-layer flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-center text-sm font-semibold leading-tight transition-[transform,background-color,border-color,color] duration-200 ease-standard active:scale-97 ${
                  on
                    ? "border-transparent bg-selected-bg text-selected-text"
                    : "border-border bg-card text-foreground"
                }`}
              >
                <Icon size={18} strokeWidth={1.75} aria-hidden />
                {v.label}
              </button>
            );
          })}
        </div>
        {visibility ? (
          <p key={visibility.key} className="mt-2 animate-message text-1 text-muted-foreground">
            {visibility.hint}
          </p>
        ) : null}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------- private details */

/**
 * Date of birth and gender. Saved to the owner-only profile_private table as they change, never
 * into the draft, and hidden from everyone else by default. In dev preview (no account) they stay on
 * the screen only.
 */
function PrivateDetailsFields() {
  const { signedIn } = useAuth();
  const load = useServerFn(getMyPrivateDetails);
  const save = useServerFn(saveMyPrivateDetails);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const loaded = useRef(false);
  const today = new Date().toISOString().slice(0, 10);
  const dobError =
    dob && (dob > today || dob < "1900-01-01") ? "Enter your real date of birth." : undefined;

  useEffect(() => {
    if (!signedIn) return;
    load()
      .then((p) => {
        setDob(p.dateOfBirth ?? "");
        setGender(p.gender);
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
      });
  }, [signedIn, load]);

  useEffect(() => {
    if (!signedIn || !loaded.current || dobError) return;
    const t = window.setTimeout(() => {
      void save({
        data: {
          dateOfBirth: dob || null,
          gender: (gender as (typeof GENDERS)[number]["value"] | null) ?? null,
          // Time zone and device come from the browser, with no permission prompt.
          ...readDeviceContext(),
        },
      }).catch(() => {});
    }, 600);
    return () => window.clearTimeout(t);
  }, [dob, gender, signedIn, save, dobError]);

  return (
    <div className="space-y-5">
      <InlineField
        inputId="dateOfBirth"
        label="Date of birth"
        type="date"
        max={today}
        value={dob}
        onChange={setDob}
        placeholder="DD/MM/YYYY"
        autoComplete="bday"
        hint="Only you can see this."
        {...(dobError ? { error: dobError } : {})}
      />
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">Gender</p>
        <ChipPicker
          options={GENDERS.map((g) => ({ value: g.value, label: g.label }))}
          selected={gender ? [gender] : []}
          onToggle={(v) => setGender((cur) => (cur === v ? null : v))}
        />
        <p className="mt-1.5 text-1 text-muted-foreground">Only you can see this.</p>
      </div>
    </div>
  );
}
