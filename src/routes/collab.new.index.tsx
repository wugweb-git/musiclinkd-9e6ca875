import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Disc3, Music2, Search, UserRoundPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, IconBtn } from "@/components/ml/ui";
import { Card, SegmentedField } from "@/components/ml/kit";
import { ListingStepFooter } from "@/components/ml/market";
import { DrawerList, DrawerOptionRow } from "@/components/ml/drawer-list";
import { Field, SheetMultiSelect, SheetSelect, inputClass } from "@/components/ml/listing-form";
import { PersonAvatar } from "@/components/ml/person-avatar";
import { useFieldErrors } from "@/components/ml/auth";
import { createCollab, getCollab, listProjectTypes } from "@/lib/collabs.functions";
import { searchPeople } from "@/lib/profile-groups.functions";
import { useAuth } from "@/hooks/use-auth";
import { labelFor, talentTypes, useTaxonomy } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";

/*
 * Start a collab. A band is a collab type (owner, 17 Sep 2026) with its own screens, so picking
 * Band opens Create a band (/bands/new). A project goes on here: the details, its plan (your
 * role, how you'll work, start and target dates, a budget only its people see), asking people
 * in with a role, then check and publish.
 */
type Kind = "band" | "project";

export const Route = createFileRoute("/collab/new/")({
  validateSearch: (s: Record<string, unknown>): { type?: Kind } =>
    s["type"] === "band" || s["type"] === "project" ? { type: s["type"] } : {},
  // A band has its own screens (2–9 Sep): creating one happens in Create a band.
  beforeLoad: ({ search }) => {
    if (search.type === "band") throw redirect({ to: "/bands/new", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Start a collab | MusicLinkd" },
      {
        name: "description",
        content:
          "Start a band or a project, set its plan, and invite the people making it with you.",
      },
      { property: "og:title", content: "Start a collab | MusicLinkd" },
      { property: "og:description", content: "Start a band or a project on MusicLinkd." },
    ],
  }),
  component: NewCollab,
});

type Invite = {
  id: string;
  username: string;
  name: string;
  photo: string | null;
  role: "member" | "admin";
  part: string;
};

type FieldName = "name" | "genres" | "city" | "dates" | "budget";

const standing = [
  { value: "member", label: "Member", hint: "Works on it with you" },
  { value: "admin", label: "Admin", hint: "Can also ask people in and change the plan" },
] as const;

const rupees = (digits: string) => (digits ? Number(digits).toLocaleString("en-IN") : "");

function NewCollab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signedIn } = useAuth();
  const { type } = Route.useSearch();
  const taxonomy = useTaxonomy().options;
  const create = useServerFn(createCollab);
  const readCollab = useServerFn(getCollab);
  const readTypes = useServerFn(listProjectTypes);
  const findPeople = useServerFn(searchPeople);
  const errors = useFieldErrors<FieldName>();

  const [kind, setKind] = useState<Kind | null>(type ?? null);
  const [step, setStep] = useState(type ? 1 : 0);
  const [name, setName] = useState("");
  const [projectType, setProjectType] = useState<string | null>(null);
  const [about, setAbout] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [who, setWho] = useState<"Only the people in it" | "Anyone on MusicLinkd">(
    "Only the people in it",
  );
  const [myRole, setMyRole] = useState<string | null>(null);
  const [workMode, setWorkMode] = useState<string | null>(null);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [budget, setBudget] = useState("");
  const [invites, setInvites] = useState<Invite[]>([]);
  const [query, setQuery] = useState("");
  const [term, setTerm] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setTerm(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  const types = useQuery({ queryKey: ["project-types"], queryFn: () => readTypes() });
  const people = useQuery({
    queryKey: ["people-search", term],
    queryFn: () => findPeople({ data: { q: term, limit: 8 } }),
    enabled: term.length >= 2,
  });

  const steps =
    kind === "band"
      ? (["Kind", "Details", "People", "Preview"] as const)
      : (["Kind", "Details", "Plan", "People", "Preview"] as const);
  const current = steps[step] ?? "Kind";
  const last = step === steps.length - 1;

  const problems: Record<FieldName, string | null> = {
    name: name.trim().length < 2 ? "Give it a name of at least 2 letters." : null,
    genres: kind === "band" && !genres.length ? "Pick at least one genre." : null,
    city: kind === "band" && city.trim().length < 2 ? "Add the city the band is based in." : null,
    dates:
      startsOn && endsOn && endsOn < startsOn ? "The target date comes after the start." : null,
    budget: budget && Number(budget.replace(/\D/g, "")) < 100 ? "Enter at least ₹100." : null,
  };
  const stepFields: Record<string, FieldName[]> = {
    Kind: [],
    Details: ["name", "genres", "city"],
    Plan: ["dates", "budget"],
    People: [],
    Preview: [],
  };
  const stepOk = (s: string) =>
    (s !== "Kind" || kind !== null) && (stepFields[s] ?? []).every((f) => !problems[f]);
  const err = (f: FieldName) => errors.errorFor(f, problems[f]);

  const roleOptions = talentTypes(taxonomy?.person_types ?? []).map((t) => ({
    value: t.label,
    label: t.label,
  }));
  const workOptions = (taxonomy?.work_modes ?? []).map((w) => ({
    value: w.slug,
    label: w.label,
  }));
  const genreOptions = (taxonomy?.genres ?? []).map((g) => ({ value: g.slug, label: g.label }));
  const kindLabel = projectType
    ? ((types.data ?? []).find((t) => t.slug === projectType)?.label ?? "")
    : "";

  const publish = useMutation({
    mutationFn: async () => {
      const budgetPaise = budget ? Number(budget.replace(/\D/g, "")) * 100 : undefined;
      const res = await create({
        data: {
          type: kind ?? "project",
          name: name.trim(),
          ...(about.trim() ? { bio: about.trim() } : {}),
          ...(city.trim() ? { city: city.trim() } : {}),
          visibility: kind === "band" || who === "Anyone on MusicLinkd" ? "public" : "private",
          ...(kind === "project" && projectType ? { projectType } : {}),
          ...(genres.length ? { genres } : {}),
          ...(kind === "project" && startsOn ? { startsOn } : {}),
          ...(kind === "project" && endsOn ? { endsOn } : {}),
          ...(kind === "project" && workMode ? { workMode } : {}),
          ...(myRole ? { myRole } : {}),
          ...(kind === "project" && budgetPaise !== undefined ? { budgetPaise } : {}),
          invites: invites.map((i) => ({
            username: i.username,
            role: i.role,
            ...(i.part.trim() ? { instrument: i.part.trim() } : {}),
          })),
        },
      });
      const slug =
        kind === "band" ? ((await readCollab({ data: { id: res.id } }))?.slug ?? null) : null;
      return { ...res, slug };
    },
    onSuccess: async ({ id, slug, invited, failed }) => {
      if (invites.length) {
        toast(
          failed.length
            ? `${invited} of ${invites.length} asked in. ${failed.map((f) => `@${f.username}: ${f.reason}`).join(" ")}`
            : `${invited} ${invited === 1 ? "person" : "people"} asked in`,
        );
      }
      await queryClient.invalidateQueries({ queryKey: ["collabs", "mine"] });
      if (kind === "band" && slug) void navigate({ to: "/bands/$id", params: { id: slug } });
      else void navigate({ to: "/collab/$id", params: { id } });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  function next() {
    errors.submitted();
    if (!stepOk(current)) return;
    errors.reset();
    if (last) publish.mutate();
    else setStep(step + 1);
  }

  function addPerson(p: { id: string; username: string; name: string; avatarUrl: string | null }) {
    if (invites.some((i) => i.id === p.id)) return;
    setInvites((all) => [
      ...all,
      {
        id: p.id,
        username: p.username,
        name: p.name,
        photo: p.avatarUrl,
        role: "member",
        part: "",
      },
    ]);
    setQuery("");
  }

  const patchInvite = (id: string, patch: Partial<Invite>) =>
    setInvites((all) => all.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const title =
    kind === "band" ? "Start a band" : kind === "project" ? "Start a project" : "Start a collab";

  return (
    <Screen>
      <TopBar
        title={title}
        subtitle={`Step ${step + 1} of ${steps.length} · ${current}`}
        back="/collab"
      />
      <div className="px-5 pt-4">
        <div className="mb-5 flex gap-1.5" aria-hidden>
          {steps.map((l, i) => (
            <span
              key={l}
              className="h-1 flex-1 rounded-full"
              style={{ background: i <= step ? "var(--primary)" : "var(--border)" }}
            />
          ))}
        </div>

        {current === "Kind" ? (
          <DrawerList label="What you are starting">
            <DrawerOptionRow
              option={{
                value: "project",
                label: "Project",
                hint: "One piece of work — a single, an EP, a film score — that ends",
                icon: Disc3,
              }}
              selected={kind === "project"}
              onClick={() => setKind("project")}
            />
            <DrawerOptionRow
              option={{
                value: "band",
                label: "Band",
                hint: "An ongoing group of talent, with a public band page",
                icon: Music2,
              }}
              selected={kind === "band"}
              onClick={() => void navigate({ to: "/bands/new" })}
            />
          </DrawerList>
        ) : null}

        {current === "Details" ? (
          <div className="space-y-5">
            <Field
              label={kind === "band" ? "Band name" : "Project name"}
              id="collab-name"
              error={err("name")}
              {...(kind === "band"
                ? { hint: "The band name appears in Discover, Search and on shared QR cards." }
                : {})}
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => errors.touch("name")}
                placeholder={kind === "band" ? "The Kite Notes" : "Monsoon EP"}
                maxLength={80}
                aria-labelledby="collab-name"
                aria-invalid={Boolean(err("name"))}
                className={inputClass}
              />
            </Field>
            {kind === "project" ? (
              <Field label="What kind (optional)" id="collab-kind">
                <SheetSelect
                  title="What kind"
                  value={projectType}
                  options={(types.data ?? []).map((t) => ({ value: t.slug, label: t.label }))}
                  onChange={setProjectType}
                  placeholder="Song, EP, film score…"
                />
              </Field>
            ) : null}
            <Field
              label={kind === "band" ? "One-line description" : "What it is"}
              id="collab-about"
            >
              <textarea
                rows={3}
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder={
                  kind === "band"
                    ? "Indie-folk quartet with a brass habit"
                    : "Four tracks, live drums, tracking in Bengaluru over the winter."
                }
                maxLength={2000}
                aria-labelledby="collab-about"
                className="w-full resize-none rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
              />
            </Field>
            <Field
              label={kind === "band" ? "Genres" : "Genres (optional)"}
              id="collab-genres"
              hint="Up to 5"
              error={err("genres")}
            >
              <SheetMultiSelect
                title="Genres"
                value={genres}
                options={genreOptions}
                onChange={(v) => {
                  setGenres(v);
                  errors.touch("genres");
                }}
                placeholder="Pick genres"
                max={5}
              />
            </Field>
            <Field
              label={kind === "band" ? "Base city" : "Where (optional)"}
              id="collab-city"
              error={err("city")}
            >
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={() => errors.touch("city")}
                placeholder="Mumbai"
                maxLength={80}
                aria-labelledby="collab-city"
                aria-invalid={Boolean(err("city"))}
                className={inputClass}
              />
            </Field>
            {kind === "project" ? (
              <Field label="Who can see it" id="collab-who">
                <SegmentedField
                  label="Who can see it"
                  value={who}
                  options={["Only the people in it", "Anyone on MusicLinkd"] as const}
                  onChange={setWho}
                />
              </Field>
            ) : null}
          </div>
        ) : null}

        {current === "Plan" ? (
          <div className="space-y-5">
            <Field label="Your role (optional)" id="collab-role" hint="What you do in it">
              <SheetSelect
                title="Your role"
                value={myRole}
                options={roleOptions}
                onChange={setMyRole}
                placeholder="Producer, vocalist…"
                searchable
              />
            </Field>
            <Field label="How you'll work (optional)" id="collab-mode">
              <SheetSelect
                title="How you'll work"
                value={workMode}
                options={workOptions}
                onChange={setWorkMode}
                placeholder="Remote, in person…"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts (optional)" id="collab-starts">
                <input
                  type="date"
                  value={startsOn}
                  onChange={(e) => {
                    setStartsOn(e.target.value);
                    errors.touch("dates");
                  }}
                  aria-labelledby="collab-starts"
                  className={inputClass}
                />
              </Field>
              <Field label="Target (optional)" id="collab-ends" error={err("dates")}>
                <input
                  type="date"
                  value={endsOn}
                  min={startsOn || undefined}
                  onChange={(e) => {
                    setEndsOn(e.target.value);
                    errors.touch("dates");
                  }}
                  aria-labelledby="collab-ends"
                  aria-invalid={Boolean(err("dates"))}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field
              label="Budget (optional)"
              id="collab-budget"
              hint="Only the people in the project see this."
              error={err("budget")}
            >
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  ₹
                </span>
                <input
                  value={rupees(budget)}
                  onChange={(e) => setBudget(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  onBlur={() => errors.touch("budget")}
                  inputMode="numeric"
                  placeholder="1,80,000"
                  aria-labelledby="collab-budget"
                  aria-invalid={Boolean(err("budget"))}
                  className={`${inputClass} pl-9`}
                />
              </div>
            </Field>
          </div>
        ) : null}

        {current === "People" ? (
          <div className="space-y-5">
            <Field
              label="Ask people in (optional)"
              id="collab-people"
              hint="They're asked, and join once they say yes. You can ask more later."
            >
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2"
                  aria-hidden
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name, @username, role or city"
                  aria-labelledby="collab-people"
                  className={`${inputClass} pl-12`}
                />
              </div>
            </Field>
            {term.length >= 2 ? (
              <DrawerList
                label="People"
                empty={
                  people.isLoading ? "Searching…" : "No one matches that. Try a name or @username."
                }
              >
                {(people.data?.people ?? [])
                  .filter((p) => !invites.some((i) => i.id === p.id))
                  .map((p) => (
                    <DrawerOptionRow
                      key={p.id}
                      option={{
                        value: p.id,
                        label: p.name,
                        hint: joinParts(`@${p.username}`, p.headline ?? "", p.city ?? ""),
                        iconNode: (
                          <PersonAvatar
                            name={p.name}
                            photo={p.avatarUrl}
                            className="h-10 w-10 text-1"
                          />
                        ),
                      }}
                      onClick={() => addPerson(p)}
                    />
                  ))}
              </DrawerList>
            ) : null}

            {invites.length ? (
              <section className="space-y-3">
                <h2 className="text-sm">
                  {invites.length} {invites.length === 1 ? "person" : "people"} to ask
                </h2>
                {invites.map((i) => (
                  <Card key={i.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={i.name} photo={i.photo} className="h-10 w-10 text-1" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{i.name}</span>
                        <span className="block truncate text-1 text-muted-foreground">
                          @{i.username}
                        </span>
                      </span>
                      <IconBtn
                        label={`Remove ${i.name}`}
                        variant="plain"
                        onClick={() => setInvites((all) => all.filter((x) => x.id !== i.id))}
                      >
                        <X size={iconSize.md} aria-hidden />
                      </IconBtn>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <SheetSelect
                        title={`${i.name.split(" ")[0]} joins as`}
                        value={i.role}
                        options={standing}
                        onChange={(v) => patchInvite(i.id, { role: v as Invite["role"] })}
                        placeholder="Member"
                      />
                      <input
                        value={i.part}
                        onChange={(e) => patchInvite(i.id, { part: e.target.value })}
                        placeholder={kind === "band" ? "Drums" : "Mixing"}
                        maxLength={80}
                        aria-label={`${i.name}'s part`}
                        className={inputClass}
                      />
                    </div>
                  </Card>
                ))}
              </section>
            ) : term.length < 2 ? (
              <p className="flex items-center gap-2 text-1 text-muted-foreground">
                <UserRoundPlus size={iconSize.sm} aria-hidden />
                Search to add people, or skip this step.
              </p>
            ) : null}
          </div>
        ) : null}

        {current === "Preview" ? (
          <Card className="space-y-3">
            <p className="text-1 text-muted-foreground">
              {joinParts(
                kind === "band" ? "Band" : kindLabel || "Project",
                kind === "band" || who === "Anyone on MusicLinkd" ? "Public" : "Private",
                city.trim(),
              )}
            </p>
            <h2 className="text-3 leading-tight">{name.trim() || "Untitled"}</h2>
            {about.trim() ? <p className="text-1 text-muted-foreground">{about.trim()}</p> : null}
            {genres.length ? (
              <p className="text-1">
                {genres.map((g) => labelFor(taxonomy?.genres, g)).join(" · ")}
              </p>
            ) : null}
            {kind === "project" ? (
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-1">
                <dt className="text-muted-foreground">Your role</dt>
                <dd>{myRole ?? "—"}</dd>
                <dt className="text-muted-foreground">How you'll work</dt>
                <dd>{workMode ? labelFor(taxonomy?.work_modes, workMode) : "—"}</dd>
                <dt className="text-muted-foreground">Dates</dt>
                <dd>{joinParts(startsOn || "", endsOn ? `→ ${endsOn}` : "") || "—"}</dd>
                <dt className="text-muted-foreground">Budget</dt>
                <dd>{budget ? `₹${rupees(budget)} · people in it only` : "—"}</dd>
              </dl>
            ) : null}
            <p className="text-1 text-muted-foreground">
              {invites.length
                ? `${invites.length} ${invites.length === 1 ? "person" : "people"} will be asked in`
                : "No one asked in yet"}
            </p>
          </Card>
        ) : null}
      </div>

      <div className="px-5 py-6">
        <ListingStepFooter
          step={step}
          last={last}
          onCancel={() => void navigate({ to: "/collab" })}
          onBack={() => setStep(step - 1)}
          onNext={next}
          disabled={!signedIn || (current === "Kind" && !kind)}
          busy={publish.isPending}
          publishLabel={kind === "band" ? "Publish band" : "Start project"}
        />
      </div>
    </Screen>
  );
}
