import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Compass, ShieldCheck } from "lucide-react";
import { Btn, BtnLink } from "@/components/ml/ui";
import { Segmented } from "@/components/ml/kit";
import { OnboardingProvider, useOnboarding, resumeTarget } from "@/components/ml/onboarding";
import { visibleSteps } from "@/data/onboarding";
import { AuthLink } from "@/components/ml/auth";
import { beat, useArrival } from "@/lib/flow-motion";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";

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

const kinds = ["Talent", "Business"] as const;

function Welcome() {
  const { draft, hydrated, bucket } = useOnboarding();
  const navigate = useNavigate();
  const total = visibleSteps(draft, bucket).length;
  const started = draft.completedSteps.length > 0;
  const rise = useArrival("onboarding-intro") ? "animate-rise" : "";

  // Which journey this account takes — picked once, right after auth (owner, 18 Sep 2026: no
  // switching between them once chosen). Talent is the default because sign-up assumes it today;
  // a business pick here skips talent onboarding and starts the business flow instead.
  const [kind, setKind] = useState<(typeof kinds)[number]>("Talent");

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-10">
      <div>
        <p className={cn("text-1 text-muted-foreground", rise)}>
          About two minutes · {total} short questions
        </p>
        <h1 className={cn("mt-2 text-4", rise)} style={beat(1)}>
          Let's build your MusicLinkd profile.
        </h1>
        <p
          className={cn("mt-3 text-2 leading-relaxed text-muted-foreground", rise)}
          style={beat(2)}
        >
          Tell us a little about what you do in music. It takes about two minutes, and you can skip
          anything that doesn't apply.
        </p>

        <div className={cn("mt-6", rise)} style={beat(2.5)}>
          <p className="mb-1.5 text-1 font-semibold">What are you setting up?</p>
          <Segmented value={kind} options={kinds} onChange={setKind} />
        </div>

        {kind === "Talent" ? (
          <ul className="mt-8 space-y-5">
            {[
              {
                icon: <Compass size={iconSize.md} />,
                title: "Get found for the right work",
                body: "Role, genres, languages and city power discovery.",
              },
              {
                icon: <Sparkles size={iconSize.md} />,
                title: "A feed that fits you",
                body: "We shape recommendations around what you're here for.",
              },
              {
                icon: <ShieldCheck size={iconSize.md} />,
                title: "Private by default",
                body: "Contact details stay hidden until you share them.",
              },
            ].map((f, i) => (
              <li key={f.title} className={cn("flex items-start gap-3", rise)} style={beat(3 + i)}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-foreground">
                  {f.icon}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{f.title}</span>
                  <span className="mt-0.5 block text-1 text-muted-foreground">{f.body}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p
            className={cn("mt-8 text-2 leading-relaxed text-muted-foreground", rise)}
            style={beat(3)}
          >
            A business profile is separate from you — its own team, spaces and bookings. Set up the
            studio, label, venue or agency next.
          </p>
        )}
      </div>

      <div className={cn("mt-8 space-y-2", rise)} style={beat(6)}>
        {kind === "Business" ? (
          <BtnLink to="/business/new" search={{ step: "type" }} className="w-full">
            Set Up Your Business
          </BtnLink>
        ) : hydrated && started ? (
          <BtnLink to="/onboarding/resume" className="w-full">
            Continue Setup
          </BtnLink>
        ) : (
          <Btn
            className="w-full"
            onClick={() =>
              navigate({ to: "/onboarding/step/$id", params: { id: resumeTarget(draft, bucket) } })
            }
          >
            Let's Start
          </Btn>
        )}
        {kind === "Talent" ? (
          <p className="flex justify-center pt-2 text-sm">
            <AuthLink to="/onboarding/skip" className="text-muted-foreground">
              Skip for Now
            </AuthLink>
          </p>
        ) : null}
      </div>
    </div>
  );
}
