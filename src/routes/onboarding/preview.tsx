import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapPin, Pencil } from "lucide-react";
import { Btn, TopBar } from "@/components/ml/ui";
import { OnboardingProvider, useOnboarding } from "@/components/ml/onboarding";
import { roles, visibleSteps } from "@/data/onboarding";

export const Route = createFileRoute("/onboarding/preview")({
  head: () => ({
    meta: [
      { title: "Preview your profile — MusicLinkd" },
      {
        name: "description",
        content:
          "See exactly how your MusicLinkd profile looks to other musicians, studios and clients before you publish.",
      },
      { property: "og:title", content: "Preview your profile — MusicLinkd" },
      {
        property: "og:description",
        content: "How your profile looks to the rest of the industry.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <Preview />
    </OnboardingProvider>
  ),
});

function Preview() {
  const { draft: d } = useOnboarding();
  const navigate = useNavigate();
  const role = roles.find((r) => r.key === d.primaryRole);
  const list = visibleSteps(d);

  const edit = (id: string) => navigate({ to: "/onboarding/step/$id", params: { id } });

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-36">
      <TopBar
        title="Profile preview"
        subtitle="This is what others see"
        back={`/onboarding/step/${list[list.length - 1]?.id ?? "visibility"}`}
      />

      <main className="px-5 pt-4">
        <section className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-subtle">
              {d.photo ? (
                <img src={d.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
                  {d.displayName.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[22px] leading-tight">{d.displayName || "Your name"}</h1>
              <p className="truncate text-sm text-muted-foreground">
                {role?.label ?? "Add your role"}
                {d.primaryInstrument ? ` · ${d.primaryInstrument}` : ""}
              </p>
              {d.city ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={12} /> {d.locality ? `${d.locality}, ` : ""}
                  {d.city}
                </p>
              ) : null}
            </div>
          </div>
          {d.bio ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{d.bio}</p>
          ) : null}
          <p className="mt-3 text-[11px] text-muted-foreground">musiclinkd.com/{d.username}</p>
        </section>

        <Row
          title="Roles"
          items={[role?.label, ...d.secondaryRoles].filter(Boolean) as string[]}
          onEdit={() => edit("role")}
        />
        <Row title="Instruments" items={d.instruments} onEdit={() => edit("instruments")} />
        <Row title="Genres" items={d.genres} onEdit={() => edit("genres")} />
        <Row title="Languages" items={d.languages} onEdit={() => edit("languages")} />
        <Row title="Available for" items={d.availability} onEdit={() => edit("availability")} />
        <Row title="Work mode" items={d.workModes} onEdit={() => edit("work-mode")} />
        <Row
          title="Links"
          items={Object.entries(d.links)
            .filter(([, v]) => v)
            .map(([k]) => k)}
          onEdit={() => edit("links")}
        />
        <Row title="Visibility" items={[d.visibility]} onEdit={() => edit("visibility")} />

        <p className="mt-6 rounded-2xl bg-subtle px-4 py-3 text-xs text-muted-foreground">
          Anything empty simply doesn't show on your profile. You can fill it in later from your
          profile settings.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] space-y-2 border-t border-border bg-card/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Link to="/onboarding/complete" className="block">
          <Btn className="w-full">Publish my profile</Btn>
        </Link>
        <Link to="/onboarding/skip" className="block">
          <Btn variant="ghost" className="w-full">
            Finish later
          </Btn>
        </Link>
      </div>
    </div>
  );
}

function Row({ title, items, onEdit }: { title: string; items: string[]; onEdit: () => void }) {
  return (
    <section className="mt-3 rounded-3xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-primary"
        >
          <Pencil size={12} /> Edit
        </button>
      </div>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((x) => (
            <span
              key={x}
              className="rounded-full bg-subtle px-3 py-1 text-xs font-semibold text-muted-foreground"
            >
              {x}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Not added — this section stays hidden.
        </p>
      )}
    </section>
  );
}
