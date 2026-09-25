import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Field as SharedField, SheetSelect } from "@/components/ml/listing-form";
import { Screen, TopBar } from "@/components/ml/ui";
import { StepDots, StickyBar } from "@/components/ml/booking";
import { CalendarGate, useBookingDraft } from "@/components/ml/booking-context";
import { inr } from "@/lib/price";
import type { ReactNode } from "react";

export const Route = createFileRoute("/booking/$id/details")({
  head: () => ({
    meta: [
      { title: "Session details — MusicLinkd booking" },
      {
        name: "description",
        content:
          "Tell the provider what the session is for, how many people are coming and anything they should prepare.",
      },
      { property: "og:title", content: "Session details — MusicLinkd booking" },
      {
        property: "og:description",
        content: "Purpose, headcount and requirements for your session.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DetailsStep,
});

function DetailsStep() {
  return (
    <CalendarGate>
      <Details />
    </CalendarGate>
  );
}

function Details() {
  const { bookable: b, resource: r, draft, set, price } = useBookingDraft();
  const navigate = useNavigate();

  return (
    <Screen className="pb-nav-clear">
      <TopBar
        title="Session details"
        subtitle={draft.purpose || b.name}
        back={`/booking/${b.id}/schedule`}
      />
      <main className="px-5 pt-4">
        <StepDots step={3} total={5} />
        <p className="mt-3 text-sm text-muted-foreground">
          Only what the provider needs to prepare the room. Your contact details come from your
          profile.
        </p>

        <div className="mt-5 space-y-4">
          <Field label="What's the session for?">
            {/* The studio's own services, from the database; "Other" when none fits. */}
            <SheetSelect
              title="What's the session for?"
              value={draft.purpose || null}
              options={[
                ...(b.services ?? []).map((sv) => ({
                  value: sv.name,
                  label: sv.name,
                  hint: sv.price_paise
                    ? `From ₹${(sv.price_paise / 100).toLocaleString("en-IN")}${sv.price_unit ? ` / ${sv.price_unit}` : ""}`
                    : undefined,
                })),
                { value: "Other", label: "Other", hint: "Say what you need in the notes" },
              ]}
              placeholder="Choose a service"
              onChange={(v) => set({ purpose: v })}
            />
          </Field>

          <Field label="Project name" hint="Optional — helps the engineer label files">
            <input
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="e.g. Monsoon EP"
              className="min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm"
            />
          </Field>

          <Field label="Number of people">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Fewer people"
                onClick={() => set({ people: Math.max(1, draft.people - 1) })}
                className="h-12 w-12 rounded-full border border-border bg-card text-2"
              >
                −
              </button>
              <span className="min-w-8 text-center text-2 font-semibold">{draft.people}</span>
              <button
                type="button"
                aria-label="More people"
                onClick={() => set({ people: Math.min(r.capacity, draft.people + 1) })}
                className="h-12 w-12 rounded-full border border-border bg-card text-2"
              >
                +
              </button>
              <span className="text-1 text-muted-foreground">Room capacity {r.capacity}</span>
            </div>
          </Field>

          <Field label="Anything the provider should prepare?" hint="Optional">
            <textarea
              value={draft.requirements}
              onChange={(e) => set({ requirements: e.target.value })}
              rows={4}
              placeholder="Backline changes, extra mics, load-in timing…"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm"
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
    </Screen>
  );
}

/**
 * The shared field wrapper, with an id derived from its label. This was a copy that gave the
 * label no association with its control at all, so a screen reader read the two apart.
 */
function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const id = `booking-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return (
    <SharedField label={label} id={id} {...(hint ? { hint } : {})}>
      {children}
    </SharedField>
  );
}
