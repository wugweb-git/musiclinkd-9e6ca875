import { createFileRoute, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, ChevronRight, CircleCheck, Check, MapPin } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  DrawerField,
  InlineField,
  ChipPicker,
  PersonTypePicker,
  UsernameField,
  StepShell,
  StepSkeleton,
} from "@/components/ml/onboarding";
import { SheetMultiSelect, SheetSelect } from "@/components/ml/listing-form";
import { createMyBusiness, getMyBusiness, updateMyBusiness } from "@/lib/profile-groups.functions";
import { getMyProfile, saveMyProfile } from "@/lib/portfolio.functions";
import {
  AmenitiesEditor,
  EquipmentEditor,
  MAX_POLICIES,
  PoliciesEditor,
} from "@/components/ml/bookable-setup";
import { enterLinkedProfile } from "@/lib/pages.functions";
import { readMapsLink, type MapsPlace } from "@/lib/maps-link.functions";
import { syncBusinessFromGoogle } from "@/lib/google-business.functions";
import { switchToLinked } from "@/lib/saved-accounts";
import { GOOGLE_MAPS } from "@/lib/place";
import { usePinFill } from "@/hooks/use-pin-fill";
import { cityProblem, pinProblem } from "@/lib/validation";
import { businessTypes, choicesFor, useTaxonomy, type TaxonomyOption } from "@/lib/taxonomy";
import { roleIcon } from "@/lib/role-icons";
import { useUsernameAvailability } from "@/lib/username";
import { validateUsername } from "@/data/onboarding";
import { iconSize } from "@/lib/tokens";

/*
 * Create business, on the same wizard as talent onboarding (StepShell, drawers, fixed Continue).
 * Step 1 is the type, picked like a talent's person type. The Google Maps link, on the location
 * step, fills in the name and place (src/lib/maps-link.functions.ts). One business profile per account.
 */
const steps = [
  "type",
  "basics",
  "location",
  // The same Languages and Genres screens as talent (owner, 10 Oct 2026), in talent's order.
  "languages",
  "genres",
  "policies",
  // After Create, for every business type (owner, 10 Oct 2026): they save as they go, so they
  // need the business to exist; amenities, equipment and their photos belong to it.
  "amenities",
  "equipment",
] as const;
type Step = (typeof steps)[number];

export const Route = createFileRoute("/business/new")({
  // `from=edit`: opened from Edit profile; the step loads the saved business, Save returns there.
  validateSearch: (
    search: Record<string, unknown>,
  ): { step: Step; type?: string; from?: "edit" } => ({
    step: (steps.includes(search["step"] as Step) ? search["step"] : "type") as Step,
    ...(typeof search["type"] === "string" && search["type"] ? { type: search["type"] } : {}),
    ...(search["from"] === "edit" ? { from: "edit" as const } : {}),
  }),
  // Step 1, the type, is the shared role screen (owner, 10 Oct 2026): one screen for every account.
  beforeLoad: ({ search }) => {
    if (search.step === "type" || (!search.type && search.from !== "edit"))
      throw redirect({
        to: "/setup/$step",
        params: { step: "role" },
        search: {
          persona: "business",
          ...(search.type ? { type: search.type } : {}),
          ...(search.from ? { from: search.from } : {}),
        },
        replace: true,
      });
  },
  head: () => ({
    meta: [
      { title: "Create a business | MusicLinkd" },
      {
        name: "description",
        content: "Set up a studio, label, venue or agency with its own page and bookings.",
      },
      { property: "og:title", content: "Create a business | MusicLinkd" },
      {
        property: "og:description",
        content: "A business profile is separate from your personal profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewBusiness,
});

function typeIcon(o: TaxonomyOption) {
  const Icon = roleIcon(o);
  return <Icon size={16} aria-hidden />;
}

/** A username from a business name: lowercase letters and digits joined by dots, 3 to 30. */
function suggestUsername(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 30);
}

/** Picked slugs as their labels, or "Not added". */
function labelsOf(options: TaxonomyOption[] | undefined, slugs: string[]) {
  return slugs.map((s) => options?.find((o) => o.slug === s)?.label ?? s).join(", ") || "Not added";
}

const BUSINESS_GROUPS = [{ key: "business", label: "Business" }] as const;

function NewBusiness() {
  const { step, type: typeParam, from } = Route.useSearch();
  const editing = from === "edit";
  const navigate = useNavigate();
  const router = useRouter();
  const idx = steps.indexOf(step);
  const go = (s: Step) =>
    navigate({ to: "/business/new", search: { step: s, ...(type ? { type } : {}) } });
  const taxonomy = useTaxonomy();
  const tx = taxonomy.options;
  const types = businessTypes(tx?.person_types ?? []);

  const [type, setType] = useState<string | null>(typeParam ?? null);
  const [mapsUrl, setMapsUrl] = useState("");
  const [place, setPlace] = useState<MapsPlace | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  // How long the business has run, optional: the talent experience question's drawer, saved to
  // profiles.experience_level (owner, 10 Oct 2026).
  const [experience, setExperience] = useState<string | null>(null);
  // The @username, suggested from the name until the owner types their own.
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  useEffect(() => {
    if (!usernameTouched) setUsername(suggestUsername(name));
  }, [name, usernameTouched]);
  const usernameOk = validateUsername(username).ok;
  const usernameStatus = useUsernameAvailability(username, usernameOk);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [policies, setPolicies] = useState<string[]>([]);

  // Edit: fill every step from the saved profile and business, once.
  const loadProfile = useServerFn(getMyProfile);
  const loadBusiness = useServerFn(getMyBusiness);
  const loaded = useRef(false);
  useEffect(() => {
    if (!editing || loaded.current) return;
    loaded.current = true;
    void Promise.all([loadProfile(), loadBusiness()]).then(([p, b]) => {
      const row = p as {
        display_name?: string | null;
        username?: string | null;
        headline?: string | null;
        experience_level?: string | null;
        city?: string | null;
        state?: string | null;
        pin_code?: string | null;
        languages?: string[] | null;
        genres?: string[] | null;
        roles?: string[] | null;
      } | null;
      if (row) {
        setName(row.display_name ?? "");
        setUsername(row.username ?? "");
        setUsernameTouched(true);
        setTagline(row.headline ?? "");
        setExperience(row.experience_level ?? null);
        setCity(row.city ?? "");
        setState(row.state ?? "");
        setPinCode(row.pin_code ?? "");
        setLanguages(row.languages ?? []);
        setGenres(row.genres ?? []);
        if (row.roles?.[0]) setType(row.roles[0]);
      }
      setPolicies(b?.business.policies ?? []);
      setMapsUrl(b?.business.maps_url ?? "");
    });
  }, [editing, loadProfile, loadBusiness]);

  // A pasted Maps link fills in what it can; anything already typed is kept.
  const read = useServerFn(readMapsLink);
  const [reading, setReading] = useState(false);
  const lastRead = useRef("");
  const link = mapsUrl.trim();
  const mapsError =
    link && !GOOGLE_MAPS.test(link) ? "Paste the link from Share in Google Maps." : undefined;
  useEffect(() => {
    if (!link || mapsError || lastRead.current === link) return;
    const t = window.setTimeout(() => {
      lastRead.current = link;
      setReading(true);
      read({ data: { url: link } })
        .then((p) => {
          setPlace(p);
          if (p.name) setName((cur) => cur || p.name!);
          if (p.state) setState((cur) => cur || p.state!);
          if (p.city) setCity((cur) => cur || p.city!);
          if (p.pinCode) setPinCode((cur) => cur || p.pinCode!);
        })
        .catch(() => setPlace(null))
        .finally(() => setReading(false));
    }, 500);
    return () => window.clearTimeout(t);
  }, [link, mapsError, read]);

  /*
   * The PIN code was already asked for here, one field below the city, and did nothing but sit in
   * the row. It knows the answer to the question above it: six digits name a district and a state,
   * so a studio in Thane or Dombivli no longer has to find itself in a list that never had it.
   * Only blanks are filled — a city the owner chose stays theirs.
   */
  const pinFill = usePinFill();
  const fillFromPin = async (pin: string) => {
    const place = await pinFill(pin);
    if (!place) return;
    setState((cur) => cur || place.state);
    setCity((cur) => cur || place.city);
  };

  const cityError = city.trim() ? cityProblem(city) : "Choose the city.";
  const pinError = pinCode ? pinProblem(pinCode) : "Enter the 6-digit PIN code.";
  const valid: Record<Step, boolean> = {
    type: Boolean(type) && !mapsError,
    basics: Boolean(name.trim()) && (editing || (usernameOk && usernameStatus !== "taken")),
    location: Boolean(state) && !cityError && !pinError,
    languages: languages.length > 0,
    genres: true,
    policies:
      policies.some((p) => p.trim()) &&
      policies.filter((p) => p.trim()).length <= MAX_POLICIES &&
      policies.every((p) => p.trim().length <= 200),
    amenities: true,
    equipment: true,
  };

  const queryClient = useQueryClient();
  const save = useServerFn(createMyBusiness);
  const syncGoogle = useServerFn(syncBusinessFromGoogle);
  const enter = useServerFn(enterLinkedProfile);
  const create = useMutation({
    mutationFn: () =>
      save({
        data: {
          type: type!,
          name,
          username,
          city: city.trim(),
          state,
          pinCode,
          ...(tagline.trim() ? { tagline } : {}),
          ...(experience ? { experienceLevel: experience } : {}),
          ...(link ? { mapsUrl: link } : {}),
          languages,
          genres,
          policies: policies.map((p) => p.trim()).filter(Boolean),
        },
      }),
    onSuccess: async (res) => {
      // A talent sign-in got a business page: switch into it, so the next screens are the page's.
      if (res.pageId) {
        try {
          await switchToLinked(res.pageId, enter);
        } catch {
          toast.error("Your page is ready. Switch to it from Switch account.");
        }
      }
      // The page's phone, website and opening hours come from its Google profile. Setup is done
      // either way; a failed sync can be run again from Edit profile.
      if (link) {
        try {
          await syncGoogle({ data: { url: link } });
        } catch {
          toast.error("Your page is ready. Sync from Google again in Edit profile.");
        }
      }
      await queryClient.invalidateQueries();
      go("amenities");
    },
    onError: (e) =>
      toast.error(e instanceof Error && e.message ? e.message : "That didn't save. Try again."),
  });

  const persistProfile = useServerFn(saveMyProfile);
  const persistBusiness = useServerFn(updateMyBusiness);
  const update = useMutation({
    mutationFn: async () => {
      if (step === "basics")
        await persistProfile({
          data: {
            display_name: name.trim(),
            headline: tagline || null,
            experience_level: experience,
          },
        });
      if (step === "location") {
        await persistProfile({ data: { state, city: city.trim(), pin_code: pinCode || null } });
        await persistBusiness({ data: { maps_url: link } });
      }
      if (step === "languages") await persistProfile({ data: { languages } });
      if (step === "genres") await persistProfile({ data: { genres } });
      // Amenities and equipment save as they change; Save only returns to Edit profile.
      if (step === "policies")
        await persistBusiness({
          data: { policies: policies.map((p) => p.trim()).filter(Boolean) },
        });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      void navigate({ to: "/profile/edit" });
    },
    onError: (e) =>
      toast.error(e instanceof Error && e.message ? e.message : "That didn't save. Try again."),
  });

  const [nudge, setNudge] = useState(0);
  const finish = () => void navigate({ to: "/profile" });
  function submit() {
    if (!valid[step]) {
      setNudge((n) => n + 1);
      return;
    }
    if (editing) {
      update.mutate();
      return;
    }
    // Policies is the last question; Continue there creates the business (no review step, owner
    // 10 Oct 2026: Edit profile shows the same rows).
    if (step === "policies") create.mutate();
    else if (step === "equipment") finish();
    else go(steps[idx + 1]!);
  }

  const typeLabel = types.find((o) => o.slug === type)?.label ?? "";
  // A city from the Maps link that isn't in this state's list still shows as picked — SheetSelect
  // falls back to the stored value itself, so this screen no longer patches the option list.
  const cityOptions = choicesFor(tx?.cities.filter((c) => c.metadata?.state === state));

  const copy: Record<Step, { group: string; title: string; subtitle: string; why: string }> = {
    type: {
      group: "Business",
      title: "What kind of business?",
      subtitle: "Pick the one that fits best.",
      why: "Your type shapes your page and who finds you. The link fills in the rest.",
    },
    basics: {
      group: "Name",
      title: "What's it called?",
      subtitle: "Its name and one line about it.",
      why: "The name appears on your page, in search and on every booking.",
    },
    location: {
      group: "Location",
      title: "Where is it?",
      subtitle: "State, city and PIN code.",
      why: "Your page shows the city. The PIN code is never shown; it finds people near you.",
    },
    languages: {
      group: "Languages",
      title: "Which languages do you work in?",
      subtitle: "Choose all that apply.",
      why: "",
    },
    genres: {
      group: "Genres",
      title: "Which genres do you serve?",
      subtitle: "Pick up to three.",
      why: "",
    },
    policies: {
      group: "Policies",
      title: "What are your rules?",
      subtitle: "Write them in one place, one per line.",
      why: "Customers see these on your page before they book or visit.",
    },
    amenities: {
      group: "Amenities",
      title: "What does your business have?",
      subtitle: "Pick your amenities or add your own, then add a photo of each.",
      why: "Photos show customers it's real. You can add more later.",
    },
    equipment: {
      group: "Equipment",
      title: "What gear can people use?",
      subtitle: "Add each item: make and model, type, quantity, and included or extra.",
      why: "A photo of each item builds trust. You can add more later in Edit profile.",
    },
  };
  const c = copy[step];

  return (
    <>
      <StepShell
        editing={editing}
        step={idx + 1}
        total={steps.length}
        group={c.group}
        title={c.title}
        subtitle={c.subtitle}
        why={c.why}
        onBack={() =>
          editing
            ? void navigate({ to: "/profile/edit" })
            : step === "amenities"
              ? finish()
              : idx > 0
                ? go(steps[idx - 1]!)
                : router.history.back()
        }
        onSubmit={submit}
        footer={
          <Btn
            key={nudge}
            type="submit"
            loading={create.isPending || update.isPending}
            {...(editing
              ? { icon: <Check size={iconSize.md} /> }
              : step === "policies" || step === "equipment"
                ? {}
                : { iconEnd: <ArrowRight size={iconSize.md} /> })}
            className={`w-full ${nudge ? "animate-shake" : ""}`}
          >
            {editing
              ? "Save"
              : step === "policies"
                ? "Create Business Profile"
                : step === "equipment"
                  ? "Finish"
                  : "Continue"}
          </Btn>
        }
      >
        {!tx ? (
          <StepSkeleton />
        ) : step === "basics" ? (
          <div className="space-y-5 rounded-lg bg-card p-5 border border-border/80">
            <InlineField
              inputId="businessName"
              label="Business name"
              required
              value={name}
              onChange={setName}
              placeholder="Soundhouse Studios Bandra"
              maxLength={80}
              hint="Use the official registered or brand name."
            />
            <UsernameField
              inputId="businessUsername"
              value={username}
              onChange={(v) => {
                setUsernameTouched(true);
                setUsername(v);
              }}
              status={usernameStatus}
              locked={editing}
            />
            <InlineField
              inputId="tagline"
              label="Tagline (optional)"
              value={tagline}
              onChange={setTagline}
              placeholder="Two live rooms, analog tape, Dolby Atmos."
              maxLength={160}
              hint="Highlight what sets your facility or agency apart."
            />
            <DrawerField label="How long has the business been running? (optional)">
              <SheetSelect
                title="How long has the business been running?"
                value={experience}
                options={choicesFor(tx.experience_levels)}
                placeholder="Choose"
                onChange={setExperience}
              />
            </DrawerField>
          </div>
        ) : step === "location" ? (
          <div className="space-y-5">
            {/* Google Maps fills the place in; it lives with location, not step 1 (owner, 6 Oct 2026). */}
            <div className="rounded-lg border border-border/80 bg-card p-5">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Google Maps Profile (Optional)</p>
                {reading ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/5 px-2.5 py-0.5 text-1 font-semibold text-muted-foreground animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-ink animate-ping" />
                    Locating...
                  </span>
                ) : null}
              </div>
              <p className="mb-3 text-1 text-muted-foreground">
                Paste your business Maps link to auto-fill location, address, and name.
              </p>
              <InlineField
                inputId="mapsUrl"
                label="Google Maps share link"
                value={mapsUrl}
                onChange={setMapsUrl}
                placeholder="https://maps.app.goo.gl/…"
                inputMode="url"
                {...(mapsError
                  ? { error: mapsError }
                  : reading
                    ? { hint: "Reading place details from Google Maps…" }
                    : { hint: "In Google Maps, tap Share and copy the link." })}
              />
              {place && !reading && (place.name || place.city) ? (
                <div className="mt-3 flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-3.5 text-foreground text-1">
                  <CircleCheck size={18} className="mt-0.5 shrink-0 text-success" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {place.name || "Business Found"}
                      </span>
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-1 font-bold text-success-strong">
                        Verified Place
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-1 text-muted-foreground">
                      {[place.address, place.city, place.state, place.pinCode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    <p className="mt-1 text-1 text-muted-foreground">
                      Auto-populated into your business profile. You can modify anytime.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <div className="space-y-5 rounded-lg bg-card p-5 border border-border/80">
              <div className="grid grid-cols-2 gap-3">
                <DrawerField label="State">
                  <SheetSelect
                    title="State"
                    value={state || null}
                    options={choicesFor(tx.indian_states)}
                    placeholder="Choose"
                    searchable
                    onChange={(v) => {
                      setState(v);
                      setCity("");
                    }}
                  />
                </DrawerField>
                <DrawerField label="City">
                  {state ? (
                    <SheetSelect
                      title="City"
                      value={city || null}
                      options={cityOptions}
                      placeholder="Choose"
                      searchable
                      onChange={setCity}
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
              <InlineField
                inputId="pinCode"
                label="PIN code"
                required
                value={pinCode}
                onChange={(v) => {
                  const pin = v.replace(/\D/g, "").slice(0, 6);
                  setPinCode(pin);
                  void fillFromPin(pin);
                }}
                placeholder="400053"
                inputMode="numeric"
                {...(pinCode.length === 6 && pinError
                  ? { error: pinError }
                  : { hint: "Never publicly shared. Used for proximity discovery." })}
              />
            </div>
          </div>
        ) : step === "languages" ? (
          <ChipPicker
            layout="script"
            options={(tx.languages ?? []).map((o) => ({ value: o.slug, label: o.label }))}
            selected={languages}
            onToggle={(v) =>
              setLanguages(
                languages.includes(v) ? languages.filter((l) => l !== v) : [...languages, v],
              )
            }
          />
        ) : step === "genres" ? (
          <ChipPicker
            options={(tx.genres ?? []).map((o) => ({ value: o.slug, label: o.label }))}
            selected={genres}
            // Up to three genres, as for talent (Notion Master Taxonomy; owner, 10 Oct 2026).
            max={3}
            onToggle={(v) =>
              setGenres(
                genres.includes(v)
                  ? genres.filter((g) => g !== v)
                  : genres.length < 3
                    ? [...genres, v]
                    : genres,
              )
            }
          />
        ) : step === "policies" ? (
          <PoliciesEditor value={policies} onChange={setPolicies} />
        ) : step === "amenities" ? (
          <AmenitiesEditor />
        ) : step === "equipment" ? (
          <EquipmentEditor />
        ) : null}
      </StepShell>
    </>
  );
}
