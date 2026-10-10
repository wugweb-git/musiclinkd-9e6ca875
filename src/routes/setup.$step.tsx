import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, Globe, Plus } from "lucide-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Btn } from "@/components/ml/ui";
import { AuthNotice, AuthTextButton } from "@/components/ml/auth";
import { BrandIcon } from "@/components/ml/brand-icons";
import {
  choicesFor,
  labelFor,
  talentGroups,
  talentTypes,
  businessTypes,
  useTaxonomy,
  type TaxonomyOption,
} from "@/lib/taxonomy";
import { haptic } from "@/lib/haptics";
import { roleIcon } from "@/lib/role-icons";
import { useAuth } from "@/hooks/use-auth";
import { usePinFill } from "@/hooks/use-pin-fill";
import { cityFromDistrict } from "@/lib/place";
import { pinProblem } from "@/lib/validation";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useFlowBack } from "@/lib/flow-back";
import { getLocationGuess } from "@/lib/location-guess.functions";
import { useUsernameAvailability, type UsernameStatus } from "@/lib/username";
import { listMyPortfolio, saveMyProfile, type UsernameClaim } from "@/lib/portfolio.functions";
import {
  ChipPicker,
  DateDrawerField,
  DrawerField,
  PersonTypePicker,
  InlineField,
  OnboardingProvider,
  PrivateDetailsFields,
  UsernameField,
  StepShell,
  StepSkeleton,
  SyncBanner,
  SyncStatus,
  useOnboarding,
} from "@/components/ml/onboarding";
import {
  BIO_LIMIT,
  citiesByState,
  cityAliases,
  linkPlatforms,
  statesByCountry,
  steps,
  validateUrl,
  validateUsername,
  visibleSteps,
  type OnboardingDraft,
  type StepDef,
} from "@/data/onboarding";
import { Switch } from "@/components/ml/kit";
import { instrumentIcon } from "@/lib/instrument-icons";
import { SheetMultiSelect, SheetSelect } from "@/components/ml/listing-form";
import { iconSize } from "@/lib/tokens";
import { cn } from "@/lib/utils";

function typeIcon(o: TaxonomyOption) {
  const Icon = roleIcon(o);
  return <Icon size={16} aria-hidden />;
}

/**
 * `from=edit`: opened from Edit profile; Save returns there instead of going on.
 * `persona=business` (role only; the screen variable setupPersona): the same screen asks a business its type, then business setup goes on
 * (owner, 10 Oct 2026: one set of screens for every account type). `type` is the type picked.
 */
type StepSearch = { from?: "edit"; persona?: "business"; type?: string };

export const Route = createFileRoute("/setup/$step")({
  validateSearch: (search: Record<string, unknown>): StepSearch => ({
    ...(search["from"] === "edit" ? { from: "edit" as const } : {}),
    ...(search["persona"] === "business" ? { persona: "business" as const } : {}),
    ...(typeof search["type"] === "string" && search["type"] ? { type: search["type"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Your profile — MusicLinkd" },
      {
        name: "description",
        content:
          "Answer one short question at a time — role, instruments, genres, languages, city and availability — and resume whenever you like.",
      },
      { property: "og:title", content: "Your profile — MusicLinkd" },
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

/** Each goal and the "Show me more" topics it implies, by label (taxonomy intents → discovery_prefs). */
const SHOW_MORE: Record<string, string[]> = {
  "Find Collaborators": ["People", "Projects"],
  "Find Work": ["Opportunities", "Projects"],
  "Hire Talent": ["People", "Services"],
  "Find Studios": ["Studios", "Businesses"],
  "Buy Equipment": ["Marketplace"],
  "Rent Equipment": ["Marketplace"],
  "Sell Equipment": ["Marketplace"],
  "Join Communities": ["Communities"],
  "Discover Music": ["Music"],
  "Build Professional Network": ["People", "Businesses"],
};

/** Business setup's steps before Create (type, basics, location, offer, policies, review). */
const BUSINESS_SETUP_STEPS = 6;

/** A business's type on the shared role screen: the same picker and pills, one choice. */
function BusinessTypeQuestion({
  value,
  onChange,
  showError,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  showError: boolean;
}) {
  const tx = useTaxonomy().options;
  if (!tx) return <StepSkeleton />;
  return (
    <div className="space-y-3">
      <PersonTypePicker
        groups={[{ key: "business", label: "Business" }]}
        options={businessTypes(tx.person_types)}
        selected={value ? [value] : []}
        icon={typeIcon}
        onToggle={(slug) => onChange(slug === value ? null : slug)}
      />
      {showError && !value ? (
        <p role="alert" className="text-center text-1 text-destructive">
          Pick a business type to continue.
        </p>
      ) : null}
    </div>
  );
}

function StepRoute() {
  const { step: id } = Route.useParams();
  const { from, persona: setupPersona, type: typeParam } = Route.useSearch();
  const editing = from === "edit";
  const {
    draft,
    set,
    toggle,
    markComplete,
    hydrated,
    sync,
    retry,
    flush,
    claimedUsername,
    claimUsername,
  } = useOnboarding();
  const taxonomy = useTaxonomy();
  const navigate = useNavigate();
  const listPortfolio = useServerFn(listMyPortfolio);
  const [banner, setBanner] = useState<Banner>("none");
  // Bumped on each blocked Continue so the button re-mounts and the shake replays.
  const [nudge, setNudge] = useState(0);
  // Continue is never greyed out (phone plan): pressing it early marks what is missing, inline.
  const [showErrors, setShowErrors] = useState(false);
  const [bizType, setBizType] = useState<string | null>(typeParam ?? null);
  const saveType = useServerFn(saveMyProfile);
  // Editing a business's type starts from the saved one.
  useEffect(() => {
    if (setupPersona === "business" && editing && hydrated && !bizType && draft.primaryRole)
      setBizType(draft.primaryRole);
  }, [setupPersona, editing, hydrated, bizType, draft.primaryRole]);
  useEffect(() => setShowErrors(false), [id]);
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
        // A city the list does not carry is still a real city. This used to fall back to "", so
        // somebody in Thane was told their state and left to find a city that was never offered —
        // the first place a new person met the gap. The picker shows a value it has no option for.
        set({ state, city: match ?? cityFromDistrict(city ?? "") });
      })
      .catch(() => undefined);
  }, [hydrated, id, draft.state, draft.country, locate, set]);

  const list = visibleSteps(draft);
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
    else void navigate({ to: "/setup/$step", params: { step: skipTo }, replace: true });
  }, [skipTo, navigate]);

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-[100dvh] w-full max-w-[414px] bg-warm px-5 pt-16">
        <StepSkeleton />
      </div>
    );
  }

  if (!def || index === -1) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[414px] flex-col justify-center bg-warm px-6 text-center">
        <p className="text-2 font-semibold">This step isn't part of your setup</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your answers so far are safe. We'll take you to the next relevant question.
        </p>
        <Btn
          className="mt-5"
          onClick={() =>
            navigate({
              to: "/setup/$step",
              params: { step: list[0]?.id ?? "identity" },
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
              : { to: "/portfolio", search: { add: "1" as const, from: "onboarding" as const } },
          ),
        );
      return;
    }
    navigate({ to: "/setup/$step", params: { step: target.id } });
  };

  const advance = (complete: boolean) => {
    haptic(complete ? "confirm" : "select");
    if (complete) markComplete(def.id);
    const after = visibleSteps({
      ...draft,
      completedSteps: complete ? [...draft.completedSteps, def.id] : draft.completedSteps,
    });
    const pos = after.findIndex((s) => s.id === def.id);
    setBanner("none");
    goto(after[pos + 1]);
  };

  // A business on the role screen picks its type here; nothing is written to a talent profile.
  const business = setupPersona === "business" && def.id === "role";
  const valid = business ? Boolean(bizType) : isValid(def.id, draft, usernameStatus);

  const blocked = () => {
    haptic("error");
    setShowErrors(true);
    // Identity marks its own fields; other steps have one choice and take the notice above it.
    if (def.id !== "identity" && !business) setBanner("error");
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
      `/setup/${prev.id}`,
      () =>
        void navigate({
          to: "/setup/$step",
          params: { step: prev.id },
          search: {},
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

  // From Edit profile: save now (not on the 700ms autosave) and go back there.
  const saveAndReturn = () => {
    haptic("confirm");
    // Awaited, so Edit profile reloads the saved answer and its own Save can't write an old one.
    void flush().then(() => navigate({ to: "/profile/edit" }));
  };
  const submit = business
    ? valid
      ? editing
        ? () => {
            haptic("confirm");
            void saveType({ data: { roles: [bizType!] } })
              .then(() => navigate({ to: "/profile/edit" }))
              .catch(() => toast.error("That didn't save. Try again."));
          }
        : () => {
            haptic("select");
            void navigate({ to: "/business/new", search: { step: "basics", type: bizType! } });
          }
      : blocked
    : editing && !valid
      ? blocked
      : editing && !(def.id === "identity" && !claimedUsername)
        ? saveAndReturn
        : def.id === "identity" && valid
          ? () => void claimAndAdvance()
          : valid
            ? () => advance(true)
            : blocked;

  return (
    <StepShell
      // Counted against every step, so the total never changes as steps are skipped (owner, 6 Oct).
      step={business ? 1 : steps.findIndex((s) => s.id === def.id) + 1}
      total={business ? BUSINESS_SETUP_STEPS : steps.length}
      group={def.group}
      title={business ? "What kind of business?" : def.title}
      subtitle={business ? "Pick the one that fits best." : def.subtitle}
      why={def.why}
      optional={def.optional}
      status={<SyncStatus state={sync} />}
      editing={editing}
      onBack={
        business
          ? () => void navigate({ to: "/onboarding" })
          : editing
            ? () => void navigate({ to: "/profile/edit" })
            : back
      }
      onSubmit={submit}
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
            {...(editing
              ? { icon: <Check size={iconSize.md} /> }
              : { iconEnd: <ArrowRight size={iconSize.md} /> })}
            className={`w-full ${nudge ? "animate-shake" : ""}`}
          >
            {editing ? "Save" : "Continue"}
          </Btn>
          {editing || business ? null : (
            <AuthTextButton
              onClick={() => navigate({ to: "/onboarding/skip" })}
              className="flex w-full justify-center text-1 text-muted-foreground"
            >
              Finish Later
            </AuthTextButton>
          )}
        </div>
      }
    >
      {business ? (
        <BusinessTypeQuestion value={bizType} onChange={setBizType} showError={showErrors} />
      ) : (
        <StepBody
          id={def.id}
          draft={draft}
          set={set}
          toggle={toggle}
          usernameStatus={usernameStatus}
          claimedUsername={claimedUsername}
          claimError={claimError}
          showErrors={showErrors}
        />
      )}
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
  showErrors,
}: {
  id: string;
  draft: OnboardingDraft;
  set: (p: Partial<OnboardingDraft>) => void;
  toggle: (field: keyof OnboardingDraft, value: string) => void;
  usernameStatus: UsernameStatus;
  claimedUsername: string | null;
  claimError: string | null;
  showErrors: boolean;
}) {
  const taxonomy = useTaxonomy();
  /*
   * The city picker offers what the taxonomy carries, and the taxonomy carries two to four cities
   * per state. This is where a new person meets that first, so the PIN code answers it: six digits
   * name a district, and anything already chosen is left alone.
   */
  const pinFill = usePinFill();
  const fillFromPin = async (pin: string) => {
    const place = await pinFill(pin);
    if (!place) return;
    set({ ...(d.state ? {} : { state: place.state }), ...(d.city ? {} : { city: place.city }) });
  };
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
  const needsTaxonomy = [
    "identity",
    "role",
    "instruments",
    "genres",
    "languages",
    "work-mode",
    "intent",
  ].includes(id);
  if (needsTaxonomy && taxonomy.state === "error") {
    return (
      <AuthNotice
        title="We couldn't load the choices"
        action={<AuthTextButton onClick={taxonomy.retry}>Try Again</AuthTextButton>}
      >
        Check your connection, then try again.
      </AuthNotice>
    );
  }
  if (needsTaxonomy && !taxonomy.options) return <StepSkeleton />;
  const tx = taxonomy.options;

  switch (id) {
    case "identity": {
      return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <section className="space-y-4 p-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Public identity</h2>
              <p className="mt-0.5 text-1 text-muted-foreground">
                The name and link people will find.
              </p>
            </div>
            <InlineField
              inputId="displayName"
              label="Display name"
              value={d.displayName}
              onChange={(v) => set({ displayName: v })}
              placeholder="Your professional name"
              autoComplete="name"
              maxLength={80}
              {...(showErrors && !d.displayName.trim()
                ? { error: "Add the name you're credited under." }
                : { hint: "Use the name you're credited under." })}
            />
            <UsernameField
              value={d.username}
              onChange={(v) => set({ username: v })}
              status={usernameStatus}
              locked={Boolean(claimedUsername)}
              claimError={showErrors && !d.username ? "Choose a username." : claimError}
            />
          </section>
          <section className="space-y-4 border-t border-border p-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Location</h2>
              <p className="mt-0.5 text-1 text-muted-foreground">
                Used for relevant work and people nearby.
              </p>
            </div>
            <InlineField
              inputId="pinCode"
              label="PIN code (optional)"
              value={d.pinCode}
              onChange={(v) => {
                const pin = v.replace(/\D/g, "").slice(0, 6);
                set({ pinCode: pin });
                void fillFromPin(pin);
              }}
              placeholder="400053"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              {...(d.pinCode.length === 6 && pinProblem(d.pinCode)
                ? { error: pinProblem(d.pinCode)! }
                : { hint: "Enter this first to fill your location faster. Kept private." })}
            />
            <div className="grid grid-cols-2 gap-3">
              <DrawerField label="State" error={showErrors && !d.state ? "Choose a state." : null}>
                <SheetSelect
                  title="State"
                  value={d.state || null}
                  options={choicesFor(tx?.indian_states)}
                  placeholder="Choose"
                  searchable
                  onChange={(v) => set({ state: v, city: "" })}
                />
              </DrawerField>
              <DrawerField label="City" error={showErrors && !d.city ? "Choose a city." : null}>
                {d.state ? (
                  <SheetSelect
                    title="City"
                    value={d.city || null}
                    options={choicesFor(tx?.cities.filter((c) => c.metadata?.state === d.state))}
                    placeholder="Choose"
                    searchable
                    onChange={(v) => set({ city: v })}
                  />
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex h-11 w-full items-center rounded-sm border border-input bg-card px-3.5 text-left text-[16px] text-muted-foreground opacity-60"
                  >
                    State first
                  </button>
                )}
              </DrawerField>
            </div>
          </section>
          <section className="space-y-4 border-t border-border p-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Private details</h2>
              <p className="mt-0.5 text-1 text-muted-foreground">Visible only to you.</p>
            </div>
            <PrivateDetailsFields />
          </section>
          <section className="space-y-4 border-t border-border p-4">
            {/* The profile's one-line headline, before the bio (owner, 10 Oct 2026). */}
            <InlineField
              inputId="headline"
              label="Headline (optional)"
              value={d.headline}
              onChange={(v) => set({ headline: v })}
              maxLength={120}
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
          </section>
        </div>
      );
    }

    case "role": {
      const types = talentTypes(tx?.person_types ?? []);
      // Up to three roles on one screen: the first picked is the main role (owner, 6 Oct 2026).
      const picked = [d.primaryRole, ...d.secondaryRoles].filter((x): x is string => Boolean(x));
      return (
        <PersonTypePicker
          groups={talentGroups}
          options={types}
          selected={picked}
          icon={typeIcon}
          max={3}
          onToggle={(slug) => {
            const next = picked.includes(slug)
              ? picked.filter((x) => x !== slug)
              : picked.length < 3
                ? [...picked, slug]
                : picked;
            set({ primaryRole: next[0] ?? null, secondaryRoles: next.slice(1) });
          }}
        />
      );
    }

    case "instruments":
      // One question (owner, 10 Oct 2026): the second "how long" screen is gone; career
      // experience is asked on "How do you work?".
      return (
        <ChipPicker
          // One instrument list for every persona (persona_bucket retired, owner 10 Oct 2026).
          options={(tx?.instruments ?? []).map((o) => {
            const Icon = instrumentIcon(o.slug);
            return { value: o.slug, label: o.label, media: <Icon size={16} aria-hidden /> };
          })}
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

    case "languages":
      return (
        <ChipPicker
          layout="script"
          options={(tx?.languages ?? []).map((o) => ({ value: o.slug, label: o.label }))}
          selected={d.languages}
          onToggle={(v) => toggle("languages", v)}
        />
      );

    case "genres":
      return (
        <ChipPicker
          // One genre list for every persona, up to three (Notion Master Taxonomy; owner, 10 Oct 2026).
          options={(tx?.genres ?? []).map((o) => ({ value: o.slug, label: o.label }))}
          selected={d.genres}
          max={3}
          onToggle={(v) => {
            if (!d.genres.includes(v) && d.genres.length >= 3) return;
            toggle("genres", v);
          }}
        />
      );

    case "work-mode":
      // Both stay bottom drawers (owner, 6 Oct 2026); not pills.
      return (
        <div className="space-y-6">
          <DrawerField label="Where you work">
            <SheetMultiSelect
              title="Where you work"
              value={d.workModes}
              options={choicesFor(tx?.work_modes)}
              max={tx?.work_modes.length ?? 4}
              placeholder="Choose"
              onChange={(v) => set({ workModes: v })}
            />
          </DrawerField>
          {/* Experience is asked here only (owner, 10 Oct 2026): one answer (draft.experience). */}
          <DrawerField label="How long have you worked in music?">
            <SheetSelect
              title="How long have you worked in music?"
              value={d.experience}
              options={choicesFor(tx?.experience_levels)}
              placeholder="Choose"
              onChange={(v) => set({ experience: v as OnboardingDraft["experience"] })}
            />
          </DrawerField>
          {/* Availability is one switch (owner, 6 Oct 2026), saved as "Available" or nothing. */}
          <div className="flex min-h-touch items-center justify-between gap-3 rounded-sm border border-border bg-card px-4">
            <span className="text-sm font-medium text-foreground">Open to work</span>
            <Switch
              label="Open to work"
              checked={d.availability.includes("Available")}
              onChange={(on) => set({ availability: on ? ["Available"] : [] })}
            />
          </div>
        </div>
      );

    case "intent": {
      // One deduplicated list (owner, 6 Oct 2026). "Show me more" said the same things again
      // (People, Studios, Music…), so it is no longer asked: it follows from the goals picked.
      const intentOpts = choicesFor(tx?.intents);
      const moreOpts = choicesFor(tx?.discovery_prefs);
      const discoveryFor = (picked: string[]) => {
        const labels = new Set(
          picked.flatMap(
            (v) => SHOW_MORE[intentOpts.find((o) => o.value === v)?.label ?? ""] ?? [],
          ),
        );
        return moreOpts.filter((o) => labels.has(o.label)).map((o) => o.value);
      };
      return (
        <ChipPicker
          options={intentOpts}
          selected={d.intents}
          onToggle={(v) => {
            const next = d.intents.includes(v)
              ? d.intents.filter((x) => x !== v)
              : [...d.intents, v];
            set({ intents: next, discovery: discoveryFor(next) });
          }}
        />
      );
    }

    case "contact":
      return <ContactStep draft={d} set={set} toggle={toggle} />;

    default:
      return null;
  }
}

/* ------------------------------------------------------------------ contact */

const linkIcons: Record<string, ReactNode> = {
  website: <Globe size={iconSize.md} />,
  instagram: <BrandIcon brand="instagram" />,
  youtube: <BrandIcon brand="youtube" />,
  spotify: <BrandIcon brand="spotify" />,
  soundcloud: <BrandIcon brand="soundcloud" />,
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
              icon={<Plus size={iconSize.sm} />}
              onClick={() => setAdding(true)}
              className="text-sm"
            >
              Add More
            </AuthTextButton>
          )
        ) : null}
      </section>
    </div>
  );
}
