import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles, Compass, ShieldCheck } from "lucide-react";
import { Btn, BtnLink } from "@/components/ml/ui";
import { OnboardingProvider, useOnboarding, resumeTarget } from "@/components/ml/onboarding";
import { visibleSteps } from "@/data/onboarding";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [
      { title: "Set up your MusicLinkd profile" },
      {
        name: "description",
        content:
          "Tell MusicLinkd what you do in music — role, genres, languages, city and availability — so the right work finds you.",
      },
      { property: "og:title", content: "Set up your MusicLinkd profile" },
      {
        property: "og:description",
        content: "A short, role-adaptive setup that makes MusicLinkd useful for you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <OnboardingProvider>
      <Welcome />
    </OnboardingProvider>
  ),
});

function Welcome() {
  const { draft, hydrated } = useOnboarding();
  const navigate = useNavigate();
  const total = visibleSteps(draft).length;
  const started = draft.completedSteps.length > 0;

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-10">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-1 font-bold uppercase tracking-wide text-primary bg-pink-container">
          <Sparkles size={13} /> Step 1 of {total + 2}
        </span>
        <h1 className="mt-5 text-4">Let's build your MusicLinkd profile.</h1>
        <p className="mt-3 text-2 leading-relaxed text-muted-foreground">
          Tell us a little about what you do in music. It takes about two minutes, and you can skip
          anything that doesn't apply.
        </p>

        <ul className="mt-8 space-y-3">
          {[
            {
              icon: <Compass size={18} />,
              title: "Get found for the right work",
              body: "Role, genres, languages and city power discovery.",
            },
            {
              icon: <Sparkles size={18} />,
              title: "A feed that fits you",
              body: "We shape recommendations around what you're here for.",
            },
            {
              icon: <ShieldCheck size={18} />,
              title: "Private by default",
              body: "Contact details stay hidden until you share them.",
            },
          ].map((f) => (
            <li
              key={f.title}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span className="mt-0.5 text-primary">{f.icon}</span>
              <span>
                <span className="block text-sm font-semibold">{f.title}</span>
                <span className="mt-0.5 block text-1 text-muted-foreground">{f.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 space-y-2">
        {hydrated && started ? (
          <BtnLink to="/onboarding/resume" className="w-full">
            Continue setup
          </BtnLink>
        ) : (
          <Btn
            className="w-full"
            onClick={() =>
              navigate({ to: "/onboarding/step/$id", params: { id: resumeTarget(draft) } })
            }
          >
            Let's start
          </Btn>
        )}
        <BtnLink to="/onboarding/skip" variant="ghost" className="w-full">
          Skip for now
        </BtnLink>
      </div>
    </div>
  );
}
