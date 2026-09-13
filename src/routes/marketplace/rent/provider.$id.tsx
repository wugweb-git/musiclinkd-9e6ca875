import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, BtnLink, Chip, VerifiedBadge } from "@/components/ml/ui";
import { EmptyState, Rating } from "@/components/ml/market";
import { EquipmentRow, RentalReportSheet } from "@/components/ml/rental";
import { equipmentByProvider, providerById, rentalReviews } from "@/data/rentals";

export const Route = createFileRoute("/marketplace/rent/provider/$id")({
  head: ({ params }) => {
    const p = providerById(params.id);
    const title = p ? `${p.name} — Rental Provider | MusicLinkd` : "Provider | MusicLinkd";
    const desc = p
      ? `${p.role} in ${p.location}. ${p.completedRentals} completed rentals, ${p.rating}★ from ${p.reviews} reviews.`
      : "Rental provider on MusicLinkd.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: ProviderProfile,
});

const tabs = ["Equipment", "Reviews", "About"];

function ProviderProfile() {
  const { id } = Route.useParams();
  const p = providerById(id);
  const [tab, setTab] = useState(tabs[0]!);
  const [report, setReport] = useState(false);

  if (!p) {
    return (
      <Screen>
        <TopBar title="Provider unavailable" back="/marketplace/rent" />
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">
          This provider is no longer on MusicLinkd.
        </p>
      </Screen>
    );
  }

  const items = equipmentByProvider(p.id);

  return (
    <Screen>
      <TopBar title="Provider" back="/marketplace/rent" />

      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <img src={p.photo} alt={p.name} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h1 className="truncate text-[20px] leading-tight">{p.name}</h1>
              {p.verified ? <VerifiedBadge size={16} /> : null}
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{p.role}</p>
            {p.business ? <p className="text-[11px] text-muted-foreground">{p.business}</p> : null}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Rating value={p.rating} count={p.reviews} />
              <span className="text-[11px] text-muted-foreground">{p.location}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {p.badges.map((b) => (
            <span
              key={b}
              className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: "var(--purple-container)", color: "var(--purple)" }}
            >
              {b}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[
            { k: "Rentals", v: `${p.completedRentals}` },
            { k: "Response", v: p.responseRate },
            { k: "Replies", v: p.responseTime.replace("Under ", "<") },
            { k: "Active", v: `${p.years} yrs` },
          ].map((x) => (
            <div key={x.k} className="rounded-lg bg-subtle px-1 py-2">
              <p className="truncate text-[12px] font-bold">{x.v}</p>
              <p className="text-[10px] text-muted-foreground">{x.k}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <BtnLink to="/messages" className="w-full">
            Message
          </BtnLink>
          <Btn variant="outline" className="w-full">
            Follow
          </Btn>
        </div>
      </div>

      <div className="rail flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5 pb-6">
        {tab === "Equipment" ? (
          items.length ? (
            items.map((e) => <EquipmentRow key={e.id} e={e} />)
          ) : (
            <EmptyState
              emoji="📦"
              title="No equipment listed"
              body="This provider has no rental equipment available right now."
            />
          )
        ) : null}

        {tab === "Reviews"
          ? rentalReviews.map((r) => (
              <article key={r.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{r.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {r.context} · {r.date}
                    </p>
                  </div>
                  <Rating value={r.rating} />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{r.body}</p>
                {r.response ? (
                  <p className="mt-2 rounded-lg bg-subtle p-3 text-[12px] text-muted-foreground">
                    <span className="font-semibold">{p.name}:</span> {r.response}
                  </p>
                ) : null}
              </article>
            ))
          : null}

        {tab === "About" ? (
          <>
            <p className="rounded-lg border border-border bg-card p-4 text-[13px] leading-relaxed text-muted-foreground">
              {p.bio}
            </p>
            <dl className="divide-y divide-border rounded-lg border border-border">
              {[
                { k: "Based in", v: p.location },
                { k: "On MusicLinkd", v: `${p.years} years` },
                { k: "Completed rentals", v: `${p.completedRentals}` },
                { k: "Response rate", v: p.responseRate },
              ].map((r) => (
                <div key={r.k} className="flex items-center justify-between gap-3 px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{r.k}</dt>
                  <dd className="text-xs font-semibold">{r.v}</dd>
                </div>
              ))}
            </dl>
            <button
              onClick={() => setReport(true)}
              className="text-[11px] font-semibold text-muted-foreground"
            >
              Report or block this provider
            </button>
          </>
        ) : null}
      </div>

      <RentalReportSheet open={report} onClose={() => setReport(false)} />
    </Screen>
  );
}
