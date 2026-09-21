import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, Dialog } from "@/components/ml/kit";
import { businessTypes, type BusinessType } from "@/data/business";
import { createMyBusiness } from "@/lib/profile-groups.functions";

// Spaces is deferred (owner, 21 Sep 2026): a business starts with one space, and rooms are added
// after it exists.
const steps = ["type", "basics", "location", "team", "review"] as const;
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
        content: "Set up a studio, label, venue or agency with its own team, spaces and bookings.",
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

function NewBusiness() {
  const { step } = Route.useSearch();
  const navigate = useNavigate();
  const idx = steps.indexOf(step);
  const go = (s: Step) => navigate({ to: "/business/new", search: { step: s } });

  const [type, setType] = useState<BusinessType>("studio");
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [address, setAddress] = useState("");
  const [invites, setInvites] = useState("");
  const queryClient = useQueryClient();
  const save = useServerFn(createMyBusiness);
  const create = useMutation({
    mutationFn: () =>
      save({
        data: {
          type,
          name,
          city,
          ...(tagline.trim() ? { tagline } : {}),
          ...(address.trim() ? { address } : {}),
        },
      }),
    onSuccess: () => queryClient.invalidateQueries(),
    onError: () => toast.error("That didn't save. Try again."),
  });
  const created = create.isSuccess;

  return (
    <Screen bottomNav={false}>
      <TopBar
        title="Create business"
        subtitle={`Step ${idx + 1} of ${steps.length}`}
        back="/business"
      />

      <div className="px-5 pt-3">
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-background"}`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4 px-5 pt-5 pb-8">
        {step === "type" ? (
          <Card className="space-y-3">
            <h1 className="text-2 font-bold">What kind of business?</h1>
            <div className="space-y-2">
              {businessTypes.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left ${
                    type === t.key ? "border-foreground bg-subtle" : "border-transparent bg-subtle"
                  }`}
                >
                  <span aria-hidden className="text-3">
                    {t.emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-1 font-semibold">{t.label}</span>
                    <span className="block text-1 text-muted-foreground">{t.blurb}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        ) : null}

        {step === "basics" ? (
          <Card className="space-y-3">
            <h1 className="text-2 font-bold">Name and one line</h1>
            <Field
              label="Business name"
              value={name}
              onChange={setName}
              placeholder="Soundhouse Bandra"
            />
            <Field
              label="Tagline"
              value={tagline}
              onChange={setTagline}
              placeholder="Two rooms, one tape machine."
            />
            <p className="text-1 text-muted-foreground">
              This is a separate profile — your personal profile stays exactly as it is.
            </p>
          </Card>
        ) : null}

        {step === "location" ? (
          <Card className="space-y-3">
            <h1 className="text-2 font-bold">Where is it?</h1>
            <div className="flex flex-wrap gap-2">
              {["Mumbai", "Delhi", "Bengaluru", "Chennai", "Pune", "Kolkata"].map((c) => (
                <Chip key={c} active={city === c} onClick={() => setCity(c)}>
                  {c}
                </Chip>
              ))}
            </div>
            <Field
              label="Address"
              value={address}
              onChange={setAddress}
              placeholder="Street, area, pin code"
            />
            <p className="text-1 text-muted-foreground">
              The exact address is only shown once a booking is confirmed.
            </p>
          </Card>
        ) : null}

        {step === "team" ? (
          <Card className="space-y-3">
            <h1 className="text-2 font-bold">Invite your team</h1>
            <Field
              label="Emails or @usernames"
              value={invites}
              onChange={setInvites}
              placeholder="@kabir, farah@studio.in"
            />
            <p className="text-1 text-muted-foreground">
              Managers can edit and accept bookings. Engineers only see sessions assigned to them.
            </p>
          </Card>
        ) : null}

        {step === "review" ? (
          <Card className="space-y-2">
            <h1 className="text-2 font-bold">Review</h1>
            {[
              ["Type", businessTypes.find((t) => t.key === type)?.label ?? ""],
              ["Name", name || "Untitled business"],
              ["City", city],
              ["Invites", invites || "None yet"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-b border-border py-2 last:border-0"
              >
                <span className="pill bg-background text-muted-foreground">{k}</span>
                <span className="max-w-[60%] text-right text-1 font-semibold">{v}</span>
              </div>
            ))}
            <p className="pt-1 text-1 text-muted-foreground">
              Business verification is a separate step and unlocks the verified badge.
            </p>
          </Card>
        ) : null}

        <div className="flex gap-2">
          {idx > 0 ? (
            <Btn variant="outline" className="flex-1" onClick={() => go(steps[idx - 1]!)}>
              Back
            </Btn>
          ) : null}
          {idx < steps.length - 1 ? (
            <Btn className="flex-1" onClick={() => go(steps[idx + 1]!)}>
              Continue
            </Btn>
          ) : (
            <Btn
              className="flex-1"
              disabled={!name.trim()}
              loading={create.isPending}
              onClick={() => create.mutate()}
            >
              Create Business
            </Btn>
          )}
        </div>
      </div>

      <Dialog
        open={created}
        title="Business created"
        body="Add spaces and rates next, then request business verification to get the badge."
        onClose={() => create.reset()}
      >
        <div className="space-y-2">
          <BtnLink to="/business" className="w-full">
            Open Business
          </BtnLink>
          <BtnLink to="/verification/choose" variant="ghost" className="w-full">
            Verify This Business
          </BtnLink>
        </div>
      </Dialog>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="pill bg-background text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? ""}
        className="mt-1.5 min-h-control w-full rounded-lg border border-border bg-background px-3 text-1 outline-none focus:border-primary"
      />
    </label>
  );
}
