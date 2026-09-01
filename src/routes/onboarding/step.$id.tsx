import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Btn } from "@/components/ml/ui";
import {
  ChipPicker,
  ChoiceGrid,
  ErrorBanner,
  InlineField,
  LocationHint,
  OfflineBanner,
  OnboardingProvider,
  OptionList,
  PhotoPicker,
  SavingBanner,
  SelectField,
  StepShell,
  StepSkeleton,
  useOnboarding,
} from "@/components/ml/onboarding";
import {
  BIO_LIMIT,
  availabilityFor,
  businessTypes,
  citiesByState,
  contactChannels,
  discoveryPrefs,
  experienceLevels,
  genres,
  instruments,
  intents,
  languages,
  linkPlatforms,
  roles,
  specialisationByRole,
  statesByCountry,
  steps,
  validateUrl,
  validateUsername,
  visibilityOptions,
  visibleSteps,
  workModes,
  type OnboardingDraft,
  type RoleKey,
  type StepDef,
} from "@/data/onboarding";

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

type Banner = "none" | "saving" | "offline" | "error";

function StepRoute() {
  const { id } = Route.useParams();
  const { draft, set, toggle, markComplete, hydrated } = useOnboarding();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<Banner>("none");

  const list = visibleSteps(draft);
  const def = steps.find((s) => s.id === id);
  const index = list.findIndex((s) => s.id === id);

  if (!hydrated) {
    return (
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background px-5 pt-16">
        <StepSkeleton />
      </div>
    );
  }

  if (!def || index === -1) {
    return (
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col justify-center bg-background px-6 text-center">
        <p className="text-lg font-semibold">This step isn't part of your setup</p>
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
    if (complete) markComplete(def.id);
    const after = visibleSteps({
      ...draft,
      completedSteps: complete ? [...draft.completedSteps, def.id] : draft.completedSteps,
    });
    const pos = after.findIndex((s) => s.id === def.id);
    setBanner("saving");
    window.setTimeout(() => {
      setBanner("none");
      goto(after[pos + 1]);
    }, 320);
  };

  const valid = isValid(def.id, draft);

  return (
    <StepShell
      step={index + 1}
      total={list.length}
      group={def.group}
      title={def.title}
      subtitle={def.subtitle}
      why={def.why}
      onBack={index === 0 ? () => navigate({ to: "/onboarding" }) : () => goto(list[index - 1])}
      {...(def.optional ? { onSkip: () => advance(false) } : {})}
      banner={
        banner === "saving" ? (
          <SavingBanner />
        ) : banner === "offline" ? (
          <OfflineBanner />
        ) : banner === "error" ? (
          <ErrorBanner
            message="We couldn't save that just now. Your answers are kept on this device."
            onRetry={() => setBanner("none")}
          />
        ) : null
      }
      footer={
        <div className="space-y-2">
          <Btn
            className={valid ? "w-full" : "w-full opacity-50"}
            onClick={valid ? () => advance(true) : () => setBanner("error")}
          >
            {index === list.length - 1 ? "Review profile" : "Continue"}
          </Btn>
          <button
            type="button"
            onClick={() => navigate({ to: "/onboarding/skip" })}
            className="min-h-11 w-full text-xs font-semibold text-muted-foreground"
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
            hint="Use the name you're credited under."
          />
          <InlineField
            inputId="username"
            label="Username"
            prefix="musiclinkd.com/"
            value={d.username}
            onChange={(v) => set({ username: v.toLowerCase().replace(/\s/g, "") })}
            placeholder="yourname"
            {...(check.ok ? { ok: check.message } : { error: check.message })}
          />
        </div>
      );
    }

    case "photo":
      return (
        <div className="space-y-5">
          <PhotoPicker photo={d.photo} onChange={(v) => set({ photo: v })} />
          <p className="rounded-2xl bg-subtle px-4 py-3 text-xs text-text2">
            A clear photo of your face works better than a logo or a live shot from far away.
          </p>
        </div>
      );

    case "role":
      return (
        <ChoiceGrid
          options={roles.map((r) => ({ key: r.key, label: r.label, hint: r.hint, emoji: r.emoji }))}
          value={d.primaryRole}
          onSelect={(k) => set({ primaryRole: k as RoleKey })}
        />
      );

    case "secondary-roles":
      return (
        <ChipPicker
          options={roles.filter((r) => r.key !== d.primaryRole).map((r) => r.label)}
          selected={d.secondaryRoles}
          onToggle={(v) => toggle("secondaryRoles", v)}
        />
      );

    case "instruments":
      return (
        <div className="space-y-5">
          <ChipPicker options={instruments} selected={d.instruments} onToggle={(v) => toggle("instruments", v)} />
          {d.instruments.length > 1 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Primary instrument
              </p>
              <ChipPicker
                options={d.instruments}
                selected={d.primaryInstrument ? [d.primaryInstrument] : []}
                onToggle={(v) => set({ primaryInstrument: d.primaryInstrument === v ? null : v })}
              />
            </div>
          ) : null}
        </div>
      );

    case "specialisation": {
      const spec = d.primaryRole ? specialisationByRole[d.primaryRole] : undefined;
      if (!spec) return <p className="text-sm text-muted-foreground">Nothing extra needed for your role.</p>;
      return (
        <div className="space-y-6">
          {spec.groups.map((g) => (
            <div key={g.label}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.label}</p>
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
      return <ChipPicker options={genres} selected={d.genres} onToggle={(v) => toggle("genres", v)} />;

    case "languages":
      return <ChipPicker options={languages} selected={d.languages} onToggle={(v) => toggle("languages", v)} />;

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
            hint="Only shown as an area — never a full address."
          />
          <LocationHint />
        </div>
      );

    case "work-mode":
      return <OptionList options={workModes} selected={d.workModes} onToggle={(k) => toggle("workModes", k)} />;

    case "availability":
      return (
        <ChipPicker options={availabilityFor} selected={d.availability} onToggle={(v) => toggle("availability", v)} />
      );

    case "intent":
      return <ChipPicker options={intents} selected={d.intents} onToggle={(v) => toggle("intents", v)} columns />;

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
                bio: `${roles.find((r) => r.key === d.primaryRole)?.label ?? "Music professional"} based in ${
                  d.city || "India"
                }, working across ${d.genres.slice(0, 2).join(" and ") || "multiple genres"}. Open to ${
                  d.availability[0]?.toLowerCase() ?? "collaborations"
                }.`,
              })
            }
            className="min-h-11 w-full rounded-full border border-border text-xs font-semibold"
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
                {...(bad ? { error: "That doesn't look like a full URL." } : {})}
              />
            );
          })}
        </div>
      );

    case "contact":
      return <OptionList options={contactChannels} selected={d.contact} onToggle={(k) => toggle("contact", k)} />;

    case "discovery":
      return (
        <ChipPicker options={discoveryPrefs} selected={d.discovery} onToggle={(v) => toggle("discovery", v)} columns />
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
            options={businessTypes}
            selected={d.businessIntent ? [d.businessIntent] : []}
            onToggle={(v) => set({ businessIntent: d.businessIntent === v ? null : v })}
          />
          <p className="rounded-2xl bg-subtle px-4 py-3 text-xs text-text2">
            Choosing one hands you over to Business setup after onboarding. Your personal profile stays yours.
          </p>
        </div>
      );

    case "band":
      return (
        <OptionList
          options={[
            { key: "yes", label: "Yes, I'm in a band or crew", hint: "We'll help you create a shared profile." },
            { key: "no", label: "Not right now", hint: "You can add one any time from your profile." },
          ]}
          selected={[d.bandIntent ? "yes" : "no"]}
          onToggle={(k) => set({ bandIntent: k === "yes" })}
          multi={false}
        />
      );

    default:
      return null;
  }
}
