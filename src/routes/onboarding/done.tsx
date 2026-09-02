import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Btn, TopBar } from "@/components/ml/ui";
import { OnboardingProvider, useOnboarding } from "@/components/ml/onboarding";

export const Route = createFileRoute("/onboarding/done")({
  head: () => ({
    meta: [
      { title: "You're all set — MusicLinkd" },
      {
        name: "description",
        content:
          "Your MusicLinkd profile is live. Add portfolio work, discover talent or head to your home feed.",
      },
      { property: "og:title", content: "You're all set — MusicLinkd" },
      {
        property: "og:description",
        content: "Your profile is live. Add work, discover talent, start collaborating.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <Done />
    </OnboardingProvider>
  ),
});

function Done() {
  const { draft: d } = useOnboarding();
  const first = d.displayName.split(" ")[0] || "there";
  const summary = [
    d.primaryRole ? `Role: ${d.primaryRole}` : null,
    d.city ? `Based in ${d.city}` : null,
    d.genres.length ? `${d.genres.slice(0, 3).join(", ")}` : null,
    d.availability.length ? `Open for ${d.availability.slice(0, 2).join(", ")}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-40">
      <TopBar title="Welcome to MusicLinkd" back="/onboarding/complete" />

      <main className="px-5 pt-4">
        <section className="rounded-3xl border border-border bg-card p-6 text-center">
          <Sparkles size={28} className="mx-auto text-primary" />
          <h1 className="mt-3 text-[24px] leading-tight">Welcome aboard, {first}</h1>
          <p className="mx-auto mt-2 max-w-[300px] text-sm text-muted-foreground">
            Your profile is live and people can find you. Here's what it says right now.
          </p>
        </section>

        {summary.length ? (
          <ul className="mt-4 space-y-2">
            {summary.map((line) => (
              <li key={line} className="rounded-2xl border border-border bg-card px-4 py-3 text-sm">
                {line}
              </li>
            ))}
          </ul>
        ) : null}

        <h2 className="mt-7 text-[17px]">What next</h2>
        <div className="mt-3 space-y-3">
          <Link to="/portfolio/new" className="block rounded-3xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Add portfolio work</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tracks, videos and credits turn a profile view into an enquiry.
            </p>
          </Link>
          <Link to="/" className="block rounded-3xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">Discover talent</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Singers, producers, studios and bands near you.
            </p>
          </Link>
          <Link to="/me" className="block rounded-3xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">View my profile</p>
            <p className="mt-1 text-xs text-muted-foreground">See exactly what others see.</p>
          </Link>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] border-t border-border bg-card/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <Link to="/feed" className="block">
          <Btn className="w-full">Go to my home</Btn>
        </Link>
      </div>
    </div>
  );
}
