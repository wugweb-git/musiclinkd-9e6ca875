import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { collabTypeCopy } from "@/data/collab-types";
import { isCollabType, type CollabType } from "@/lib/collab-types";
import { useState, type ComponentProps } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, Meter, Row, Dialog } from "@/components/ml/kit";
import { bandCreationSteps } from "@/data/band";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { CityField } from "@/components/ml/listing-form";
import { InlineField } from "@/components/ml/onboarding";
import { createCollab, getCollab, addCollabMember } from "@/lib/collabs.functions";

export const Route = createFileRoute("/bands/new")({
  // Which collaboration type to create (queue item 7); a band unless said otherwise.
  validateSearch: (s: Record<string, unknown>): { type?: CollabType } =>
    isCollabType(s["type"]) ? { type: s["type"] } : {},
  head: () => ({
    meta: [
      { title: "Create a Band | MusicLinkd" },
      {
        name: "description",
        content: "Create a band profile, set the line-up and invite members on MusicLinkd.",
      },
      { property: "og:title", content: "Create a Band | MusicLinkd" },
      { property: "og:description", content: "Create a band profile and invite your line-up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateBand,
});

function CreateBand() {
  const navigate = useNavigate();
  const type: CollabType = Route.useSearch().type ?? "band";
  const label = collabTypeCopy[type].label;
  const noun = label.toLowerCase();
  const article = /^[aeiou]/.test(noun) ? "an" : "a";
  // Genres are the taxonomy's (taxonomy_options, category genres); the band stores their slugs.
  const genreOptions = useTaxonomy().options?.genres ?? [];
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [invites, setInvites] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [done, setDone] = useState(false);
  const [bandSlug, setBandSlug] = useState<string | null>(null);

  const create = useServerFn(createCollab);
  const readCollab = useServerFn(getCollab);
  const invite = useServerFn(addCollabMember);

  const publish = useMutation({
    mutationFn: async () => {
      const { id } = await create({
        data: {
          name: name.trim(),
          ...(tagline.trim() ? { bio: tagline.trim() } : {}),
          ...(city.trim() ? { city: city.trim() } : {}),
          visibility: "public",
          type,
          ...(genres.length ? { genres } : {}),
        },
      });
      const collab = await readCollab({ data: { id } });
      let invited = 0;
      for (const raw of invites) {
        const username = raw.trim().replace(/^@/, "");
        if (!username) continue;
        try {
          await invite({ data: { id, username } });
          invited++;
        } catch {
          // Left out of the count — shown to the owner as "N of M invited".
        }
      }
      return { slug: collab?.slug ?? id, invited, total: invites.length };
    },
    onSuccess: ({ slug, invited, total }) => {
      setBandSlug(slug);
      setDone(true);
      if (total > 0) toast(`${invited} of ${total} invited`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  const current = bandCreationSteps[step]!;
  const canContinue =
    (current === "Identity" && name.trim().length > 1) ||
    (current === "Genre & city" && city.trim().length > 1 && genres.length > 0) ||
    current === "Members" ||
    current === "Preview";

  return (
    <Screen bottomNav={false}>
      <TopBar
        title={`Create ${article} ${noun}`}
        subtitle={`Step ${step + 1} of ${bandCreationSteps.length} · ${current}`}
        back="/bands"
      />
      <div className="space-y-4 px-5 pt-4">
        <Meter
          label="Setup"
          value={step + 1}
          max={bandCreationSteps.length}
          hint={`${step + 1}/${bandCreationSteps.length}`}
        />

        {current === "Identity" ? (
          <Card className="space-y-4">
            <Field
              label={`${label} name`}
              value={name}
              onChange={setName}
              placeholder="The Kite Notes"
            />
            <Field
              label="One-line description"
              value={tagline}
              onChange={setTagline}
              placeholder="Indie-folk quartet with a brass habit"
            />
            <p className="text-1 text-muted-foreground">
              The name appears in Discover, Search and on shared QR cards.
            </p>
          </Card>
        ) : null}

        {current === "Genre & city" ? (
          <Card className="space-y-4">
            <CityField id="band-city" label="Base city" value={city} onChange={setCity} />
            <div>
              <p className="text-1 font-semibold">Genres</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {genreOptions.map((g) => (
                  <Chip
                    key={g.slug}
                    active={genres.includes(g.slug)}
                    onClick={() =>
                      setGenres((p) =>
                        p.includes(g.slug) ? p.filter((x) => x !== g.slug) : [...p, g.slug],
                      )
                    }
                  >
                    {g.label}
                  </Chip>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {current === "Members" ? (
          <Card className="space-y-4">
            <Field
              label="Invite by MusicLinkd handle"
              value={inviteInput}
              onChange={setInviteInput}
              placeholder="@meher.kaur"
            />
            <Btn
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!inviteInput.trim()) return;
                setInvites((p) => [...p, inviteInput.trim()]);
                setInviteInput("");
              }}
            >
              Add to Invite List
            </Btn>
            {invites.length ? (
              <div className="space-y-2">
                {invites.map((i) => (
                  <Row
                    key={i}
                    title={i}
                    subtitle="Invitation will be sent on publish"
                    right={
                      <span className="text-1 font-semibold text-muted-foreground">Pending</span>
                    }
                  />
                ))}
              </div>
            ) : (
              <p className="text-1 text-muted-foreground">
                You can skip this and invite people later from Manage band.
              </p>
            )}
          </Card>
        ) : null}

        {current === "Preview" ? (
          <Card className="space-y-3">
            <h2 className="text-3 leading-tight">{name || `Untitled ${noun}`}</h2>
            <p className="text-1 text-muted-foreground">{tagline || "No description yet"}</p>
            <p className="text-1 text-muted-foreground">
              {[genres.map((g) => labelFor(genreOptions, g)).join(" · "), city]
                .filter(Boolean)
                .join(" · ") || "No genre or city set"}
            </p>
            <p className="text-1 text-muted-foreground">
              {invites.length} invitation{invites.length === 1 ? "" : "s"} will be sent
            </p>
          </Card>
        ) : null}

        <div className="flex gap-2 pb-6">
          {step > 0 ? (
            <Btn variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
              Back
            </Btn>
          ) : null}
          {current === "Preview" ? (
            <Btn
              className="flex-1"
              disabled={publish.isPending}
              onClick={() => !publish.isPending && publish.mutate()}
            >
              {publish.isPending ? "Publishing…" : "Publish Band"}
            </Btn>
          ) : (
            <Btn className="flex-1" onClick={() => canContinue && setStep((s) => s + 1)}>
              {canContinue ? "Continue" : "Fill required fields"}
            </Btn>
          )}
        </div>
      </div>

      <Dialog
        open={done}
        title={`${label} created`}
        body="Your band profile is live and invitations are on their way."
        onClose={() => setDone(false)}
      >
        <Btn
          disabled={!bandSlug}
          onClick={() => bandSlug && navigate({ to: "/bands/$id", params: { id: bandSlug } })}
        >
          Open Band Profile
        </Btn>
        <BtnLink to="/bands" variant="outline" className="w-full">
          Back to Bands
        </BtnLink>
      </Dialog>
    </Screen>
  );
}

/** The shared field, with an id from its label. Was a third styled copy of the same input. */
function Field({
  inputId,
  ...props
}: Omit<ComponentProps<typeof InlineField>, "inputId"> & { inputId?: string }) {
  const id = inputId ?? `band-${props.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <InlineField {...props} inputId={id} />;
}
