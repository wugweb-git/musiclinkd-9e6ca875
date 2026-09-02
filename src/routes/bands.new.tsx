import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, Meter, Row, Dialog } from "@/components/ml/kit";
import { bandCreationSteps, myBandId } from "@/data/band";

export const Route = createFileRoute("/bands/new")({
  head: () => ({
    meta: [
      { title: "Create a Band | MusicLinkd" },
      { name: "description", content: "Create a band profile, set the line-up and invite members on MusicLinkd." },
      { property: "og:title", content: "Create a Band | MusicLinkd" },
      { property: "og:description", content: "Create a band profile and invite your line-up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateBand,
});

const genreOptions = ["Indie Folk", "Alt Pop", "Electronic", "Hip Hop", "Jazz", "Metal", "Carnatic Fusion"];

function CreateBand() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [invites, setInvites] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState("");
  const [done, setDone] = useState(false);

  const current = bandCreationSteps[step]!;
  const canContinue =
    (current === "Identity" && name.trim().length > 1) ||
    (current === "Genre & city" && city.trim().length > 1 && genres.length > 0) ||
    current === "Members" ||
    current === "Preview";

  return (
    <Screen bottomNav={false}>
      <TopBar title="Create a band" subtitle={`Step ${step + 1} of ${bandCreationSteps.length} · ${current}`} back="/bands" />
      <div className="space-y-4 px-5 pt-4">
        <Meter label="Setup" value={step + 1} max={bandCreationSteps.length} hint={`${step + 1}/${bandCreationSteps.length}`} />

        {current === "Identity" ? (
          <Card className="space-y-4">
            <Field label="Band name" value={name} onChange={setName} placeholder="The Kite Notes" />
            <Field label="One-line description" value={tagline} onChange={setTagline} placeholder="Indie-folk quartet with a brass habit" />
            <p className="text-[12px] text-muted-foreground">The band name appears in Discover, Search and on shared QR cards.</p>
          </Card>
        ) : null}

        {current === "Genre & city" ? (
          <Card className="space-y-4">
            <Field label="Base city" value={city} onChange={setCity} placeholder="Mumbai" />
            <div>
              <p className="text-[13px] font-semibold">Genres</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {genreOptions.map((g) => (
                  <Chip key={g} active={genres.includes(g)} onClick={() => setGenres((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]))}>{g}</Chip>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {current === "Members" ? (
          <Card className="space-y-4">
            <Field label="Invite by name or MusicLinkd handle" value={inviteInput} onChange={setInviteInput} placeholder="@meher-kaur" />
            <Btn
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!inviteInput.trim()) return;
                setInvites((p) => [...p, inviteInput.trim()]);
                setInviteInput("");
              }}
            >
              Add to invite list
            </Btn>
            {invites.length ? (
              <div className="space-y-2">
                {invites.map((i) => <Row key={i} title={i} subtitle="Invitation will be sent on publish" right={<span className="text-[11px] font-semibold text-muted-foreground">Pending</span>} />)}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">You can skip this and invite people later from Manage band.</p>
            )}
          </Card>
        ) : null}

        {current === "Preview" ? (
          <Card className="space-y-3">
            <h2 className="text-[19px] leading-tight">{name || "Untitled band"}</h2>
            <p className="text-[13px] text-text2">{tagline || "No description yet"}</p>
            <p className="text-[12px] text-muted-foreground">{[genres.join(" · "), city].filter(Boolean).join(" · ") || "No genre or city set"}</p>
            <p className="text-[12px] text-muted-foreground">{invites.length} invitation{invites.length === 1 ? "" : "s"} will be sent</p>
          </Card>
        ) : null}

        <div className="flex gap-2 pb-6">
          {step > 0 ? <Btn variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>Back</Btn> : null}
          {current === "Preview" ? (
            <Btn className="flex-1" onClick={() => setDone(true)}>Publish band</Btn>
          ) : (
            <Btn className="flex-1" onClick={() => canContinue && setStep((s) => s + 1)}>{canContinue ? "Continue" : "Fill required fields"}</Btn>
          )}
        </div>
      </div>

      <Dialog open={done} title="Band created" body="Your band profile is live and invitations are on their way." onClose={() => setDone(false)}>
        <Btn onClick={() => navigate({ to: "/bands/$id", params: { id: myBandId } })}>Open band profile</Btn>
        <Link to="/bands"><Btn variant="outline" className="w-full">Back to bands</Btn></Link>
      </Dialog>
    </Screen>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
