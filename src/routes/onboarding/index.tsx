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
  ArtBooking,
  ArtFader,
  ArtMic,
  ArtTicket,
  ArtPlay,
  ArtSetlist,
  ArtSoon,
  ArtVinyl,
  ArtWave,
} from "@/components/ml/select-art";
import { EMPTY_ART } from "@/components/ml/kit";
import { AuthBackButton, BrandMark } from "@/components/ml/auth";
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

const kindInfo: Record<
  AccountKind,
  {
    goTo?: { to: "/setup/$step"; params: { step: "role" }; search: { persona: "business" } };
  }
> = {
  Talent: {},
  Business: {
    goTo: { to: "/setup/$step", params: { step: "role" }, search: { persona: "business" } },
  },
};

/** The Select screen: talent or business, and a tap continues (owner, 4 Oct 2026). */
function SelectScreen() {
  const { draft, hydrated } = useOnboarding();
  const navigate = useNavigate();
  const total = visibleSteps(draft).length;
  const started = draft.completedSteps.length > 0;
  const rise = useArrival("onboarding-intro") ? "animate-rise" : "";

  const [kind, setKind] = useState<AccountKind>("Talent");
  // Talent is the value used until a real choice is made (copy, preview, step count all read
  // `kind`), but the two cards below shouldn't look like one is already picked — `touched` gates
  // just the selected-card styling, so neither reads as the default (owner, 23 Sep).
  const [touched, setTouched] = useState(false);

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
      if (goTo) void navigate({ to: goTo.to, params: goTo.params, search: goTo.search });
      return;
    }
    if (hydrated && started) {
      void navigate({ to: "/onboarding/resume" });
      return;
    }
    void navigate({ to: "/setup/$step", params: { step: resumeTarget(draft) } });
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
      className="mx-auto flex min-h-[100dvh] w-full max-w-[414px] flex-col justify-between bg-warm px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div>
        {/* Back and the brand mark only (owner, 5 Oct 2026). */}
        <header className="-ml-2.5 flex min-h-12 items-center gap-1">
          <AuthBackButton back={{ to: "/welcome" }} />
          <BrandMark />
        </header>
        <h1 className={cn("mt-4 text-3 font-bold text-foreground", rise)} style={beat(1)}>
          How will you use MusicLinkd?
        </h1>
        <p className={cn("mt-1 text-sm text-muted-foreground", rise)} style={beat(2)}>
          Pick one. You can add the other later.
        </p>

        <div className={cn("mt-6 flex flex-col gap-4", rise)} style={beat(2.5)}>
          <AccountTypeCard
            title="Talent"
            label="Create my profile"
            tag={{ text: "Create profile" }}
            tone="brand"
            photo={EMPTY_ART.work}
            art={[<ArtSetlist key="s" />, <ArtVinyl key="v" />, <ArtMic key="m" />]}
            onSelect={() => {
              haptic("select");
              continueAs("Talent");
            }}
          />
          <AccountTypeCard
            title="Business"
            label="Set up my business"
            tag={{ text: "List or find" }}
            photo="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=70"
            art={[<ArtTicket key="t" />, <ArtBooking key="b" />, <ArtFader key="f" />]}
            onSelect={() => {
              haptic("select");
              continueAs("Business");
            }}
          />
          {/* Academy is on the way (owner, 5 Oct 2026): shown, frosted, not tappable. */}
          <AccountTypeCard
            title="Academy"
            label="Coming soon"
            tag={{ text: "Learn & grow" }}
            art={[<ArtPlay key="p" />, <ArtWave key="w" />, <ArtSoon key="a" />]}
            sticker="Coming soon"
            hollow
          />
        </div>
      </div>
    </div>
  );
}
