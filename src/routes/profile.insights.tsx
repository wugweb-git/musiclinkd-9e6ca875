import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Btn, TopBar } from "@/components/ml/ui";
import { ownerProfile, profileCompletion, profileInsights } from "@/data/profile";

export const Route = createFileRoute("/profile/insights")({
  head: () => ({
    meta: [
      { title: "Profile insights — MusicLinkd" },
      {
        name: "description",
        content:
          "See who is finding your MusicLinkd profile: views, plays, search appearances and where your audience is based.",
      },
      { property: "og:title", content: "Profile insights — MusicLinkd" },
      {
        property: "og:description",
        content: "Views, plays, search appearances and audience cities for your profile.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Insights,
});

function Insights() {
  const me = ownerProfile;
  const i = profileInsights;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-28">
      <TopBar title="Profile insights" subtitle={i.range} back="/me" />

      <main className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          {i.headline.map((m) => {
            const up = m.delta.startsWith("+");
            return (
              <article key={m.label} className="rounded-lg border border-border bg-card p-4">
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-2xl tabular-nums">{m.value}</p>
                <p
                  className={`mt-1 inline-flex items-center gap-1 text-[11px] font-bold ${
                    up ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {m.delta}
                </p>
              </article>
            );
          })}
        </div>

        <section className="mt-6">
          <h2 className="text-[17px]">Engagement</h2>
          <div className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
            {i.secondary.map((s) => (
              <div key={s.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="text-sm font-semibold tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-[17px]">Where your audience is</h2>
          <div className="mt-3 space-y-3 rounded-lg border border-border bg-card p-4">
            {i.audience.map((a) => (
              <div key={a.city}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold">{a.city}</span>
                  <span className="tabular-nums text-muted-foreground">{a.share}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-subtle">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${a.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-semibold">Get seen more</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {me.name.split(" ")[0]}, your profile is {profileCompletion.percent}% complete.
            Finishing these lifts search ranking.
          </p>
          <ul className="mt-3 space-y-1.5">
            {profileCompletion.missing.map((m) => (
              <li key={m.id} className="text-xs text-muted-foreground">
                · {m.label}
              </li>
            ))}
          </ul>
          <Link to="/profile/edit" className="mt-4 block">
            <Btn className="w-full">Complete profile</Btn>
          </Link>
        </section>
      </main>
    </div>
  );
}
