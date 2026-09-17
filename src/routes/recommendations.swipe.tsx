import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { StatusPill } from "@/components/ml/kit";
import { Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
import { availabilityTone, talents, singers, type Talent } from "@/data/discover";
import { listPeopleByRole } from "@/lib/profile-groups.functions";
import { saveTarget } from "@/lib/saved.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/recommendations/swipe")({
  head: () => ({
    meta: [
      { title: "Recommended For You | MusicLinkd" },
      {
        name: "description",
        content:
          "Swipe through singers, studios, collaborators and opportunities matched to your genres, languages and city.",
      },
      { property: "og:title", content: "Recommended For You | MusicLinkd" },
      {
        property: "og:description",
        content: "A Tinder-fast way to shortlist your next collaborator.",
      },
    ],
  }),
  component: Recommended,
});

type DeckCard = {
  id: string;
  name: string;
  photo: string;
  role: string;
  location: string;
  genres: string[];
  verified: boolean;
  availability?: Talent["availability"];
  why: string;
  /** Set only for a real profile — lets Save persist to the real saved_items table. */
  targetId?: string;
};

const seedDeck: DeckCard[] = [
  { ...talents[0]!, why: "Matches Hindi Film + Sufi · Mumbai" },
  { ...singers[2]!, why: "Trending with your network · Hip-Hop" },
  { ...talents[1]!, why: "Worked with 3 people you follow" },
  { ...talents[4]!, why: "Composer for your saved brief" },
];

function Recommended() {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<"" | "left" | "right">("");
  const { signedIn } = useAuth();

  const load = useServerFn(listPeopleByRole);
  const people = useQuery({
    queryKey: ["people", "recommended"],
    queryFn: () => load({ data: { limit: 20 } }),
  });
  const save = useServerFn(saveTarget);

  // Real profiles once there are enough to swipe through; the curated seed deck otherwise, so
  // the screen is never empty while the directory is still small.
  const deck: DeckCard[] =
    (people.data?.length ?? 0) >= 3
      ? people.data!.map((p) => ({
          id: p.id,
          name: p.name,
          photo: p.avatarUrl ?? "",
          role: p.roles[0] ?? "",
          location: p.city ?? "",
          genres: p.genres,
          verified: p.verified,
          why: [p.roles[0], p.city].filter(Boolean).join(" · ") || "New on MusicLinkd",
          targetId: p.id,
        }))
      : seedDeck;

  const swipe = (d: "left" | "right", target?: DeckCard) => {
    setDir(d);
    if (d === "right" && target?.targetId) {
      if (!signedIn) {
        toast("Sign in to save this");
      } else {
        void save({ data: { targetType: "talent", targetId: target.targetId } }).catch(() =>
          toast.error("Couldn't save — try again"),
        );
      }
    }
    setTimeout(() => {
      setDir("");
      setI((x) => (x + 1) % deck.length);
    }, 220);
  };

  const current = deck[i % deck.length]!;
  const next = deck[(i + 1) % deck.length]!;

  return (
    <Screen>
      <TopBar
        title="Recommended for you"
        subtitle="Genres · Languages · Location · Activity"
        back="/discover"
      />

      <div className="rail flex gap-2 overflow-x-auto px-5 py-3 no-scrollbar">
        {["Singers", "Studios", "Collaborators", "Opportunities"].map((c, idx) => (
          <span
            key={c}
            className={`shrink-0 rounded-full px-4 py-2 text-1 font-semibold ${
              idx === 0 ? "bg-ink text-background" : "border border-border bg-card"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="relative mx-5 h-[440px]">
        <Card card={next} className="scale-[0.94] translate-y-3 opacity-60" />
        <Card
          card={current}
          className={
            dir === "left"
              ? "-translate-x-[120%] -rotate-12 opacity-0"
              : dir === "right"
                ? "translate-x-[120%] rotate-12 opacity-0"
                : ""
          }
        />
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={() => swipe("left")}
          className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-3"
          aria-label="Skip"
        >
          ✕
        </button>
        <button
          onClick={() => swipe("right", current)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-3"
          aria-label="Save"
        >
          ♡
        </button>
        <button
          onClick={() => swipe("right", current)}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-3 text-primary-foreground"
          aria-label="Connect"
        >
          ⚡
        </button>
      </div>
      <p className="mt-3 text-center text-1 text-muted-foreground">
        Swipe right to shortlist · left to skip
      </p>
    </Screen>
  );
}

function Card({ card, className = "" }: { card: DeckCard; className?: string }) {
  return (
    <article
      className={`absolute inset-0 overflow-hidden rounded-3xl bg-subtle transition-all duration-200 ${className}`}
    >
      {card.photo ? (
        <img src={card.photo} alt={card.name} className="h-[300px] w-full object-cover" />
      ) : (
        <div className="h-[300px] w-full bg-background" aria-hidden />
      )}
      <div className="absolute left-4 top-4">
        <span className="rounded-full bg-card/90 px-3 py-1.5 text-1 font-bold">{card.why}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="text-2">{card.name}</h3>
            {card.verified ? <VerifiedBadge /> : null}
          </div>
          {card.availability ? (
            <StatusPill label={card.availability} tone={availabilityTone(card.availability)} />
          ) : null}
        </div>
        <p className="text-1 text-muted-foreground">
          {card.role} · {card.location}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {card.genres.map((g) => (
            <span
              key={g}
              className="rounded-full bg-background px-2.5 py-1 text-1 font-semibold text-muted-foreground"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
