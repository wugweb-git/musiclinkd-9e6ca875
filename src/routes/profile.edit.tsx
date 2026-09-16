import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactElement } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronDown, ChevronRight, Save } from "lucide-react";
import { Btn, BtnLink, Chip, Screen, TopBar } from "@/components/ml/ui";
import { getMyProfile, saveMyProfile } from "@/lib/portfolio.functions";
import { profileGaps, type ProfileRow } from "@/lib/profile-map";
import { useAuth } from "@/hooks/use-auth";
import { linkPlatforms, visibilityOptions, workModes as workModeOptions } from "@/data/onboarding";
import { talentTypes, useTaxonomy, type TaxonomyOption } from "@/lib/taxonomy";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({
    meta: [
      { title: "Edit Professional Profile | MusicLinkd" },
      {
        name: "description",
        content:
          "Update your MusicLinkd identity, music profile, portfolio, services and availability.",
      },
      { property: "og:title", content: "Edit Professional Profile | MusicLinkd" },
      {
        property: "og:description",
        content: "Keep your MusicLinkd professional identity current.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditProfile,
});

type Form = {
  display_name: string;
  username: string;
  headline: string;
  bio: string;
  city: string;
  state: string;
  availability: string;
  visibility: string;
  experience_level: string;
  roles: string[];
  genres: string[];
  instruments: string[];
  languages: string[];
  work_modes: string[];
  links: Record<string, string>;
};

const empty: Form = {
  display_name: "",
  username: "",
  headline: "",
  bio: "",
  city: "",
  state: "",
  availability: "",
  visibility: "public",
  experience_level: "",
  roles: [],
  genres: [],
  instruments: [],
  languages: [],
  work_modes: [],
  links: {},
};

function fromRow(row: ProfileRow | null): Form {
  if (!row) return empty;
  return {
    display_name: row.display_name ?? "",
    username: row.username ?? "",
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    availability: row.availability ?? "",
    visibility: row.visibility ?? "public",
    experience_level: row.experience_level ?? "",
    roles: row.roles ?? [],
    genres: row.genres ?? [],
    instruments: row.instruments ?? [],
    languages: row.languages ?? [],
    work_modes: row.work_modes ?? [],
    links: (row.links ?? {}) as Record<string, string>,
  };
}

function EditProfile() {
  const { signedIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const load = useServerFn(getMyProfile);
  const persist = useServerFn(saveMyProfile);

  const [open, setOpen] = useState<string | null>("identity");
  const [form, setForm] = useState<Form>(empty);
  const [row, setRow] = useState<ProfileRow | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error" | "offline" | "taken" | "reserved" | "invalid"
  >("idle");

  // Options come from taxonomy_options, the same source onboarding uses; the form stores slugs.
  const { options: taxonomy, state: taxonomyState } = useTaxonomy();
  const roleOptions = taxonomy ? talentTypes(taxonomy.person_types) : [];
  const genreOptions = taxonomy?.genres ?? [];
  const instrumentOptions = taxonomy?.instruments ?? [];
  const languageOptions = taxonomy?.languages ?? [];

  const fetchProfile = useCallback(() => {
    setState("loading");
    load()
      .then((r) => {
        const next = (r ?? null) as ProfileRow | null;
        setRow(next);
        setForm(fromRow(next));
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [load]);

  useEffect(() => {
    if (authLoading) return;
    // Editing needs an account. A signed-out visit goes to Welcome, as onboarding does.
    if (!signedIn) {
      void navigate({ to: "/welcome", replace: true });
      return;
    }
    fetchProfile();
  }, [authLoading, signedIn, fetchProfile, navigate]);

  const gaps = profileGaps({ ...(row ?? {}), ...form } as ProfileRow);

  const update = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const toggle = (
    key: "roles" | "genres" | "instruments" | "languages" | "work_modes",
    value: string,
  ) =>
    setForm((f) => {
      const list = f[key];
      return {
        ...f,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const save = async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    setStatus("saving");
    try {
      const saved = await persist({
        data: {
          display_name: form.display_name || null,
          // Set once, then locked by the database; only an unset username is sent.
          ...(row?.username ? {} : { username: form.username || null }),
          headline: form.headline || null,
          bio: form.bio || null,
          city: form.city || null,
          state: form.state || null,
          availability: form.availability || null,
          visibility: form.visibility || "public",
          experience_level: form.experience_level || null,
          roles: form.roles,
          genres: form.genres,
          instruments: form.instruments,
          languages: form.languages,
          work_modes: form.work_modes,
          links: form.links,
        },
      });
      setRow(saved as ProfileRow);
      setStatus("saved");
    } catch (e) {
      // saveMyProfile reports username rule failures by name.
      const reason = e instanceof Error ? e.message : "";
      setStatus(
        reason === "taken" || reason === "reserved" || reason === "invalid" ? reason : "error",
      );
    }
  };

  if (state === "loading") {
    return (
      <Screen>
        <TopBar title="Edit profile" back="/profile" />
        <div className="space-y-2 px-5 py-6" aria-busy>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-lg bg-subtle" />
          ))}
        </div>
      </Screen>
    );
  }

  if (state === "error") {
    return (
      <Screen>
        <TopBar title="Edit profile" back="/profile" />
        <main className="px-5 py-6">
          <div role="alert" className="rounded-lg border border-destructive/40 bg-card p-5">
            <p className="text-sm font-semibold text-destructive">We couldn't load your profile</p>
            <p className="mt-1 text-1 text-muted-foreground">
              Check your connection and try again.
            </p>
            <Btn variant="outline" className="mt-4" onClick={fetchProfile}>
              Retry
            </Btn>
          </div>
        </main>
      </Screen>
    );
  }

  const sections: {
    id: string;
    label: string;
    detail: string;
    done: boolean;
    body: ReactElement;
  }[] = [
    {
      id: "identity",
      label: "Identity",
      detail: "Name, username, headline, bio",
      done: Boolean(form.display_name && form.username),
      body: (
        <div className="space-y-3">
          <Field
            label="Display name"
            value={form.display_name}
            onChange={(v) => update({ display_name: v })}
          />
          <Field
            label="Username"
            value={form.username}
            onChange={(v) => update({ username: v.toLowerCase().replace(/\s+/g, ".") })}
            readOnly={Boolean(row?.username)}
            hint={
              row?.username
                ? "Your public link. Usernames can't be changed."
                : "3–30 characters: lowercase letters, numbers, dots and underscores. Can't be changed later."
            }
          />
          <Field label="Headline" value={form.headline} onChange={(v) => update({ headline: v })} />
          <Field label="Bio" value={form.bio} onChange={(v) => update({ bio: v })} multiline />
        </div>
      ),
    },
    {
      id: "professional",
      label: "Professional",
      detail: "Roles, experience, work modes",
      done: form.roles.length > 0,
      body: (
        <div className="space-y-4">
          <TaxonomyChips
            label="Roles"
            options={roleOptions}
            state={taxonomyState}
            selected={form.roles}
            onToggle={(v) => toggle("roles", v)}
          />
          <Chips
            label="Work modes"
            options={workModeOptions as unknown as string[]}
            selected={form.work_modes}
            onToggle={(v) => toggle("work_modes", v)}
          />
          <Field
            label="Experience"
            value={form.experience_level}
            onChange={(v) => update({ experience_level: v })}
          />
        </div>
      ),
    },
    {
      id: "music",
      label: "Music",
      detail: "Genres, instruments, languages",
      done: form.genres.length > 0 && form.languages.length > 0,
      body: (
        <div className="space-y-4">
          <TaxonomyChips
            label="Genres"
            options={genreOptions}
            state={taxonomyState}
            selected={form.genres}
            onToggle={(v) => toggle("genres", v)}
          />
          <TaxonomyChips
            label="Instruments"
            options={instrumentOptions}
            state={taxonomyState}
            selected={form.instruments}
            onToggle={(v) => toggle("instruments", v)}
          />
          <TaxonomyChips
            label="Languages"
            options={languageOptions}
            state={taxonomyState}
            selected={form.languages}
            onToggle={(v) => toggle("languages", v)}
          />
        </div>
      ),
    },
    {
      id: "availability",
      label: "Location & availability",
      detail: "City, state, current status",
      done: Boolean(form.city && form.availability),
      body: (
        <div className="space-y-3">
          <Field label="City" value={form.city} onChange={(v) => update({ city: v })} />
          <Field label="State" value={form.state} onChange={(v) => update({ state: v })} />
          <Field
            label="Availability"
            value={form.availability}
            onChange={(v) => update({ availability: v })}
            hint="e.g. Open for studio work"
          />
        </div>
      ),
    },
    {
      id: "links",
      label: "Links",
      detail: "Streaming and social profiles",
      done: Object.values(form.links).some(Boolean),
      body: (
        <div className="space-y-3">
          {linkPlatforms.map((p) => {
            const key =
              typeof p === "string"
                ? p
                : ((p as { key?: string; label?: string }).key ?? (p as { label: string }).label);
            const label = typeof p === "string" ? p : ((p as { label?: string }).label ?? key);
            return (
              <Field
                key={key}
                label={label}
                value={form.links[key] ?? ""}
                onChange={(v) => update({ links: { ...form.links, [key]: v } })}
              />
            );
          })}
        </div>
      ),
    },
    {
      id: "privacy",
      label: "Privacy",
      detail: "Who can see your profile",
      done: true,
      body: (
        <div className="space-y-2">
          {visibilityOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => update({ visibility: o.key })}
              className={`flex min-h-[56px] w-full items-center gap-3 rounded-lg border px-4 text-left ${form.visibility === o.key ? "border-primary bg-background" : "border-border bg-card"}`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{o.label}</span>
                <span className="block truncate text-1 text-muted-foreground">{o.hint}</span>
              </span>
              {form.visibility === o.key ? (
                <Check size={16} className="shrink-0 text-primary" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <Screen>
      <TopBar title="Edit profile" subtitle={`${gaps.percent}% complete`} back="/profile" />
      <main className="px-5 pb-40 pt-5">
        {gaps.missing.length ? (
          <div className="mb-4 rounded-lg bg-subtle p-4">
            <p className="text-1 font-semibold">Finish your profile</p>
            <p className="mt-1 text-1 leading-relaxed text-muted-foreground">
              Still missing: {gaps.missing.map((m) => m.label).join(", ")}.
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          {sections.map((section) => {
            const isOpen = open === section.id;
            return (
              <section
                key={section.id}
                className="overflow-hidden rounded-lg bg-subtle"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : section.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[72px] w-full items-center gap-3 px-4 text-left"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${section.done ? "bg-success-container text-success" : "bg-background text-foreground"}`}
                  >
                    {section.done ? (
                      <Check size={16} aria-hidden />
                    ) : (
                      <span aria-hidden className="text-1 font-bold">
                        •
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{section.label}</span>
                    <span className="mt-0.5 block truncate text-1 text-muted-foreground">
                      {section.detail}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronDown size={16} className="shrink-0 text-muted-foreground" aria-hidden />
                  ) : (
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </button>
                {isOpen ? (
                  <div className="border-t border-border bg-subtle/50 px-4 pb-4 pt-3">
                    {section.body}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app space-y-2 border-t border-border bg-card/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {status === "taken" || status === "reserved" || status === "invalid" ? (
          <p role="alert" className="text-1 text-destructive">
            {status === "taken"
              ? "That username is taken. Try another."
              : status === "reserved"
                ? "That username is reserved. Try another."
                : "Usernames use lowercase letters, numbers, dots and underscores (3–30)."}
          </p>
        ) : status === "error" ? (
          <p role="alert" className="text-1 text-destructive">
            Couldn't save. Your edits are still here — try again.
          </p>
        ) : status === "offline" ? (
          <p role="status" className="text-1 text-warn">
            You're offline. Reconnect to save these changes.
          </p>
        ) : status === "saved" ? (
          <p role="status" className="text-1 text-success">
            Saved to your account.
          </p>
        ) : null}
        <Btn className="w-full" onClick={() => void save()} disabled={status === "saving"}>
          <Save size={16} aria-hidden />
          {status === "saving" ? "Saving…" : "Save changes"}
        </Btn>
      </div>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  multiline = false,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  multiline?: boolean;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-1 font-medium text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="mt-1.5 w-full rounded-lg bg-subtle px-4 py-3 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-1.5 min-h-12 w-full rounded-lg border border-border px-4 text-sm outline-none focus:border-primary ${readOnly ? "bg-background text-muted-foreground" : "bg-card"}`}
        />
      )}
      {hint ? <span className="mt-1 block text-1 text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function TaxonomyChips({
  label,
  options,
  state,
  selected,
  onToggle,
}: {
  label: string;
  options: TaxonomyOption[];
  state: "loading" | "ready" | "error";
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div>
      <span className="block text-1 font-medium text-muted-foreground">{label}</span>
      {state === "loading" ? (
        <p className="mt-2 text-1 text-muted-foreground">Loading options…</p>
      ) : state === "error" ? (
        <p className="mt-2 text-1 text-warn">
          Options could not be loaded. Reopen this screen to try again.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((o) => (
            <Chip key={o.slug} active={selected.includes(o.slug)} onClick={() => onToggle(o.slug)}>
              {o.label}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

function Chips({
  label,
  options,
  selected,
  onToggle,
  labels,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div>
      <span className="block text-1 font-medium text-muted-foreground">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} active={selected.includes(o)} onClick={() => onToggle(o)}>
            {labels?.[o] ?? o}
          </Chip>
        ))}
      </div>
    </div>
  );
}
