import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { TopBar } from "@/components/ml/ui";
import { StepDots, StickyBar } from "@/components/ml/booking";
import { useBookingDraft } from "@/components/ml/booking-context";
import { inr } from "@/data/booking";

export const Route = createFileRoute("/booking/$id/details")({
  head: () => ({
    meta: [
      { title: "Session details — MusicLinkd booking" },
      {
        name: "description",
        content: "Tell the provider what the session is for, how many people are coming and anything they should prepare.",
      },
      { property: "og:title", content: "Session details — MusicLinkd booking" },
      { property: "og:description", content: "Purpose, headcount and requirements for your session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Details,
});

function Details() {
  const { bookable: b, resource: r, draft, set, price } = useBookingDraft();
  const navigate = useNavigate();

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-32">
      <TopBar title="Session details" subtitle={r.name} back={`/booking/${b.id}/schedule`} />
      <main className="px-5 pt-4">
        <StepDots step={3} total={5} />
        <p className="mt-3 text-sm text-muted-foreground">
          Only what the provider needs to prepare the room. Your contact details come from your profile.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="What's the session for?">
            <select
              value={draft.purpose}
              onChange={(e) => set({ purpose: e.target.value })}
              className="min-h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm"
            >
              <option value="">Select a purpose</option>
              <option>Tracking — band</option>
              <option>Tracking — vocals</option>
              <option>Mixing session</option>
              <option>Mastering</option>
              <option>Rehearsal</option>
              <option>Podcast episode</option>
              <option>Other</option>
            </select>
          </Field>

          <Field label="Project name" hint="Optional — helps the engineer label files">
            <input
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="e.g. Monsoon EP"
              className="min-h-12 w-full rounded-2xl border border-border bg-card px-4 text-sm"
            />
          </Field>

          <Field label="Number of people">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer people"
                onClick={() => set({ people: Math.max(1, draft.people - 1) })}
                className="h-12 w-12 rounded-full border border-border bg-card text-lg"
              >
                −
              </button>
              <span className="min-w-8 text-center text-lg font-semibold">{draft.people}</span>
              <button
                type="button"
                aria-label="More people"
                onClick={() => set({ people: Math.min(r.capacity, draft.people + 1) })}
                className="h-12 w-12 rounded-full border border-border bg-card text-lg"
              >
                +
              </button>
              <span className="text-xs text-muted-foreground">Room capacity {r.capacity}</span>
            </div>
          </Field>

          <Field label="Anything the provider should prepare?" hint="Optional">
            <textarea
              value={draft.requirements}
              onChange={(e) => set({ requirements: e.target.value })}
              rows={4}
              placeholder="Backline changes, extra mics, load-in timing…"
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm"
            />
          </Field>
        </div>
      </main>

      <StickyBar
        price={inr(price.total)}
        hint="Add equipment next"
        primaryLabel="Continue"
        onPrimary={() => navigate({ to: "/booking/$id/addons", params: { id: b.id } })}
      />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {hint ? <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span> : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
