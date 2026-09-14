import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Phone, Globe2, Mail, Settings2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState } from "@/components/ml/kit";
import { getBusiness } from "@/data/business";
import { businessViewFromRecord, businessViewFromStatic } from "@/lib/business-view";
import { getTaxonomyLabels, type TaxonomyLabels } from "@/lib/portfolio.functions";
import { getPublicBusiness } from "@/lib/profile-groups.functions";

export const Route = createFileRoute("/business/$id/")({
  // The demo business wins; otherwise the id is the username of a stored business profile.
  loader: async ({ params }) => {
    if (getBusiness(params.id)) return { record: null, labels: {} as TaxonomyLabels };
    const [record, labels] = await Promise.all([
      getPublicBusiness({ data: { username: params.id } }).catch(() => null),
      getTaxonomyLabels().catch((): TaxonomyLabels => ({})),
    ]);
    return { record, labels };
  },
  head: () => ({
    meta: [
      { title: "Business profile | MusicLinkd" },
      {
        name: "description",
        content: "Spaces, rates, team and credits for a studio, label or venue on MusicLinkd.",
      },
      { property: "og:title", content: "Business profile | MusicLinkd" },
      {
        property: "og:description",
        content: "See rooms, rates and the people behind the business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessProfileScreen,
});

const tabs = ["Overview", "Spaces", "Team", "Credits"] as const;

function BusinessProfileScreen() {
  const { id } = Route.useParams();
  const { record, labels } = Route.useLoaderData();
  const demo = getBusiness(id);
  const b = demo
    ? businessViewFromStatic(demo)
    : record
      ? businessViewFromRecord(record, labels)
      : undefined;
  const [tab, setTab] = useState<(typeof tabs)[number]>("Overview");

  if (!b) {
    return (
      <Screen>
        <TopBar title="Business" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This profile may have been removed." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title={b.name}
        subtitle={b.typeLabel}
        back="/business"
        right={
          <Link
            to="/business/$id/manage"
            params={{ id }}
            aria-label="Manage business"
            className="grid h-10 w-10 place-items-center rounded-full bg-subtle"
          >
            <Settings2 size={16} />
          </Link>
        }
      />

      {b.cover ? (
        <img src={b.cover} alt="" className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <div aria-hidden className="h-40 w-full bg-subtle" />
      )}

      <div className="space-y-4 px-5 pt-4 pb-6">
        <div className="-mt-10 flex items-end gap-3">
          {b.logo ? (
            <img
              src={b.logo}
              alt=""
              className="h-16 w-16 rounded-lg border-4 border-background object-cover"
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden
              className="h-16 w-16 shrink-0 rounded-lg border-4 border-background bg-subtle"
            />
          )}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[18px] font-bold">{b.name}</h1>
              {b.verified ? <StatusPill label="verified" tone="good" /> : null}
            </div>
            {b.subtitle ? (
              <p className="truncate text-[12px] text-muted-foreground">{b.subtitle}</p>
            ) : null}
          </div>
        </div>

        {b.tagline ? <p className="text-[13px] leading-relaxed">{b.tagline}</p> : null}

        <div className="grid grid-cols-3 gap-2">
          <BtnLink to="/messages" variant="ink" className="w-full px-2 text-xs">
            Message
          </BtnLink>
          <BtnLink to="/business/$id/enquiry" params={{ id: b.id }} className="w-full px-2 text-xs">
            Book
          </BtnLink>
          <Btn variant="outline" className="w-full px-2 text-xs">
            Follow
          </Btn>
        </div>

        {b.stats ? (
          <div className="grid grid-cols-4 gap-2 rounded-lg border border-border bg-card p-3 text-center">
            {b.stats.map(([k, v]) => (
              <div key={k}>
                <p className="text-[15px] font-bold leading-tight">{v}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="rail no-scrollbar flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
              {t}
            </Chip>
          ))}
        </div>

        {tab === "Overview" ? (
          <>
            {b.about ? (
              <Card className="space-y-2">
                <h2 className="text-[15px]">About</h2>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{b.about}</p>
              </Card>
            ) : null}
            {b.services.length ? (
              <Card className="space-y-2">
                <h2 className="text-[15px]">Services & rates</h2>
                {b.services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-0"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px]">{s.label}</span>
                    <span className="shrink-0 text-[13px] font-semibold">{s.price}</span>
                  </div>
                ))}
              </Card>
            ) : null}
            {b.hours.length ? (
              <Card className="space-y-2">
                <h2 className="text-[15px]">Hours</h2>
                {b.hours.map((h) => (
                  <div key={h.day} className="flex justify-between gap-3 text-[13px]">
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-semibold">{h.hours}</span>
                  </div>
                ))}
              </Card>
            ) : null}
            {b.address || b.contact ? (
              <Card className="space-y-2">
                <h2 className="text-[15px]">Find & contact</h2>
                {b.address ? (
                  <p className="flex items-start gap-2 text-[13px]">
                    <MapPin size={15} className="mt-0.5 shrink-0" /> {b.address}
                  </p>
                ) : null}
                {b.contact ? (
                  <>
                    <p className="flex items-center gap-2 text-[13px]">
                      <Phone size={15} /> {b.contact.phone}
                    </p>
                    <p className="flex items-center gap-2 text-[13px]">
                      <Mail size={15} /> {b.contact.email}
                    </p>
                    <p className="flex items-center gap-2 text-[13px]">
                      <Globe2 size={15} /> {b.contact.website}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Full contact details unlock once a booking is confirmed.
                    </p>
                  </>
                ) : null}
              </Card>
            ) : null}
          </>
        ) : null}

        {tab === "Spaces" ? (
          <div className="space-y-3">
            {b.spaces.map((sp) => (
              <Card key={sp.id} className="space-y-2 overflow-hidden p-0">
                {sp.photo ? (
                  <img src={sp.photo} alt="" className="h-32 w-full object-cover" loading="lazy" />
                ) : null}
                <div className="space-y-2 p-4 pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold">{sp.name}</p>
                    <p className="text-[13px] font-bold">{sp.rate}</p>
                  </div>
                  {sp.detail ? (
                    <p className="text-[12px] text-muted-foreground">{sp.detail}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-1.5">
                    {sp.gear.map((g) => (
                      <span key={g} className="rounded-full bg-subtle px-2.5 py-1 text-[11px]">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === "Team" ? (
          <Card className="space-y-3">
            {b.members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 border-b border-border py-2.5 last:border-0"
              >
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-subtle" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{m.name}</p>
                  {m.detail ? (
                    <p className="text-[11px] text-muted-foreground">{m.detail}</p>
                  ) : null}
                </div>
                {m.invited ? <StatusPill label="invited" tone="warn" /> : null}
              </div>
            ))}
            <Link
              to="/business/$id/team"
              params={{ id }}
              className="block text-[12px] font-semibold text-foreground"
            >
              Manage team →
            </Link>
          </Card>
        ) : null}

        {tab === "Credits" ? (
          <Card className="space-y-2">
            {b.credits.map((c) => (
              <div key={c.title} className="border-b border-border py-2 last:border-0">
                <p className="text-[13px] font-semibold">{c.title}</p>
                <p className="text-[11px] text-muted-foreground">{c.meta}</p>
              </div>
            ))}
          </Card>
        ) : null}
      </div>
    </Screen>
  );
}
