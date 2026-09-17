import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { BtnLink, TopBar } from "@/components/ml/ui";
import { ownerProfile, profileCompletion, profileInsights } from "@/data/profile";
import { SignalLine } from "@/components/charts/recharts/line-signal";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

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
  // Insights are not recorded for real accounts yet. The sample figures belong to the signed-out
  // demo only; a real account (or one still resolving) sees dashes, never a borrowed number.
  const { signedIn, loading } = useAuth();
  const sample = !signedIn && !loading;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-28">
      <TopBar title="Profile insights" subtitle={i.range} back="/profile" />

      <main className="px-5 pt-4">
        {!sample && !loading ? (
          <p className="mb-3 text-1 text-muted-foreground">
            Insights aren't tracked yet for real accounts — the dashes below will start filling in
            once that's built.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          {i.headline.map((m) => {
            const up = m.delta.startsWith("+");
            if (!sample) {
              return (
                <article key={m.label} className="rounded-lg bg-subtle p-4">
                  <p className="text-1 text-muted-foreground">{m.label}</p>
                  <p className="mt-1 text-3 tabular-nums">—</p>
                </article>
              );
            }
            return (
              <article key={m.label} className="rounded-lg bg-subtle p-4">
                <p className="text-1 text-muted-foreground">{m.label}</p>
                <p className="mt-1 text-3 tabular-nums">{m.value}</p>
                <p
                  className={`mt-1 inline-flex items-center gap-1 text-1 font-bold ${
                    up ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {up ? <ArrowUpRight size={iconSize.xs} /> : <ArrowDownRight size={iconSize.xs} />}
                  {m.delta}
                </p>
              </article>
            );
          })}
        </div>

        {/* The same 28 days the headline figures cover, drawn rather than listed. */}
        <section className="mt-6">
          <h2 className="text-2">Plays over time</h2>
          <div className="mt-3 rounded-lg bg-subtle p-3">
            <SignalLine
              data={sample ? i.trend : []}
              xKey="day"
              seriesKey="plays"
              series={{ key: "plays", label: "Audio plays" }}
              height={200}
              color="var(--color-ink)"
              title="Audio plays over the last 28 days"
              showGrid
              emptyContent={
                <p className="py-10 text-center text-1 text-muted-foreground">
                  Plays will show here once people start listening.
                </p>
              }
            />
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-2">Engagement</h2>
          <div className="mt-3 divide-y divide-border rounded-lg bg-subtle">
            {i.secondary.map((s) => (
              <div key={s.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="text-sm font-semibold tabular-nums">{sample ? s.value : "—"}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-2">Where your audience is</h2>
          <div className="mt-3 space-y-3 rounded-lg bg-subtle p-4">
            {sample ? null : (
              <p className="text-1 text-muted-foreground">
                The cities your listeners are in will show here.
              </p>
            )}
            {(sample ? i.audience : []).map((a) => (
              <div key={a.city}>
                <div className="flex items-baseline justify-between text-1">
                  <span className="font-semibold">{a.city}</span>
                  <span className="tabular-nums text-muted-foreground">{a.share}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${a.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-lg bg-subtle p-5">
          <p className="text-sm font-semibold">Get seen more</p>
          <p className="mt-1 text-1 text-muted-foreground">
            {sample
              ? `${me.name.split(" ")[0]}, your profile is ${profileCompletion.percent}% complete. Finishing these lifts search ranking.`
              : "A complete profile ranks higher in search."}
          </p>
          {sample ? (
            <ul className="mt-3 space-y-1.5">
              {profileCompletion.missing.map((m) => (
                <li key={m.id} className="text-1 text-muted-foreground">
                  · {m.label}
                </li>
              ))}
            </ul>
          ) : null}
          <BtnLink to="/profile/edit" className="mt-4 w-full">
            Complete Profile
          </BtnLink>
        </section>
      </main>
    </div>
  );
}
