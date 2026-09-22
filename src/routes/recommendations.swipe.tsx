import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Heart, MapPin, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Screen, TopBar, BtnLink, IconBtn, IconBtnLink, VerifiedBadge } from "@/components/ml/ui";
import { EmptyState, Loading } from "@/components/ml/kit";
import { PersonAvatar } from "@/components/ml/person-avatar";
import { StatusBadge } from "@/components/ml/profile";
import { useAuth } from "@/hooks/use-auth";
import { useRecommendations } from "@/hooks/use-recommendations";
import type { RecommendedPerson } from "@/lib/recommendations.functions";
import { saveTarget } from "@/lib/saved.functions";
import { skipRecommendedPerson } from "@/lib/discovery-settings.functions";
import { availabilityOfRow } from "@/lib/profile-view";
import { labelFor, useTaxonomy, type TaxonomyOption } from "@/lib/taxonomy";
import { iconSize } from "@/lib/tokens";

/*
 * The swipe deck: the people getMyRecommendations ranks for the signed-in person, one card at a
 * time, each with every reason it scored. Right (or the heart) saves the person to Saved; left (or
 * the cross) skips them, and a skipped person is not suggested again until the feedback is cleared
 * in discovery settings (/recommendations/settings).
 */
export const Route = createFileRoute("/recommendations/swipe")({
  head: () => ({
    meta: [
      { title: "Recommended for you | MusicLinkd" },
      {
        name: "description",
        content: "People recommended from your roles, genres, city, follows and saves.",
      },
      { property: "og:title", content: "Recommended for you | MusicLinkd" },
      {
        property: "og:description",
        content: "Save or skip people recommended for you.",
      },
    ],
  }),
  component: Recommended,
});

/** How far a card is dragged before letting go counts as a swipe. */
const SWIPE_AT = 100;

function Recommended() {
  const { signedIn, loading } = useAuth();
  const recs = useRecommendations();
  const { options } = useTaxonomy();
  const queryClient = useQueryClient();
  const save = useServerFn(saveTarget);
  const skip = useServerFn(skipRecommendedPerson);
  const [gone, setGone] = useState<Set<string>>(() => new Set());
  const [leaving, setLeaving] = useState<"" | "left" | "right">("");
  const [dx, setDx] = useState(0);
  const drag = useRef<{ x: number; id: number } | null>(null);

  const deck = (recs?.people ?? []).filter((p) => !gone.has(p.id));
  const current = deck[0];
  const next = deck[1];

  const swipe = (d: "left" | "right") => {
    if (!current || leaving) return;
    const person = current;
    setLeaving(d);
    if (d === "right") {
      void save({ data: { targetType: "talent", targetId: person.id } })
        .then(() => toast(`${person.name} saved`))
        .catch(() => toast.error("Couldn't save. Try again."));
    } else {
      void skip({ data: { profileId: person.id } }).catch(() => undefined);
    }
    setTimeout(() => {
      setGone((g) => new Set(g).add(person.id));
      setLeaving("");
      setDx(0);
      // The rails elsewhere leave out saved and skipped people too.
      if (deck.length <= 1) void queryClient.invalidateQueries({ queryKey: ["recommendations"] });
    }, 220);
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest("a")) return;
    drag.current = { x: e.clientX, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (drag.current?.id === e.pointerId) setDx(e.clientX - drag.current.x);
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    if (dx > SWIPE_AT) swipe("right");
    else if (dx < -SWIPE_AT) swipe("left");
    else setDx(0);
  };

  const settingsLink = (
    <IconBtnLink to="/recommendations/settings" label="Discovery settings">
      <SlidersHorizontal size={iconSize.md} aria-hidden />
    </IconBtnLink>
  );

  let body;
  if (!loading && !signedIn) {
    body = (
      <EmptyState
        icon={<Sparkles size={iconSize.lg} aria-hidden />}
        title="Sign in to see recommendations"
        body="Recommendations come from your profile, the people you follow and what you save."
        action={<BtnLink to="/welcome">Sign in</BtnLink>}
      />
    );
  } else if (!recs) {
    body = <Loading rows={2} />;
  } else if (!current) {
    body = (
      <EmptyState
        icon={<Sparkles size={iconSize.lg} aria-hidden />}
        title={recs.people.length ? "That's everyone for now" : "Not enough to go on yet"}
        body={
          recs.people.length
            ? "Saved people are in Saved. Change your discovery settings to see different people."
            : "Add your roles, genres and city to your profile, or pick them in discovery settings."
        }
        action={<BtnLink to="/recommendations/settings">Discovery settings</BtnLink>}
      />
    );
  } else {
    const offset = leaving === "left" ? -480 : leaving === "right" ? 480 : dx;
    body = (
      <>
        <div className="relative h-[460px]">
          {next ? (
            <DeckCard
              person={next}
              roleLabels={options?.person_types}
              genreLabels={options?.genres}
              className="translate-y-3 scale-[0.94] opacity-60"
            />
          ) : null}
          <DeckCard
            key={current.id}
            person={current}
            roleLabels={options?.person_types}
            genreLabels={options?.genres}
            className={`touch-pan-y ${dx && !leaving ? "" : "transition-all duration-200"} ${leaving ? "opacity-0" : ""}`}
            style={{ transform: `translateX(${offset}px) rotate(${offset / 24}deg)` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          />
        </div>
        <div className="mt-6 flex items-center justify-center gap-6">
          <IconBtn label="Skip" className="h-14 w-14" onClick={() => swipe("left")}>
            <X size={iconSize.lg} aria-hidden />
          </IconBtn>
          <IconBtn label="Save" variant="ink" className="h-14 w-14" onClick={() => swipe("right")}>
            <Heart size={iconSize.lg} aria-hidden />
          </IconBtn>
        </div>
        <p className="mt-3 text-center text-1 text-muted-foreground">
          Swipe right to save, left to skip
        </p>
      </>
    );
  }

  return (
    <Screen>
      <TopBar
        title="Recommended for you"
        subtitle="Roles · Genres · Location · Activity"
        back="/discover"
        right={settingsLink}
      />
      <div className="px-5 pt-2 pb-8">{body}</div>
    </Screen>
  );
}

function DeckCard({
  person,
  roleLabels,
  genreLabels,
  className = "",
  style,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  person: RecommendedPerson;
  roleLabels: TaxonomyOption[] | undefined;
  genreLabels: TaxonomyOption[] | undefined;
  className?: string;
  style?: CSSProperties;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp?: () => void;
  onPointerCancel?: () => void;
}) {
  const availability = availabilityOfRow(person.availability);
  const roles = person.roles
    .slice(0, 2)
    .map((r) => labelFor(roleLabels, r))
    .join(" · ");
  const genres = person.genres
    .slice(0, 4)
    .map((g) => labelFor(genreLabels, g))
    .join(" · ");
  return (
    <article
      className={`absolute inset-0 select-none overflow-hidden rounded-lg bg-subtle ${className}`}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="flex h-[220px] items-center justify-center bg-background">
        <PersonAvatar
          name={person.name}
          photo={person.avatarUrl}
          className="pointer-events-none h-36 w-36 text-4"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/profile/$username"
            params={{ username: person.username }}
            className="flex min-w-0 items-center gap-1.5"
          >
            <h2 className="truncate text-2">{person.name}</h2>
            {person.verified ? <VerifiedBadge /> : null}
          </Link>
          {availability ? <StatusBadge status={availability} /> : null}
        </div>
        {roles || person.city ? (
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-1 text-muted-foreground">
            <span className="truncate">{roles}</span>
            {person.city ? (
              <>
                <MapPin size={iconSize.xs} className="ml-1 shrink-0" aria-hidden />
                <span className="truncate">{person.city}</span>
              </>
            ) : null}
          </p>
        ) : null}
        {genres ? <p className="mt-1 truncate text-1 text-muted-foreground">{genres}</p> : null}
        <ul className="mt-3 space-y-1 border-t border-border pt-3">
          {person.reasons.slice(0, 3).map((r) => (
            <li key={r} className="flex items-start gap-1.5 text-1 text-foreground">
              <Sparkles size={iconSize.xs} className="mt-0.5 shrink-0" aria-hidden />
              <span className="line-clamp-2">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
