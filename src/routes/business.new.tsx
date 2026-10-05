import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ChevronRight, CircleCheck, Check, MapPin } from "lucide-react";
import { Btn, BtnLink } from "@/components/ml/ui";
import { Dialog } from "@/components/ml/kit";
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
import { createMyBusiness } from "@/lib/profile-groups.functions";
import { AmenitiesEditor, EquipmentEditor, PoliciesEditor } from "@/components/ml/bookable-setup";
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
 * Step 1 is the type, picked like a talent's person type, and the Google Maps link, which fills in
 * the name and place (src/lib/maps-link.functions.ts). One business profile per account.
 */
const steps = [
  "type",
  "basics",
  "location",
  "offer",
  "policies",
  "review",
  // After Create, for studios: these need the studio to exist, since photos belong to it.
  "amenities",
  "equipment",
] as const;
const AFTER_CREATE: readonly Step[] = ["amenities", "equipment"];
type Step = (typeof steps)[number];

export const Route = createFileRoute("/business/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    step: (steps.includes(search["step"] as Step) ? search["step"] : "type") as Step,
  }),
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
  const { step } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const idx = steps.indexOf(step);
  const go = (s: Step) => navigate({ to: "/business/new", search: { step: s } });
  const taxonomy = useTaxonomy();
  const tx = taxonomy.options;
  const types = businessTypes(tx?.person_types ?? []);

  const [type, setType] = useState<string | null>(null);
  const [mapsUrl, setMapsUrl] = useState("");
  const [place, setPlace] = useState<MapsPlace | null>(null);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
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
  const isStudio = type === "studio";

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
    basics: Boolean(name.trim()) && usernameOk && usernameStatus !== "taken",
    location: Boolean(state) && !cityError && !pinError,
    offer: languages.length > 0,
    policies: policies.some((p) => p.trim()),
    amenities: true,
    equipment: true,
    review: Boolean(type && name.trim() && state && !cityError && !pinError && !mapsError),
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
      if (isStudio) go("amenities");
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
    if (step === "review") create.mutate();
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
      subtitle: "Pick the one that fits best, then add its Google Maps link.",
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
    offer: {
      group: "Details",
      title: "What does it offer?",
      subtitle: "Genres and languages you work in.",
      why: "These show on your page and help the right people find you.",
    },
    policies: {
      group: "Policies",
      title: "What are your rules?",
      subtitle: "Write your own or tap a suggestion. At least one.",
      why: "Customers see these on your page before they book or visit.",
    },
    review: {
      group: "Review",
      title: "Review your business",
      subtitle: "Tap a row to change it.",
      why: isStudio
        ? "Next you'll add amenities and equipment, with photos."
        : "You can edit all of this later from Manage.",
    },
    amenities: {
      group: "Amenities",
      title: "What does the place have?",
      subtitle: "Pick its amenities, then add a photo of each.",
      why: "Photos show customers it's real. You can add more later.",
    },
    equipment: {
      group: "Equipment",
      title: "What gear can people use?",
      subtitle: "Add each item: make and model, type, quantity, and included or extra.",
      why: "A photo of each item builds trust. You can add more later under Manage.",
    },
  };
  const c = copy[step];

  return (
    <>
      <StepShell
        step={idx + 1}
        total={isStudio ? steps.length : steps.length - AFTER_CREATE.length}
        group={c.group}
        title={c.title}
        subtitle={c.subtitle}
        why={c.why}
        onBack={() =>
          step === "amenities" ? finish() : idx > 0 ? go(steps[idx - 1]!) : router.history.back()
        }
        onSubmit={submit}
        footer={
          <Btn
            key={nudge}
            type="submit"
            loading={create.isPending}
            pending={!valid[step]}
            className={`w-full ${nudge ? "animate-shake" : ""}`}
          >
            {step === "review"
              ? "Create Business Profile"
              : step === "equipment"
                ? "Finish"
                : "Continue"}
          </Btn>
        }
      >
        {!tx ? (
          <StepSkeleton />
        ) : step === "type" ? (
          <div className="space-y-6">
            {/*
              The same picker a talent uses for their person type (owner, 29 Sep 2026). This was a
              hand-rolled grid of buttons with its own selected state, ring and hover colours —
              a second UI for the same question, and PersonTypePicker was already imported in this
              file. Picking a business type is picking a persona type; only the list differs.
            */}
            <PersonTypePicker
              groups={BUSINESS_GROUPS}
              options={types}
              selected={type ? [type] : []}
              icon={typeIcon}
              onToggle={(slug) => {
                haptic("select");
                setType(slug === type ? "" : slug);
              }}
            />

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
          </div>
        ) : step === "basics" ? (
          <div className="space-y-5 rounded-lg bg-card p-5 border border-border/80">
            <InlineField
              inputId="businessName"
              label="Business name"
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
          </div>
        ) : step === "location" ? (
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
                    className="flex h-13 w-full items-center rounded-full border border-input bg-card px-5 text-left text-sm text-muted-foreground opacity-60"
                  >
                    State first
                  </button>
                )}
              </DrawerField>
            </div>
            <InlineField
              inputId="pinCode"
              label="PIN code"
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
        ) : step === "offer" ? (
          <div className="space-y-5 rounded-lg bg-card p-5 border border-border/80">
            <DrawerField label="Genres">
              <ChipPicker
                options={(tx.genres ?? []).map((o) => ({ value: o.slug, label: o.label }))}
                selected={genres}
                onToggle={(v) =>
                  setGenres(genres.includes(v) ? genres.filter((g) => g !== v) : [...genres, v])
                }
              />
            </DrawerField>
            <DrawerField label="Languages supported">
              <ChipPicker
                options={(tx.languages ?? []).map((o) => ({ value: o.slug, label: o.label }))}
                selected={languages}
                onToggle={(v) =>
                  setLanguages(
                    languages.includes(v) ? languages.filter((l) => l !== v) : [...languages, v],
                  )
                }
              />
            </DrawerField>
          </div>
        ) : step === "policies" ? (
          <PoliciesEditor value={policies} onChange={setPolicies} />
        ) : step === "amenities" ? (
          <AmenitiesEditor />
        ) : step === "equipment" ? (
          <EquipmentEditor />
        ) : (
          <div className="space-y-3">
            <section className="rounded-lg bg-ink p-4 text-ink-foreground">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-1 text-ink-foreground/70">{typeLabel}</p>
                  <h2 className="mt-1 truncate text-2 font-semibold">{name}</h2>
                  <p className="mt-0.5 truncate text-sm text-ink-foreground/70">@{username}</p>
                </div>
                <span className="pill shrink-0 bg-card text-foreground">Preview</span>
              </div>
              {tagline.trim() ? (
                <p className="mt-3 line-clamp-2 text-sm text-ink-foreground/80">{tagline}</p>
              ) : null}
              <p className="mt-3 flex items-center gap-1.5 text-1 text-ink-foreground/70">
                <MapPin size={iconSize.sm} aria-hidden />
                {[city, state].filter(Boolean).join(", ")}
              </p>
            </section>
            {[
              {
                title: "Profile",
                to: "basics" as const,
                rows: [
                  ["Business type", typeLabel],
                  ["Name", name],
                  ["Username", `@${username}`],
                  ["Tagline", tagline.trim() || "Not added"],
                ],
              },
              {
                title: "Location",
                to: "location" as const,
                rows: [
                  ["Place", [city, state].filter(Boolean).join(", ")],
                  ["Google Maps", link ? "Connected" : "Not connected"],
                ],
              },
              {
                title: "What you offer",
                to: "offer" as const,
                rows: [
                  ["Genres", labelsOf(tx.genres, genres)],
                  ["Languages", labelsOf(tx.languages, languages)],
                ],
              },
              {
                title: "Policies",
                to: "policies" as const,
                rows: [
                  [
                    "Customer policies",
                    policies.filter((p) => p.trim()).length
                      ? policies.filter((p) => p.trim()).join(" · ")
                      : "Not added",
                  ],
                ],
              },
            ].map((group) => (
              <section
                key={group.title}
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => go(group.to)}
                  className="state-layer grid min-h-touch w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 text-left"
                >
                  <h2 className="text-sm font-semibold">{group.title}</h2>
                  <span className="flex items-center gap-1 text-1 font-semibold text-muted-foreground">
                    Edit <ChevronRight size={iconSize.sm} aria-hidden />
                  </span>
                </button>
                <dl className="divide-y divide-border">
                  {group.rows.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 px-4 py-2.5"
                    >
                      <dt className="text-1 text-muted-foreground">{label}</dt>
                      <dd className="line-clamp-2 text-sm font-medium text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
      </StepShell>

      <Dialog
        open={create.isSuccess && !isStudio}
        title="Business created"
        body="Add your hours and rates next."
        onClose={() => create.reset()}
      >
        <BtnLink to="/home" className="w-full">
          Open Business
        </BtnLink>
      </Dialog>
    </>
  );
}
