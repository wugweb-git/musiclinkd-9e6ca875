import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Settings2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Chip } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Price } from "@/components/ml/kit";
import type { BusinessView } from "@/lib/business-view";
import { TextLink } from "@/components/ml/links";

const tabs = ["Overview", "Spaces", "Team", "Credits"] as const;

/** A business account's profile: /business/$id and /profile/$username for a business. */
export function BusinessProfileExperience({ b }: { b: BusinessView | undefined }) {
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
            params={{ id: b.id }}
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
              <h1 className="truncate text-2 font-bold">{b.name}</h1>
              {b.verified ? <StatusPill label="verified" tone="good" /> : null}
            </div>
            {b.subtitle ? (
              <p className="truncate text-1 text-muted-foreground">{b.subtitle}</p>
            ) : null}
          </div>
        </div>

        {b.tagline ? <p className="text-1 leading-relaxed">{b.tagline}</p> : null}

        <div className="grid grid-cols-3 gap-2">
          <BtnLink to="/messages" variant="ink" className="w-full px-2 text-1">
            Message
          </BtnLink>
          <BtnLink to="/business/$id/enquiry" params={{ id: b.id }} className="w-full px-2 text-1">
            Book
          </BtnLink>
          <Btn variant="outline" className="w-full px-2 text-1">
            Follow
          </Btn>
        </div>

        {b.stats ? (
          <div className="grid grid-cols-4 gap-2 rounded-lg border border-border bg-card p-3 text-center">
            {b.stats.map(([k, v]) => (
              <div key={k}>
                <p className="text-sm font-bold leading-tight">{v}</p>
                <p className="mt-0.5 text-0 text-muted-foreground">{k}</p>
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
                <h2 className="text-sm">About</h2>
                <p className="text-1 leading-relaxed text-muted-foreground">{b.about}</p>
              </Card>
            ) : null}
            {b.services.some((s) => s.status === "active") ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Services & rates</h2>
                {b.services
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0"
                    >
                      <span className="min-w-0 flex-1 truncate text-1">{s.label}</span>
                      <Price
                        price={s.price}
                        align="end"
                        className="shrink-0"
                        amountClassName="text-1 font-semibold"
                      />
                    </div>
                  ))}
              </Card>
            ) : null}
            {b.hours.length ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Hours</h2>
                {b.hours.map((h) => (
                  <div key={`${h.day}${h.hours}`} className="flex justify-between gap-3 text-1">
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-semibold">{h.hours}</span>
                  </div>
                ))}
              </Card>
            ) : null}
            {b.address ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Find & contact</h2>
                <p className="flex items-start gap-2 text-1">
                  <MapPin size={15} className="mt-0.5 shrink-0" /> {b.address}
                </p>
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
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{sp.name}</p>
                    <Price
                      price={sp.rate}
                      align="end"
                      className="shrink-0"
                      amountClassName="text-1 font-bold"
                    />
                  </div>
                  {sp.detail ? <p className="text-1 text-muted-foreground">{sp.detail}</p> : null}
                  <div className="flex flex-wrap gap-1.5">
                    {sp.gear.map((g) => (
                      <span key={g} className="rounded-full bg-subtle px-2.5 py-1 text-0">
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
                  <p className="truncate text-1 font-semibold">{m.name}</p>
                  {m.detail ? <p className="text-0 text-muted-foreground">{m.detail}</p> : null}
                </div>
                {m.invited ? <StatusPill label="invited" tone="warn" /> : null}
              </div>
            ))}
            <TextLink to="/business/$id/team" params={{ id: b.id }} className="block text-1">
              Manage Team →
            </TextLink>
          </Card>
        ) : null}

        {tab === "Credits" ? (
          <Card className="space-y-2">
            {b.credits.map((c) => (
              <div key={c.id} className="border-b border-border py-2 last:border-0">
                <p className="text-1 font-semibold">{c.title}</p>
                {c.meta ? <p className="text-0 text-muted-foreground">{c.meta}</p> : null}
              </div>
            ))}
          </Card>
        ) : null}
      </div>
    </Screen>
  );
}
