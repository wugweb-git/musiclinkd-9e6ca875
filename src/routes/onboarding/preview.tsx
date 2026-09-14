import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, MapPin, Pencil } from "lucide-react";
import { BtnLink, TopBar } from "@/components/ml/ui";
import { OnboardingProvider, useOnboarding } from "@/components/ml/onboarding";
import { visibleSteps } from "@/data/onboarding";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { AuthLink, AuthTextButton } from "@/components/ml/auth";

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
  const { draft: d, bucket } = useOnboarding();
  const navigate = useNavigate();
  const tx = useTaxonomy().options;
  const roleLabel = d.primaryRole ? labelFor(tx?.person_types, d.primaryRole) : null;
  const labels = (options: Parameters<typeof labelFor>[0], slugs: string[]) =>
    slugs.map((s) => labelFor(options, s));
  const list = visibleSteps(d, bucket);

  const edit = (id: string) => navigate({ to: "/onboarding/step/$id", params: { id } });

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-app bg-background pb-36">
      <TopBar
        title="Profile preview"
        subtitle="This is what others see"
        back={`/onboarding/step/${list[list.length - 1]?.id ?? "visibility"}`}
      />

      <main className="px-5 pt-4">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-subtle">
              {d.photo ? (
                <img src={d.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-3 font-bold text-muted-foreground">
                  {d.displayName.slice(0, 1)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-3 leading-tight">{d.displayName || "Your name"}</h1>
              <p className="truncate text-sm text-muted-foreground">
                {roleLabel ?? "Add your role"}
                {d.primaryInstrument ? ` · ${labelFor(tx?.instruments, d.primaryInstrument)}` : ""}
              </p>
              {d.city ? (
                <p className="mt-1 inline-flex items-center gap-1 text-1 text-muted-foreground">
                  <MapPin size={12} /> {d.locality ? `${d.locality}, ` : ""}
                  {d.city}
                </p>
              ) : null}
            </div>
          </div>
          {d.bio ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{d.bio}</p>
          ) : null}
          <p className="mt-3 text-1 text-muted-foreground">musiclinkd.com/{d.username}</p>
        </section>

        <Row
          title="Roles"
          items={labels(
            tx?.person_types,
            [d.primaryRole, ...d.secondaryRoles].filter(Boolean) as string[],
          )}
          onEdit={() => edit("role")}
        />
        <Row
          title="Instruments"
          items={labels(tx?.instruments, d.instruments)}
          onEdit={() => edit("instruments")}
        />
        <Row title="Genres" items={labels(tx?.genres, d.genres)} onEdit={() => edit("genres")} />
        <Row
          title="Languages"
          items={labels(tx?.languages, d.languages)}
          onEdit={() => edit("languages")}
        />
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

        <p className="mt-6 flex items-start gap-1.5 text-1 text-muted-foreground">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
          Anything empty simply doesn't show on your profile. You can fill it in later from your
          profile settings.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-app space-y-2 border-t border-border bg-card/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <BtnLink to="/onboarding/complete" className="w-full">
          Publish my profile
        </BtnLink>
        <p className="flex justify-center text-1">
          <AuthLink to="/onboarding/skip" className="text-muted-foreground">
            Finish later
          </AuthLink>
        </p>
      </div>
    </div>
  );
}

function Row({ title, items, onEdit }: { title: string; items: string[]; onEdit: () => void }) {
  return (
    <section className="mt-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <AuthTextButton onClick={onEdit} icon={<Pencil size={14} />} className="text-1">
          Edit
        </AuthTextButton>
      </div>
      {items.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {items.map((x) => (
            <span
              key={x}
              className="rounded-full bg-subtle px-3 py-1 text-1 font-semibold text-muted-foreground"
            >
              {x}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-1.5 text-1 text-muted-foreground">
          Not added — this section stays hidden.
        </p>
      )}
    </section>
  );
}
