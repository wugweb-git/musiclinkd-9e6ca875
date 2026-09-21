import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  House,
  Pencil,
  Share2,
  MapPin,
  Music,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { connectionWith, setFollowing as setFollowingFn } from "@/lib/connections.functions";
import { conversationWith } from "@/lib/messages.functions";
import { shareLink } from "@/lib/booking-actions";
import { SectionTabs, StateIcon, type Move, type SolidIcon } from "./tab-icon";
import { Screen, TopBar, Btn, BtnLink, Chip, IconBtn, IconBtnLink } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Price } from "@/components/ml/kit";
import type { BusinessView } from "@/lib/business-view";
import { TextLink } from "@/components/ml/links";
import { ReviewCard } from "@/components/ml/profile";
import { SavedToggle } from "@/components/ml/saved-toggle";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

// Team is off for now: one business profile belongs to one account (owner, 21 Sep 2026).
type BusinessTab = "Overview" | "Spaces" | "Credits" | "Reviews";

/** Same row as the person profile: icon alone until selected, then solid with its move. */
const tabs: { key: BusinessTab; icon: LucideIcon; solid: SolidIcon; move: Move }[] = [
  { key: "Overview", icon: Sparkles, solid: "sparkle", move: "spin" },
  { key: "Spaces", icon: House, solid: "home", move: "hop" },
  { key: "Credits", icon: Music, solid: "music", move: "dance" },
  { key: "Reviews", icon: Star, solid: "star", move: "stamp" },
];

/** A business account's profile: /business/$id and /profile/$username for a business. */
export function BusinessProfileExperience({ b }: { b: BusinessView | undefined }) {
  const [tab, setTab] = useState<BusinessTab>("Overview");
  const { user } = useAuth();
  const isOwner = !!b && user?.id === b.profileId;

  if (!b) {
    return (
      <Screen>
        <TopBar title="Business" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="This profile may have been removed." />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title={b.name}
        subtitle={b.typeLabel}
        back="/business"
        // Managing is the owner's; a visitor has nothing to manage here.
        right={
          isOwner ? (
            <Link
              to="/business/$id/manage"
              params={{ id: b.id }}
              aria-label="Manage business"
              className="grid h-10 w-10 place-items-center rounded-full bg-background"
            >
              <Settings2 size={iconSize.sm} />
            </Link>
          ) : undefined
        }
      />

      {b.cover ? (
        <img src={b.cover} alt="" className="h-40 w-full object-cover" loading="lazy" />
      ) : (
        <div aria-hidden className="h-40 w-full bg-background" />
      )}

      <div className="space-y-4 px-5 pt-4 pb-6">
        <div className="-mt-10 flex items-end gap-3">
          {b.logo ? (
            <img
              src={b.logo}
              alt=""
              className="h-16 w-16 rounded-lg border-4 border-background object-cover"
              loading="lazy"
            />
          ) : (
            <div
              aria-hidden
              className="h-16 w-16 shrink-0 rounded-lg border-4 border-background bg-background"
            />
          )}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-2 font-bold">{b.name}</h1>
              {b.verified ? <StatusPill label="verified" tone="good" /> : null}
            </div>
            {b.subtitle ? (
              <p className="truncate text-1 text-muted-foreground">{b.subtitle}</p>
            ) : null}
          </div>
          {isOwner ? null : <SavedToggle targetType="business" targetId={b.profileId} size={36} />}
        </div>

        {b.tagline ? <p className="text-1 leading-relaxed">{b.tagline}</p> : null}

        <BusinessActions id={b.id} name={b.name} profileId={b.profileId} owner={isOwner} />

        {b.stats ? (
          <div className="grid grid-cols-4 gap-2 rounded-lg bg-subtle p-3 text-center">
            {b.stats.map(([k, v]) => (
              <div key={k}>
                <p className="text-sm font-bold leading-tight">{v}</p>
                <p className="mt-0.5 text-1 text-muted-foreground">{k}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <SectionTabs tabs={tabs} value={tab} onChange={setTab} label="Business sections" />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {tab === "Overview" ? (
          <>
            {b.about || b.legalName ? (
              <Card className="space-y-2">
                <h2 className="text-sm">About</h2>
                {b.about ? (
                  <p className="text-1 leading-relaxed text-muted-foreground">{b.about}</p>
                ) : null}
                {b.legalName ? (
                  <p className="flex items-start justify-between gap-3 text-1">
                    <span className="text-muted-foreground">Registered</span>
                    <span className="text-right font-semibold">{b.legalName}</span>
                  </p>
                ) : null}
              </Card>
            ) : null}
            {b.services.some((s) => s.status === "active") ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Services & rates</h2>
                {b.services
                  .filter((s) => s.status === "active")
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0"
                    >
                      <span className="min-w-0 flex-1 truncate text-1">{s.label}</span>
                      <Price
                        price={s.price}
                        align="end"
                        className="shrink-0"
                        amountClassName="text-1 font-semibold"
                      />
                    </div>
                  ))}
              </Card>
            ) : null}
            {b.hours.length ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Hours</h2>
                {b.hours.map((h) => (
                  <div key={`${h.day}${h.hours}`} className="flex justify-between gap-3 text-1">
                    <span className="text-muted-foreground">{h.day}</span>
                    <span className="font-semibold">{h.hours}</span>
                  </div>
                ))}
              </Card>
            ) : null}
            {b.address ? (
              <Card className="space-y-2">
                <h2 className="text-sm">Find & contact</h2>
                <p className="flex items-start gap-2 text-1">
                  <MapPin size={iconSize.sm} className="mt-0.5 shrink-0" /> {b.address}
                </p>
              </Card>
            ) : null}
            {b.reviews.length ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm">Reviews</h2>
                  <TextLink
                    to="/business/$id/reviews"
                    params={{ id: b.id }}
                    className="shrink-0 text-1"
                  >
                    See All
                  </TextLink>
                </div>
                {b.reviews.slice(0, 3).map((rv) => (
                  <ReviewCard key={rv.id} r={reviewItem(rv)} />
                ))}
              </section>
            ) : null}
          </>
        ) : null}

        {tab === "Reviews" ? (
          b.reviews.length ? (
            <div className="space-y-3">
              {b.reviews.map((rv) => (
                <ReviewCard key={rv.id} r={reviewItem(rv)} />
              ))}
            </div>
          ) : (
            <EmptyState title="No reviews yet" body="No one has reviewed this business yet." />
          )
        ) : null}

        {tab === "Spaces" ? (
          <div className="space-y-3">
            {b.spaces.map((sp) => (
              <Card key={sp.id} className="space-y-2 overflow-hidden p-0">
                {sp.photo ? (
                  <img src={sp.photo} alt="" className="h-32 w-full object-cover" loading="lazy" />
                ) : null}
                <div className="space-y-2 p-4 pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{sp.name}</p>
                    <Price
                      price={sp.rate}
                      align="end"
                      className="shrink-0"
                      amountClassName="text-1 font-bold"
                    />
                  </div>
                  {sp.detail ? <p className="text-1 text-muted-foreground">{sp.detail}</p> : null}
                  <div className="flex flex-wrap gap-1.5">
                    {sp.gear.map((g) => (
                      <span key={g} className="rounded-full bg-background px-2.5 py-1 text-1">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === "Credits" ? (
          <Card className="space-y-2">
            {b.credits.map((c) => (
              <div key={c.id} className="border-b border-border py-2 last:border-0">
                <p className="text-1 font-semibold">{c.title}</p>
                {c.meta ? <p className="text-1 text-muted-foreground">{c.meta}</p> : null}
              </div>
            ))}
          </Card>
        ) : null}
      </div>
    </Screen>
  );
}

type BusinessReview = BusinessView["reviews"][number];

/** A business review in the shape the person profile's ReviewCard takes. */
const reviewItem = (rv: BusinessReview) => ({
  id: rv.id,
  by: rv.author,
  org: rv.org,
  context: rv.context,
  stars: Number(rv.rating),
  text: rv.body,
  ...(rv.response ? { response: rv.response } : {}),
  tags: rv.tags ?? [],
});

/**
 * What a visitor can do about a business: message it (the thread starts on first message), book
 * it, and follow it. Follow turns the moment it's tapped and settles when the database answers,
 * the same as on a person's profile. Signed out, Message and Follow lead to Welcome.
 */
function BusinessActions({
  id,
  name,
  profileId,
  owner,
}: {
  id: string;
  name: string;
  profileId: string;
  owner: boolean;
}) {
  const { signedIn } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const readConnection = useServerFn(connectionWith);
  const follow = useServerFn(setFollowingFn);
  const openConversation = useServerFn(conversationWith);
  const key = ["connection", profileId] as const;
  const q = useQuery({
    queryKey: key,
    queryFn: () => readConnection({ data: { profileId } }),
    enabled: signedIn && !owner,
  });
  const message = useMutation({
    mutationFn: () => openConversation({ data: { profileId } }),
    onSuccess: ({ id: conversation }) =>
      void navigate({ to: "/conversation/$id", params: { id: conversation } }),
    onError: () => toast.error("Couldn't open that conversation. Try again."),
  });
  const act = useMutation({
    mutationFn: (on: boolean) => follow({ data: { profileId, following: on } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: () => toast.error("That didn't save. Try again."),
  });
  const followOn = act.isPending ? act.variables : (q.data?.following ?? false);

  const book = (
    <BtnLink to="/business/$id/enquiry" params={{ id }} className="min-w-0 flex-1 px-3">
      Book
    </BtnLink>
  );
  // The owner sees what the person profile's owner sees: edit, share, stats — not Book or Follow.
  if (owner) {
    return (
      <div className="flex items-center gap-2">
        <IconBtnLink
          to="/business/$id/manage"
          params={{ id }}
          label="Edit Business"
          variant="ink"
          className="h-11 w-11"
        >
          <Pencil size={iconSize.md} aria-hidden />
        </IconBtnLink>
        <IconBtn
          label="Share Profile"
          variant="outline"
          className="h-11 w-11"
          onClick={() =>
            void shareLink({ title: name, url: `${window.location.origin}/business/${id}` })
          }
        >
          <Share2 size={iconSize.md} aria-hidden />
        </IconBtn>
        <IconBtnLink
          to="/business/$id/dashboard"
          params={{ id }}
          label="Stats"
          variant="outline"
          className="h-11 w-11"
        >
          <BarChart3 size={iconSize.md} aria-hidden />
        </IconBtnLink>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex items-center gap-2">
        <BtnLink
          to="/welcome"
          variant="outline"
          className="min-w-0 flex-1 px-3"
          icon={<Send size={iconSize.sm} aria-hidden />}
        >
          Message
        </BtnLink>
        {book}
        <IconBtnLink label="Follow" to="/welcome" variant="outline" className="h-12 w-12">
          <Plus size={iconSize.md} aria-hidden />
        </IconBtnLink>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Btn
        variant="outline"
        className="min-w-0 flex-1 px-3"
        icon={<Send size={iconSize.sm} aria-hidden />}
        loading={message.isPending}
        onClick={() => message.mutate()}
      >
        Message
      </Btn>
      {book}
      <IconBtn
        label={followOn ? "Following" : "Follow"}
        variant={followOn ? "ghost" : "outline"}
        className="h-12 w-12"
        onClick={() => {
          if (!act.isPending) act.mutate(!followOn);
        }}
      >
        <StateIcon outline={Plus} solid="check" active={followOn} size={iconSize.md} move="stamp" />
      </IconBtn>
    </div>
  );
}
