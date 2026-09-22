import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, type ReactNode } from "react";
import {
  Sparkles,
  Compass,
  ShieldCheck,
  Building2,
  CalendarCheck,
  Users,
  Music2,
  Eye,
} from "lucide-react";
import { Btn, BtnLink } from "@/components/ml/ui";
import { OnboardingProvider, useOnboarding, resumeTarget } from "@/components/ml/onboarding";
import { visibleSteps } from "@/data/onboarding";
import { AuthLink } from "@/components/ml/auth";
import { beat, useArrival } from "@/lib/flow-motion";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";
import { haptic } from "@/lib/haptics";
import { PersonCard, StudioCard } from "@/components/ml/cards";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";
import type { DiscoverStudio } from "@/lib/studio-view";

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

const kindOrder = ["Talent", "Business"] as const;
type AccountKind = (typeof kindOrder)[number];

// The wizard's "what your card will look like" preview, in the exact shapes the real
// PersonCard/StudioCard take — so the preview and the live card are always the same component.
const demoTalent: DirectoryPerson = {
  id: "preview-talent",
  username: "you",
  name: "Your Name",
  headline: "Say what you do and where — this is your headline.",
  city: "Mumbai",
  roles: [],
  genres: [],
  avatarUrl: null,
  verified: true,
  pin_code: null,
  rating: null,
  reviewCount: 0,
};

const demoStudio: DiscoverStudio = {
  id: "preview-business",
  slug: "preview-business",
  username: "",
  name: "Your Business Name",
  location: "Mumbai",
  rating: 4.9,
  reviewCount: 38,
  verified: true,
  rate: { amount: "₹2,500", unit: "hour" },
  photo:
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80",
  gear: ["Dolby Atmos", "Neumann U87", "SSL Duality"],
};

const kindInfo: Record<
  AccountKind,
  {
    pitch: ReactNode;
    cta: string;
    estimate: string;
    goTo?: { to: "/business/new"; search: { step: "type" } };
    skippable: boolean;
  }
> = {
  Talent: {
    estimate: "~2 mins · 8 quick questions",
    pitch: (
      <ul className="space-y-4">
        {[
          {
            icon: <Compass size={iconSize.md} />,
            title: "Get found for the right gigs",
            body: "Your craft, genres, city and rates power smart artist discovery.",
          },
          {
            icon: <Sparkles size={iconSize.md} />,
            title: "Interactive audio portfolio",
            body: "Showcase original audio tracks and video credits in one link.",
          },
          {
            icon: <ShieldCheck size={iconSize.md} />,
            title: "Private contact details",
            body: "Your phone number stays strictly protected until you share it.",
          },
        ].map((f) => (
          <li key={f.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-foreground">
              {f.icon}
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{f.title}</span>
              <span className="mt-0.5 block text-1 text-muted-foreground leading-snug">
                {f.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    ),
    cta: "Let's Start",
    skippable: true,
  },
  Business: {
    estimate: "~3 mins · Studio registration",
    pitch: (
      <ul className="space-y-4">
        {[
          {
            icon: <Building2 size={iconSize.md} />,
            title: "Studio & gear showcase",
            body: "Highlight your live recording rooms, acoustics, and microphone locker.",
          },
          {
            icon: <CalendarCheck size={iconSize.md} />,
            title: "Direct client bookings",
            body: "Accept session enquiries, manage hourly slots, and set deposit terms.",
          },
          {
            icon: <Users size={iconSize.md} />,
            title: "Multi-engineer team page",
            body: "Operate under your studio brand with its own verified URL and team.",
          },
        ].map((f) => (
          <li key={f.title} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-subtle text-foreground">
              {f.icon}
            </span>
            <span>
              <span className="block text-sm font-semibold text-foreground">{f.title}</span>
              <span className="mt-0.5 block text-1 text-muted-foreground leading-snug">
                {f.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    ),
    cta: "Set Up Your Business",
    goTo: { to: "/business/new", search: { step: "type" } },
    skippable: false,
  },
};

function Welcome() {
  const { draft, hydrated, bucket } = useOnboarding();
  const navigate = useNavigate();
  const total = visibleSteps(draft, bucket).length;
  const started = draft.completedSteps.length > 0;
  const rise = useArrival("onboarding-intro") ? "animate-rise" : "";

  const [kind, setKind] = useState<AccountKind>("Talent");
  const [showPreview, setShowPreview] = useState(false);
  const info = kindInfo[kind];

  // Touch gesture support: swipe left/right to toggle between Talent and Business
  const touchStart = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches[0]) touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null || !e.changedTouches[0]) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (deltaX < -50 && kind === "Talent") {
      haptic("select");
      setKind("Business");
    } else if (deltaX > 50 && kind === "Business") {
      haptic("select");
      setKind("Talent");
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="mx-auto flex min-h-[100dvh] w-full max-w-app flex-col justify-between bg-background px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-8"
    >
      <div>
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border/60 bg-subtle px-3 py-1 text-1 font-semibold text-muted-foreground",
            rise,
          )}
        >
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          {kind === "Talent" ? `Quick setup · ${total} short questions (~2 mins)` : info.estimate}
        </div>

        <h1
          className={cn("mt-4 text-4 font-bold tracking-tight text-foreground", rise)}
          style={beat(1)}
        >
          Build your industry presence
        </h1>
        <p
          className={cn("mt-2 text-2 leading-relaxed text-muted-foreground", rise)}
          style={beat(2)}
        >
          Tell us about your craft so clients, collaborators, and gigs find you first.
        </p>

        {/* Interactive Profile Kind Cards */}
        <div className={cn("mt-6 space-y-3", rise)} style={beat(2.5)}>
          <div className="flex items-center justify-between">
            <p className="text-1 font-bold uppercase tracking-wider text-muted-foreground">
              Choose account type
            </p>
            <button
              type="button"
              onClick={() => {
                haptic("select");
                setShowPreview(!showPreview);
              }}
              className="inline-flex items-center gap-1 text-1 font-semibold text-muted-foreground hover:text-foreground active:scale-95"
            >
              <Eye size={12} />
              <span>{showPreview ? "Hide preview" : "Live card preview"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                haptic("select");
                setKind("Talent");
              }}
              className={cn(
                "flex flex-col items-start rounded-lg p-4 text-left border transition-all duration-150 ease-standard active:scale-97",
                kind === "Talent"
                  ? "border-foreground bg-card shadow-sm ring-2 ring-foreground/10"
                  : "border-border/80 bg-subtle/50 hover:bg-card hover:border-muted-foreground/40",
              )}
            >
              <span
                className={cn(
                  "mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  kind === "Talent"
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-foreground",
                )}
              >
                <Compass size={18} />
              </span>
              <span className="text-sm font-bold text-foreground">Music Talent</span>
              <span className="mt-0.5 text-1 text-muted-foreground leading-snug">
                Musician, singer, producer, writer
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic("select");
                setKind("Business");
              }}
              className={cn(
                "flex flex-col items-start rounded-lg p-4 text-left border transition-all duration-150 ease-standard active:scale-97",
                kind === "Business"
                  ? "border-foreground bg-card shadow-sm ring-2 ring-foreground/10"
                  : "border-border/80 bg-subtle/50 hover:bg-card hover:border-muted-foreground/40",
              )}
            >
              <span
                className={cn(
                  "mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
                  kind === "Business"
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-foreground",
                )}
              >
                <Sparkles size={18} />
              </span>
              <span className="text-sm font-bold text-foreground">Business / Studio</span>
              <span className="mt-0.5 text-1 text-muted-foreground leading-snug">
                Studio, label, agency, venue
              </span>
            </button>
          </div>
        </div>

        {/* Live Interactive Card Preview or Feature Pitch */}
        {showPreview ? (
          <div className={cn("mt-6", rise)} style={beat(3)}>
            <p className="mb-2 text-0 font-bold uppercase tracking-wider text-muted-foreground">
              What your {kind.toLowerCase()} card looks like:
            </p>
            {kind === "Talent" ? (
              <PersonCard person={demoTalent} disabled />
            ) : (
              <StudioCard studio={demoStudio} disabled />
            )}
          </div>
        ) : (
          <div
            className={cn("mt-6 rounded-lg border border-border/80 bg-card p-4 shadow-xs", rise)}
            style={beat(3)}
          >
            {info.pitch}
          </div>
        )}
      </div>

      <div className={cn("mt-8 space-y-2.5", rise)} style={beat(6)}>
        {kind === "Talent" && hydrated && started ? (
          <BtnLink
            to="/onboarding/resume"
            className="h-12 w-full text-sm font-semibold shadow-xs active:scale-98"
          >
            Continue Setup
          </BtnLink>
        ) : kind === "Talent" ? (
          <Btn
            className="h-12 w-full text-sm font-semibold shadow-xs active:scale-98"
            onClick={() =>
              navigate({
                to: "/onboarding/step/$id",
                params: { id: resumeTarget(draft, bucket) },
              })
            }
          >
            {info.cta}
          </Btn>
        ) : info.goTo ? (
          <BtnLink
            to={info.goTo.to}
            search={info.goTo.search}
            className="h-12 w-full text-sm font-semibold shadow-xs active:scale-98"
          >
            {info.cta}
          </BtnLink>
        ) : null}
        {info.skippable ? (
          <p className="flex justify-center pt-2 text-sm">
            <AuthLink
              to="/onboarding/skip"
              className="font-medium text-muted-foreground hover:text-foreground"
            >
              Skip for Now
            </AuthLink>
          </p>
        ) : null}
      </div>
    </div>
  );
}
