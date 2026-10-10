import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useCallback, useEffect, useState, type ComponentProps, type ReactElement } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Camera, Check, ChevronDown, ChevronRight, Pencil, RefreshCw, Save } from "lucide-react";
import { ActionBar, Btn, BtnLink, Chip, Screen, TopBar } from "@/components/ml/ui";
import { Switch } from "@/components/ml/kit";
import { cn } from "@/lib/utils";
import { steps as setupSteps } from "@/data/onboarding";
import { ImagePickButton } from "@/components/ml/profile";
import { uploadProfileImage, type ProfileImageKind } from "@/lib/profile-images";
import {
  getMyProfile,
  getMyProfileSections,
  saveMyExperience,
  saveMyProfile,
} from "@/lib/portfolio.functions";
import { profileGaps, type ProfileRow } from "@/lib/profile-map";
import { ProfileCompletion } from "@/components/ml/profile";
import { useAuth } from "@/hooks/use-auth";
import { linkPlatforms } from "@/data/onboarding";
import {
  businessTypes,
  choicesFor,
  labelFor,
  useTaxonomy,
  type TaxonomyOption,
} from "@/lib/taxonomy";
import { SheetMultiSelect, SheetSelect } from "@/components/ml/listing-form";
import { DrawerField, PersonTypePicker, PrivateDetailsFields } from "@/components/ml/onboarding";
import { roleIcon } from "@/lib/role-icons";

const BUSINESS_GROUPS = [{ key: "business", label: "Business" }] as const;
import { iconSize } from "@/lib/tokens";
import { GOOGLE_MAPS, PIN_CODE } from "@/lib/place";
import {
  DEFAULT_COUNTRY,
  INDIAN_STATES,
  cityProblem,
  nameProblem,
  pinProblem,
  stateProblem,
} from "@/lib/validation";
import { InlineField, SelectField } from "@/components/ml/onboarding";
import { CityField } from "@/components/ml/listing-form";
import { usePinFill } from "@/hooks/use-pin-fill";
import { useRequireBusiness } from "@/hooks/use-require-business";
import {
  AmenitiesEditor,
  EquipmentEditor,
  PoliciesEditor,
  useMyBookablePhotos,
} from "@/components/ml/bookable-setup";
import { getMyBusiness, updateMyBusiness } from "@/lib/profile-groups.functions";
import { syncBusinessFromGoogle } from "@/lib/google-business.functions";
import { sized } from "@/lib/image-url";

export const Route = createFileRoute("/profile/edit")({
  // ?section= opens that section (a profile section's edit pencil links straight to it).
  validateSearch: (search: Record<string, unknown>): { section?: string } =>
    typeof search["section"] === "string" ? { section: search["section"] } : {},
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
  first_name: string;
  last_name: string;
  username: string;
  headline: string;
  bio: string;
  city: string;
  pin_code: string;
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
  first_name: "",
  last_name: "",
  username: "",
  headline: "",
  bio: "",
  city: "",
  pin_code: "",
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

/** First and last from their own columns once they exist, else display_name split at the first space. */
function splitName(row: ProfileRow): { first_name: string; last_name: string } {
  const r = row as ProfileRow & { first_name?: string | null; last_name?: string | null };
  if (r.first_name) return { first_name: r.first_name, last_name: r.last_name ?? "" };
  const full = (row.display_name ?? "").trim();
  const space = full.indexOf(" ");
  return space < 0
    ? { first_name: full, last_name: "" }
    : { first_name: full.slice(0, space), last_name: full.slice(space + 1).trim() };
}

function fromRow(row: ProfileRow | null): Form {
  if (!row) return empty;
  return {
    ...splitName(row),
    username: row.username ?? "",
    headline: row.headline ?? "",
    bio: row.bio ?? "",
    city: row.city ?? "",
    pin_code: row.pin_code ?? "",
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
  // A business account also keeps its Google Maps link, shown as Directions on its profile.
  const { allowed: isBusiness } = useRequireBusiness();
  const loadBusiness = useServerFn(getMyBusiness);
  const saveBusiness = useServerFn(updateMyBusiness);
  const [mapsUrl, setMapsUrl] = useState("");
  // A business's rules live in the same form as the rest of its details, not on a screen of their
  // own (owner, 28 Sep 2026) — /business/policies was the last business field without a home here.
  const [policies, setPolicies] = useState<string[]>([]);
  // Every business lists what its place has here, with a photo of each (owner, 3 Oct 2026). The
  // first amenity or equipment item creates the business's bookable on the server.
  const amenities = useMyBookablePhotos(isBusiness);
  useEffect(() => {
    if (!isBusiness) return;
    void loadBusiness()
      .then((r) => {
        setMapsUrl(r?.business.maps_url ?? "");
        setPolicies(r?.business.policies ?? []);
      })
      .catch(() => undefined);
  }, [isBusiness, loadBusiness]);

  // Sync from Google: the business's details from its Google profile, written straight away and
  // mirrored into this form so Save keeps them.
  const syncFromGoogle = useServerFn(syncBusinessFromGoogle);
  const [syncing, setSyncing] = useState(false);
  async function syncGoogle() {
    setSyncing(true);
    try {
      const { place, updated } = await syncFromGoogle({ data: { url: mapsUrl.trim() } });
      setForm((f) => ({
        ...f,
        ...(updated.includes("city") && place.city ? { city: place.city } : {}),
        ...(updated.includes("state") && place.state ? { state: place.state } : {}),
        ...(updated.includes("PIN code") && place.pinCode ? { pin_code: place.pinCode } : {}),
        ...(place.website ? { links: { ...f.links, website: place.website } } : {}),
      }));
      toast.success(
        updated.length
          ? `Synced from Google: ${updated.join(", ")}`
          : "Google had nothing new for this place.",
      );
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Couldn't sync. Try again.");
    } finally {
      setSyncing(false);
    }
  }

  const { section: openSection } = Route.useSearch();
  /*
   * Which sections are expanded. A set, not one id (owner, 25 Sep 2026): opening Location used to
   * close Identity, so filling in a profile meant collapsing the thing you had just been reading.
   * `?section=` still opens the one a profile's edit pencil points at, and it is simply the first
   * one open rather than the only one allowed.
   */
  const [open, setOpen] = useState<Set<string>>(() => new Set([openSection ?? "identity"]));
  const toggleSection = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  // Experience lives in its own table; it loads and saves beside the profile row, on the same Save.
  const loadSections = useServerFn(getMyProfileSections);
  const persistExperience = useServerFn(saveMyExperience);
  const [experience, setExperience] = useState<ExperienceDraft[]>([]);
  useEffect(() => {
    if (!signedIn) return;
    void loadSections()
      .then((sec) => {
        setExperience(
          sec.experience.map((e) => ({
            title: e.title,
            org: e.org ?? "",
            startYear: e.start_year ? String(e.start_year) : "",
            endYear: e.end_year ? String(e.end_year) : "",
            detail: e.detail ?? "",
          })),
        );
      })
      .catch(() => undefined);
  }, [signedIn, loadSections]);
  const [form, setForm] = useState<Form>(empty);
  const [row, setRow] = useState<ProfileRow | null>(null);
  // Years on each instrument, asked in onboarding (discovery_prefs.instrumentExperience).
  const [instrumentExperience, setInstrumentExperience] = useState<Record<string, string>>({});
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error" | "offline" | "taken" | "reserved" | "invalid"
  >("idle");

  // Cover and profile photo: uploaded and saved straight away, same as the rest of Identity is
  // saved on the main Save — a photo change shouldn't wait behind unrelated fields.
  const pickImage = async (kind: ProfileImageKind, file: File) => {
    try {
      const url = await uploadProfileImage(kind, file);
      await persist({ data: kind === "avatar" ? { avatar_url: url } : { cover_url: url } });
      setRow(
        (current) =>
          ({
            ...(current ?? {}),
            [kind === "avatar" ? "avatar_url" : "cover_url"]: url,
          }) as ProfileRow,
      );
      toast.success(kind === "avatar" ? "Profile photo updated" : "Cover updated");
    } catch (err) {
      // The file is still here, so the failed upload can run again in one tap.
      toast.error(err instanceof Error ? err.message : "That upload didn't work. Try again.", {
        action: { label: "Try again", onClick: () => void pickImage(kind, file) },
      });
    }
  };

  // Options come from taxonomy_options, the same source onboarding uses; the form stores slugs.
  const { options: taxonomy, state: taxonomyState } = useTaxonomy();
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
        setInstrumentExperience(
          ((next?.discovery_prefs ?? {}) as { instrumentExperience?: Record<string, string> })
            .instrumentExperience ?? {},
        );
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

  // Six digits fill the city and state that are still blank. See usePinFill.
  const pinFill = usePinFill();
  const fillFromPin = async (pin: string) => {
    const place = await pinFill(pin);
    if (!place) return;
    setForm((f) => ({ ...f, state: f.state || place.state, city: f.city || place.city }));
  };
  // Shown under each field as it is typed; a save waits until none is left.
  const problems = {
    first_name: isBusiness
      ? form.first_name.trim()
        ? null
        : "Enter your business name."
      : nameProblem(form.first_name, "First name", true),
    last_name: isBusiness ? null : nameProblem(form.last_name, "Last name"),
    city: cityProblem(form.city),
    pin_code: pinProblem(form.pin_code),
    state: stateProblem(form.state),
    maps:
      isBusiness && mapsUrl.trim() && !GOOGLE_MAPS.test(mapsUrl.trim())
        ? "Paste the link from Share in Google Maps"
        : null,
  };
  const firstProblem = Object.values(problems).find(Boolean) ?? null;
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
    if (firstProblem) {
      toast.error(firstProblem);
      return;
    }
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    setStatus("saving");
    try {
      const saved = await persist({
        data: {
          display_name:
            [form.first_name.trim(), form.last_name.trim()].filter(Boolean).join(" ") || null,
          first_name: isBusiness ? null : form.first_name.trim() || null,
          last_name: isBusiness ? null : form.last_name.trim() || null,
          // Set once, then locked by the database; only an unset username is sent.
          ...(row?.username ? {} : { username: form.username || null }),
          headline: form.headline || null,
          bio: form.bio || null,
          city: form.city || null,
          pin_code: PIN_CODE.test(form.pin_code.trim()) ? form.pin_code.trim() : null,
          state: form.state || null,
          country: DEFAULT_COUNTRY,
          availability: form.availability || null,
          visibility: form.visibility || "public",
          experience_level: form.experience_level || null,
          // Merged into the stored discovery_prefs on the server; other keys are kept.
          discovery_prefs: {
            instrumentExperience: Object.fromEntries(
              Object.entries(instrumentExperience).filter(([slug]) =>
                form.instruments.includes(slug),
              ),
            ),
          },
          roles: form.roles,
          genres: form.genres,
          instruments: form.instruments,
          languages: form.languages,
          work_modes: form.work_modes,
          links: form.links,
        },
      });
      await persistExperience({
        data: {
          items: experience
            .filter((e) => e.title.trim())
            .map((e) => ({
              title: e.title.trim(),
              ...(e.org.trim() ? { org: e.org.trim() } : {}),
              startYear: yearOf(e.startYear),
              endYear: yearOf(e.endYear),
              ...(e.detail.trim() ? { detail: e.detail.trim() } : {}),
            })),
        },
      });
      if (isBusiness) {
        const link = mapsUrl.trim();
        const rules = policies
          .map((r) => r.trim())
          .filter(Boolean)
          .slice(0, 12);
        await saveBusiness({
          data: {
            maps_url: GOOGLE_MAPS.test(link) ? link : null,
            ...(rules.length ? { policies: rules } : {}),
          },
        });
      }
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
            <div key={i} className="h-[72px] animate-pulse rounded-lg bg-ink/5" />
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
      id: "photos",
      label: "Photos",
      detail: "Profile photo and cover",
      done: Boolean(row?.avatar_url),
      body: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="h-16 w-16 rounded-full bg-subtle bg-cover bg-center"
                style={row?.avatar_url ? { backgroundImage: `url(${row.avatar_url})` } : undefined}
                aria-hidden
              />
              <ImagePickButton
                kind="avatar"
                label="Change profile photo"
                className="absolute -bottom-1 -right-1 h-8 w-8 border border-border bg-card text-foreground"
                onPick={pickImage}
              >
                <Camera size={iconSize.sm} aria-hidden />
              </ImagePickButton>
            </div>
            <div className="relative h-16 flex-1 overflow-hidden rounded-lg bg-subtle">
              {row?.cover_url ? (
                <img
                  src={sized(row.cover_url, { width: 412 })}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <ImagePickButton
                kind="cover"
                label="Change cover photo"
                className="absolute right-2 top-2 h-8 w-8 bg-card/90 text-foreground"
                onPick={pickImage}
              >
                <Pencil size={iconSize.sm} aria-hidden />
              </ImagePickButton>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "identity",
      label: "Identity",
      detail: "Name, headline, bio",
      done: Boolean(form.first_name),
      body: (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="h-16 w-16 rounded-full bg-subtle bg-cover bg-center"
                style={row?.avatar_url ? { backgroundImage: `url(${row.avatar_url})` } : undefined}
                aria-hidden
              />
              <ImagePickButton
                kind="avatar"
                label="Change profile photo"
                className="absolute -bottom-1 -right-1 h-8 w-8 border border-border bg-card text-foreground"
                onPick={pickImage}
              >
                <Camera size={iconSize.sm} aria-hidden />
              </ImagePickButton>
            </div>
            <div className="relative h-16 flex-1 overflow-hidden rounded-lg bg-subtle">
              {row?.cover_url ? (
                <img
                  src={sized(row.cover_url, { width: 412 })}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : null}
              <ImagePickButton
                kind="cover"
                label="Change cover photo"
                className="absolute right-2 top-2 h-8 w-8 bg-card/90 text-foreground"
                onPick={pickImage}
              >
                <Pencil size={iconSize.sm} aria-hidden />
              </ImagePickButton>
            </div>
          </div>
          {isBusiness ? (
            <Field
              label="Business name"
              value={form.first_name}
              onChange={(v) => update({ first_name: v, last_name: "" })}
              error={problems.first_name}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="First name"
                value={form.first_name}
                onChange={(v) => update({ first_name: v })}
                error={problems.first_name}
              />
              <Field
                label="Last name"
                value={form.last_name}
                onChange={(v) => update({ last_name: v })}
                error={problems.last_name}
              />
            </div>
          )}
          <Field label="Headline" value={form.headline} onChange={(v) => update({ headline: v })} />
          <Field label="Bio" value={form.bio} onChange={(v) => update({ bio: v })} multiline />
          {/* Asked in onboarding; owner-only (profile_private), saved as they change. */}
          {isBusiness ? null : <PrivateDetailsFields />}
        </div>
      ),
    },
    {
      id: "music",
      label: "Music identity",
      detail: "Type, genres, instruments, languages",
      done: form.roles.length > 0 && form.genres.length > 0 && form.languages.length > 0,
      body: (
        <div className="space-y-4">
          {isBusiness ? (
            // A business's type, with the same picker and list as business setup; one type. Talent
            // types are not offered: the two journeys don't cross.
            <DrawerField label="Business type">
              <PersonTypePicker
                groups={BUSINESS_GROUPS}
                options={taxonomy ? businessTypes(taxonomy.person_types) : []}
                selected={form.roles.slice(0, 1)}
                icon={(o) => {
                  const Icon = roleIcon(o);
                  return <Icon size={iconSize.sm} aria-hidden />;
                }}
                onToggle={(v) => update({ roles: form.roles[0] === v ? [] : [v] })}
              />
            </DrawerField>
          ) : (
            // The onboarding screens, recycled (owner, 10 Oct 2026): each row opens its question.
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
              <EditStepRow
                step="role"
                label="Roles"
                values={form.roles.map((v) => labelFor(taxonomy?.person_types, v))}
              />
              <EditStepRow
                step="genres"
                label="Genres"
                values={form.genres.map((v) => labelFor(taxonomy?.genres, v))}
              />
              <EditStepRow
                step="instruments"
                label="Instruments"
                values={form.instruments.map((v) => labelFor(taxonomy?.instruments, v))}
              />
              <EditStepRow
                step="languages"
                label="Languages"
                values={form.languages.map((v) => labelFor(taxonomy?.languages, v))}
              />
            </div>
          )}
          {isBusiness ? (
            <>
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
            </>
          ) : null}
        </div>
      ),
    },
    {
      id: "experience",
      label: "Experience",
      detail: "Roles, bands and places you've worked",
      done: experience.some((e) => e.title.trim()),
      body: <ExperienceEditor items={experience} onChange={setExperience} />,
    },
    {
      id: "professional",
      label: "Professional",
      detail: "Work modes, experience level",
      done: Boolean(form.experience_level || form.work_modes.length),
      body: (
        <div className="space-y-4">
          {isBusiness ? null : (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <EditStepRow
                step="work-mode"
                label="How you work"
                values={[
                  ...form.work_modes.map((v) => labelFor(taxonomy?.work_modes, v)),
                  ...(form.availability ? ["Open to work"] : []),
                ]}
              />
            </div>
          )}
          {isBusiness ? (
            <>
              {/* Onboarding's own question and list (step "work-mode"), from taxonomy work_modes. */}
              <DrawerField label="Where you work">
                <SheetMultiSelect
                  title="Where you work"
                  value={form.work_modes}
                  options={choicesFor(taxonomy?.work_modes)}
                  max={taxonomy?.work_modes.length ?? 4}
                  placeholder="Choose"
                  onChange={(v) => update({ work_modes: v })}
                />
              </DrawerField>
            </>
          ) : null}
          {/* Onboarding's own questions and lists (step "work-mode"), not free text. */}
          <DrawerField label="How long have you worked in music?">
            <SheetSelect
              title="How long have you worked in music?"
              value={form.experience_level || null}
              options={choicesFor(taxonomy?.experience_levels)}
              placeholder="Choose"
              onChange={(v) => update({ experience_level: v })}
            />
          </DrawerField>
          {/* How long per instrument is asked on the Instruments screen (row above), not here. */}
        </div>
      ),
    },
    {
      id: "availability",
      label: "Location & availability",
      detail: "City, PIN code, state, current status",
      done: Boolean(form.city && form.availability),
      body: (
        <div className="space-y-3">
          <CityField
            id="edit-city"
            value={form.city}
            onChange={(v) => update({ city: v })}
            state={form.state}
            error={problems.city}
          />
          <SelectField
            selectId="edit-state"
            label="State"
            value={form.state}
            options={[...INDIAN_STATES]}
            placeholder="Choose"
            onChange={(v) => update({ state: v })}
          />
          {problems.state ? <p className="text-1 text-destructive">{problems.state}</p> : null}
          <Field
            label="PIN code"
            value={form.pin_code}
            onChange={(v) => {
              const pin = v.replace(/\D/g, "").slice(0, 6);
              update({ pin_code: pin });
              void fillFromPin(pin);
            }}
            hint="6 digits, e.g. 560038. Only used to find what is near you; never shown."
            error={problems.pin_code}
            inputMode="numeric"
          />
          <Field label="Country" value={DEFAULT_COUNTRY} onChange={() => undefined} readOnly />
          {isBusiness ? (
            <div>
              <Field
                label="Google Maps link"
                value={mapsUrl}
                onChange={setMapsUrl}
                hint="Opens as Directions on your profile. Sync brings your details from Google."
                error={problems.maps}
              />
              <Btn
                variant="outline"
                className="mt-2 w-full"
                icon={<RefreshCw size={iconSize.sm} aria-hidden />}
                loading={syncing}
                disabled={!GOOGLE_MAPS.test(mapsUrl.trim())}
                onClick={() => void syncGoogle()}
              >
                Sync from Google
              </Btn>
              <div className="mt-3">
                {/* The same policies editor as business setup (/business/new). */}
                <p className="mb-2 text-1 font-semibold text-foreground">Policies</p>
                <PoliciesEditor value={policies} onChange={setPolicies} />
              </div>
            </div>
          ) : null}
          {isBusiness ? (
            // One switch for every account type (owner, 10 Oct 2026); talent sets it on How you work.
            <div className="flex min-h-touch items-center justify-between gap-3 rounded-sm border border-border bg-card px-4">
              <span className="text-sm font-medium text-foreground">Open to work</span>
              <Switch
                label="Open to work"
                checked={Boolean(form.availability)}
                onChange={(on) => update({ availability: on ? "Available" : "" })}
              />
            </div>
          ) : null}
        </div>
      ),
    },
    ...(isBusiness
      ? [
          {
            id: "amenities",
            label: "Amenities & equipment",
            detail: "What your space has, with a photo of each",
            done: (amenities.data?.amenities ?? []).length > 0,
            body: (
              <div className="space-y-8">
                <AmenitiesEditor />
                <EquipmentEditor />
              </div>
            ),
          },
        ]
      : []),
    {
      id: "links",
      label: "Links",
      detail: "Streaming and social profiles",
      done: Object.values(form.links).some(Boolean),
      body: isBusiness ? (
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
      ) : (
        // The onboarding screens, recycled: links and visibility, then goals.
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
          <EditStepRow
            step="contact"
            label="Links and visibility"
            values={Object.entries(form.links)
              .filter(([, v]) => v)
              .map(([k]) => k)}
          />
          <EditStepRow
            step="intent"
            label="Goals"
            values={(row?.intents ?? []).map((v) => labelFor(taxonomy?.intents, v))}
          />
        </div>
      ),
    },
  ];

  /*
   * Edit profile is the way back to the setup screens (owner, 10 Oct 2026): one row per screen, in
   * setup order, for every account type; the same screens in their edit state. Screens with no
   * setup counterpart (photos, a studio's amenities) open on their own here.
   */
  const solo = sections.find((sct) => sct.id === openSection && OWN_SECTIONS.includes(sct.id));
  if (solo) {
    return (
      <Screen>
        <TopBar title={solo.label} back="/profile/edit" />
        <main className="px-5 pb-40 pt-5">{solo.body}</main>
        <ActionBar className="space-y-2">
          {status === "error" ? (
            <p role="alert" className="text-1 text-destructive">
              Couldn't save. Your edits are still here — try again.
            </p>
          ) : null}
          <Btn
            className="w-full"
            icon={<Check size={iconSize.md} />}
            onClick={() => void save().then(() => navigate({ to: "/profile/edit" }))}
            disabled={status === "saving"}
          >
            {status === "saving" ? "Saving…" : "Save"}
          </Btn>
        </ActionBar>
      </Screen>
    );
  }
  const names = (cat: keyof NonNullable<typeof taxonomy>, list: string[]) =>
    list.map((v) => labelFor(taxonomy?.[cat] as never, v));
  const rows: { key: string; label: string; values: string[]; link: EditLink }[] = isBusiness
    ? [
        {
          key: "type",
          label: "Business type",
          values: names("person_types", form.roles.slice(0, 1)),
          link: {
            to: "/setup/$step",
            params: { step: "role" },
            search: { persona: "business", from: "edit" },
          },
        },
        {
          key: "basics",
          label: "Name and tagline",
          values: [form.first_name, form.headline].filter(Boolean),
          link: { to: "/business/new", search: { step: "basics", from: "edit" } },
        },
        {
          key: "location",
          label: "Location",
          values: [labelFor(taxonomy?.cities, form.city), form.pin_code].filter(Boolean),
          link: { to: "/business/new", search: { step: "location", from: "edit" } },
        },
        {
          key: "languages",
          label: "Languages",
          values: names("languages", form.languages),
          link: { to: "/business/new", search: { step: "languages", from: "edit" } },
        },
        {
          key: "genres",
          label: "Genres",
          values: names("genres", form.genres),
          link: { to: "/business/new", search: { step: "genres", from: "edit" } },
        },
        {
          key: "policies",
          label: "Policies",
          values: policies.filter(Boolean),
          link: { to: "/business/new", search: { step: "policies", from: "edit" } },
        },
      ]
    : setupSteps.map((st) => ({
        key: st.id,
        label: EDIT_LABELS[st.id] ?? st.title,
        values:
          {
            role: names("person_types", form.roles),
            identity: [
              [form.first_name, form.last_name].filter(Boolean).join(" "),
              labelFor(taxonomy?.cities, form.city),
            ].filter(Boolean),
            instruments: names("instruments", form.instruments),
            languages: names("languages", form.languages),
            genres: names("genres", form.genres),
            "work-mode": [
              ...names("work_modes", form.work_modes),
              ...(form.availability ? ["Open to work"] : []),
            ],
            intent: names("intents", row?.intents ?? []),
            contact: Object.entries(form.links)
              .filter(([, v]) => v)
              .map(([k]) => k),
          }[st.id] ?? [],
        link: { to: "/setup/$step", params: { step: st.id }, search: { from: "edit" } },
      }));
  const own = sections.filter((sct) => OWN_SECTIONS.includes(sct.id));
  return (
    <Screen>
      <TopBar title="Edit profile" back="/profile" />
      <main className="space-y-4 px-5 pb-16 pt-5">
        {gaps.missing.length ? <ProfileCompletion gaps={gaps} /> : null}
        {/* One list, the earlier card style (owner, 10 Oct 2026): a done mark, the row, its answer. */}
        <div className="space-y-2.5">
          {[
            ...own.map((sct) => ({
              key: sct.id,
              label: sct.label,
              values: [] as string[],
              detail: sct.detail,
              done: sct.done,
              link: { to: "/profile/edit", search: { section: sct.id } } as EditLink,
            })),
            ...rows.map((r) => ({ ...r, detail: "", done: r.values.length > 0 })),
          ].map((r) => (
            <EditRow
              key={r.key}
              label={r.label}
              values={r.values}
              detail={r.detail}
              done={r.done}
              link={r.link}
            />
          ))}
        </div>
      </main>
    </Screen>
  );

  return (
    <Screen>
      <TopBar title="Edit profile" subtitle={`${gaps.percent}% complete`} back="/profile" />
      <main className="px-5 pb-40 pt-5">
        {gaps.missing.length ? (
          <div className="mb-4">
            <ProfileCompletion gaps={gaps} />
          </div>
        ) : null}

        <div className="space-y-2.5">
          {sections.map((section) => {
            const isOpen = open.has(section.id);
            return (
              <section
                key={section.id}
                className="overflow-hidden rounded-lg border border-border/80 bg-card transition-all duration-150"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  className="flex min-h-[72px] w-full items-center gap-3 px-4 text-left active:bg-subtle/50 transition-colors"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${section.done ? "bg-foreground text-background" : "bg-subtle text-foreground border border-border"}`}
                  >
                    {section.done ? (
                      <Check size={iconSize.sm} aria-hidden />
                    ) : (
                      <span aria-hidden className="text-1 font-bold">
                        •
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-foreground">{section.label}</span>
                    <span className="mt-0.5 block truncate text-1 font-medium text-muted-foreground">
                      {section.detail}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronDown
                      size={iconSize.sm}
                      className="shrink-0 text-foreground"
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      size={iconSize.sm}
                      className="shrink-0 text-foreground"
                      aria-hidden
                    />
                  )}
                </button>
                {isOpen ? (
                  <div className="border-t border-border/70 bg-subtle/30 px-4 pb-4 pt-3.5 animate-in fade-in-50 duration-150">
                    {section.body}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </main>

      <ActionBar className="space-y-2">
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
          <p role="status" className="text-1 text-warn-strong">
            You're offline. Reconnect to save these changes.
          </p>
        ) : status === "saved" ? (
          <p role="status" className="text-1 text-success-strong">
            Saved to your account.
          </p>
        ) : null}
        <Btn className="w-full" onClick={() => void save()} disabled={status === "saving"}>
          <Save size={iconSize.sm} aria-hidden />
          {status === "saving" ? "Saving…" : "Save changes"}
        </Btn>
      </ActionBar>
    </Screen>
  );
}

/**
 * The shared field (InlineField), with an id derived from its label so this screen's eighteen
 * fields don't each have to name one. This used to be a second, differently styled copy of the
 * same idea — rounded-lg where the rest of the app is a pill, its own label and error treatment.
 */
function Field({
  inputId,
  ...props
}: Omit<ComponentProps<typeof InlineField>, "inputId"> & { inputId?: string }) {
  const id = inputId ?? `edit-${props.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <InlineField {...props} inputId={id} />;
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
        <p className="mt-2 text-1 text-warn-strong">
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

type ExperienceDraft = {
  title: string;
  org: string;
  startYear: string;
  endYear: string;
  detail: string;
};

const yearOf = (v: string) => {
  const n = Number(v.trim());
  return Number.isInteger(n) && n >= 1950 && n <= 2100 ? n : null;
};

/** The experience list: each entry's title, where, years and a line about it; add or remove. */
function ExperienceEditor({
  items,
  onChange,
}: {
  items: ExperienceDraft[];
  onChange: (v: ExperienceDraft[]) => void;
}) {
  const set = (i: number, patch: Partial<ExperienceDraft>) =>
    onChange(items.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  return (
    <div className="space-y-4">
      {items.map((e, i) => (
        <div key={i} className="space-y-3 rounded-lg bg-background p-3">
          <Field label="Title" value={e.title} onChange={(v) => set(i, { title: v })} />
          <Field label="Where" value={e.org} onChange={(v) => set(i, { org: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="From (year)"
              value={e.startYear}
              onChange={(v) => set(i, { startYear: v })}
            />
            <Field
              label="To (year)"
              value={e.endYear}
              onChange={(v) => set(i, { endYear: v })}
              hint="Leave empty if current"
            />
          </div>
          <Field
            label="About it"
            value={e.detail}
            onChange={(v) => set(i, { detail: v })}
            multiline
          />
          <Btn
            variant="ghost"
            className="w-full"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            Remove
          </Btn>
        </div>
      ))}
      {items.length < 30 ? (
        <Btn
          variant="outline"
          className="w-full"
          onClick={() =>
            onChange([...items, { title: "", org: "", startYear: "", endYear: "", detail: "" }])
          }
        >
          Add experience
        </Btn>
      ) : null}
    </div>
  );
}

/** Edit profile's rows for talent: one per setup screen, labelled for editing. */
const EDIT_LABELS: Record<string, string> = {
  role: "Roles",
  identity: "About you",
  instruments: "Instruments",
  languages: "Languages",
  genres: "Genres",
  "work-mode": "How you work",
  intent: "Goals",
  contact: "Links and visibility",
};
/**
 * Sections with no setup screen; each opens on its own from Edit profile. No per-role section: every
 * type shares one schema (owner, 10 Oct 2026).
 */
const OWN_SECTIONS: string[] = ["photos", "amenities"];

type EditLink =
  | { to: "/setup/$step"; params: { step: string }; search: { from: "edit"; persona?: "business" } }
  | {
      to: "/business/new";
      search: { step: "basics" | "location" | "languages" | "genres" | "policies"; from: "edit" };
    }
  | { to: "/profile/edit"; search: { section: string } };

/** A row inside a section that opens a setup screen in its edit state. */
function EditStepRow({ step, label, values }: { step: string; label: string; values: string[] }) {
  return (
    <EditRow
      label={label}
      values={values}
      link={{ to: "/setup/$step", params: { step }, search: { from: "edit" } }}
    />
  );
}

/** One Edit profile row, as a card: a done mark, the row, the answer now (or what it holds). */
function EditRow({
  label,
  values,
  link,
  detail = "",
  done,
}: {
  label: string;
  values: string[];
  link: EditLink;
  detail?: string | undefined;
  done?: boolean | undefined;
}) {
  const set = done ?? values.length > 0;
  return (
    <Link
      {...(link as unknown as { to: "/profile/edit" })}
      className="state-layer flex min-h-[72px] items-center gap-3 rounded-lg border border-border bg-card px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          set ? "bg-foreground text-background" : "border border-border bg-subtle text-foreground",
        )}
      >
        {set ? <Check size={iconSize.sm} /> : <span className="text-1 font-bold">•</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{label}</span>
        <span className="mt-0.5 block truncate text-1 font-medium text-muted-foreground">
          {values.length ? values.join(", ") : detail || "Not set"}
        </span>
      </span>
      <ChevronRight size={iconSize.sm} aria-hidden className="shrink-0 text-foreground" />
    </Link>
  );
}
