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
  Mic2,
  Guitar,
  Headphones,
  Music,
  Disc3,
  Ticket,
  SlidersVertical,
  Clock,
  Plus,
} from "lucide-react";
import { Btn, BtnLink } from "@/components/ml/ui";
import {
  AccountTypeCard,
  OnboardingProvider,
  useOnboarding,
  resumeTarget,
} from "@/components/ml/onboarding";
import { visibleSteps } from "@/data/onboarding";
import { AuthLink } from "@/components/ml/auth";
import { beat, useArrival } from "@/lib/flow-motion";
import { cn } from "@/lib/utils";
import { iconSize } from "@/lib/tokens";
import { haptic } from "@/lib/haptics";
import { PersonCard, BookableCard } from "@/components/ml/cards";
import type { DirectoryPerson } from "@/lib/profile-groups.functions";
import type { DiscoverBookable } from "@/lib/bookable-view";

export const Route = createFileRoute("/onboarding/")({
  head: () => ({
    meta: [
      { title: "Select — MusicLinkd" },
      {
        name: "description",
        content:
          "Tell MusicLinkd what you do in music — role, genres, languages, city and availability — so the right work finds you.",
      },
      { property: "og:title", content: "Select — MusicLinkd" },
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
      <SelectScreen />
    </OnboardingProvider>
  ),
});

const kindOrder = ["Talent", "Business"] as const;
type AccountKind = (typeof kindOrder)[number];

// The wizard's "what your card will look like" preview, in the exact shapes the real
// PersonCard/BookableCard take — so the preview and the live card are always the same component.
const demoTalent: DirectoryPerson = {
  id: "preview-talent",
  username: "you",
  name: "Your Name",
  headline: "Say what you do and where — this is your headline.",
  city: "Mumbai",
  roles: [],
  genres: [],
  avatarUrl: null,
  // A preview of someone who has just signed up: nobody is verified yet.
  verified: false,
  pin_code: null,
  rating: null,
  reviewCount: 0,
};

// A preview of a business that has just signed up: no reviews, no rate, no photo and no badge yet.
const demoStudio: DiscoverBookable = {
  id: "preview-business",
  slug: "",
  username: "",
  name: "Your Business Name",
  location: "Mumbai",
  rating: null,
  reviewCount: 0,
  verified: false,
  rate: null,
  photo: "",
  gear: [],
};

const kindInfo: Record<
  AccountKind,
  {
    estimate: string;
    goTo?: { to: "/business/new"; search: { step: "type" } };
  }
> = {
  Talent: {
    estimate: "~2 mins · 8 quick questions",
  },
  Business: {
    estimate: "~3 mins · Studio registration",
    goTo: { to: "/business/new", search: { step: "type" } },
  },
};

/** The Select screen: talent or business, and a tap continues (owner, 4 Oct 2026). */
function SelectScreen() {
  const { draft, hydrated, bucket } = useOnboarding();
  const navigate = useNavigate();
  const total = visibleSteps(draft, bucket).length;
  const started = draft.completedSteps.length > 0;
  const rise = useArrival("onboarding-intro") ? "animate-rise" : "";

  const [kind, setKind] = useState<AccountKind>("Talent");
  // Talent is the value used until a real choice is made (copy, preview, step count all read
  // `kind`), but the two cards below shouldn't look like one is already picked — `touched` gates
  // just the selected-card styling, so neither reads as the default (owner, 23 Sep).
  const [touched, setTouched] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const info = kindInfo[kind];

  /*
   * Tapping an account type is the choice and the next step at once (owner, 4 Oct 2026): this
   * screen has no Let's Start and no Skip for Now. Talent goes to its next question (or the resume
   * screen once started); Business goes to business setup.
   */
  const continueAs = (next: AccountKind) => {
    setKind(next);
    setTouched(true);
    if (next === "Business") {
      const goTo = kindInfo.Business.goTo;
      if (goTo) void navigate({ to: goTo.to, search: goTo.search });
      return;
    }
    if (hydrated && started) {
      void navigate({ to: "/onboarding/resume" });
      return;
    }
    void navigate({ to: "/onboarding/step/$id", params: { id: resumeTarget(draft, bucket) } });
  };

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
      setTouched(true);
    } else if (deltaX > 50 && kind === "Business") {
      haptic("select");
      setKind("Talent");
      setTouched(true);
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
            "inline-flex items-center gap-2 text-1 font-semibold text-muted-foreground",
            rise,
          )}
        >
          <span className="h-2 w-2 rounded-full bg-ink animate-pulse" />
          {kind === "Talent" ? `Quick setup · ${total} short questions (~2 mins)` : info.estimate}
        </div>

        <h1 className={cn("mt-4 text-4 font-bold text-foreground", rise)} style={beat(1)}>
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
            <p className="eyebrow text-muted-foreground">Choose account type</p>
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

          <div className="flex flex-col gap-3">
            <AccountTypeCard
              title="Music Talent"
              description="Musician, singer, producer, writer"
              icon={Compass}
              cluster={[Mic2, Guitar, Headphones, Music]}
              onSelect={() => {
                haptic("select");
                continueAs("Talent");
              }}
            />
            <AccountTypeCard
              title="Business"
              description="Studio, label, agency, venue"
              icon={Sparkles}
              cluster={[Building2, Disc3, Ticket, SlidersVertical]}
              onSelect={() => {
                haptic("select");
                continueAs("Business");
              }}
            />
            {/* A third account type is on the way (owner, 4 Oct 2026): shown, hollow, not tappable. */}
            <AccountTypeCard
              title="Upcoming"
              description="A new account type is on the way"
              icon={Clock}
              cluster={[Plus, Sparkles, Plus]}
              hollow
            />
          </div>
        </div>

        {/* Live card preview, on request. The feature pitch box under the cards is gone (owner, 4 Oct 2026). */}
        {showPreview ? (
          <div className={cn("mt-6", rise)} style={beat(3)}>
            <p className="eyebrow mb-2 text-muted-foreground">
              What your {kind.toLowerCase()} card looks like:
            </p>
            {kind === "Talent" ? (
              <PersonCard person={demoTalent} disabled />
            ) : (
              <BookableCard studio={demoStudio} disabled />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
