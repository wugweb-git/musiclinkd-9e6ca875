import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Lock, ShieldCheck, Star, type LucideIcon } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { Card, StatusPill, Row } from "@/components/ml/kit";
import { StateCard } from "@/components/ml/portfolio";
import { formatDay, gateFor, useMyVerification } from "@/hooks/use-my-verification";
import { statusLabel, statusTone, overallStatus } from "@/data/verification";
import { listReviewsAboutMe } from "@/lib/reviews.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/verification/")({
  head: () => ({
    meta: [
      { title: "Verification & Trust | MusicLinkd" },
      {
        name: "description",
        content:
          "Verify your identity, professional credits, business or studio to build trust on MusicLinkd.",
      },
      { property: "og:title", content: "Verification & Trust | MusicLinkd" },
      {
        property: "og:description",
        content: "Identity, professional, business and studio verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerificationHub,
});

const overallCopy: Record<string, { title: string; body: string }> = {
  unverified: {
    title: "Not verified yet",
    body: "Start with identity — it takes a few minutes and unlocks every other badge.",
  },
  in_review: {
    title: "One request in review",
    body: "A reviewer is checking your documents by hand. You will get a notification with the decision.",
  },
  verified: {
    title: "You are verified",
    body: "Your badge shows on your profile, listings, reviews and messages.",
  },
  rejected: {
    title: "One request needs changes",
    body: "Open the request below to see what the reviewer asked for.",
  },
  expired: {
    title: "A badge has expired",
    body: "Renew it to keep the badge visible on your listings.",
  },
};

/** Trust signals as a bento: a verified badge leads full width, everyday signals share a row. */
const signalTiles: Record<string, { Icon: LucideIcon; wide: boolean }> = {
  identity: { Icon: ShieldCheck, wide: true },
  professional: { Icon: BadgeCheck, wide: false },
  business: { Icon: BadgeCheck, wide: false },
  studio: { Icon: BadgeCheck, wide: false },
  reviews: { Icon: Star, wide: false },
};

function VerificationHub() {
  const { signedIn } = useAuth();
  const { types, allTypes, requests, history, error, retry } = useMyVerification();
  const overall = overallStatus(requests);
  const copy = overallCopy[overall]!;

  const loadReviews = useServerFn(listReviewsAboutMe);
  const reviews = useQuery({
    queryKey: ["reviews", "about-me"],
    queryFn: () => loadReviews(),
    enabled: signedIn,
  });

  // Only what this account has actually earned or been told — nothing invented per viewer.
  const trustSignals = [
    ...requests
      .filter((r) => r.status === "verified")
      .map((r) => {
        const t = allTypes?.find((x) => x.key === r.type);
        return {
          key: r.type,
          label: `${t?.title ?? r.type} verified`,
          detail: t?.whatOthersSee ?? "",
        };
      }),
    ...(reviews.data && reviews.data.length > 0
      ? [
          {
            key: "reviews",
            label: `${(
              reviews.data.reduce((sum, rv) => sum + rv.rating, 0) / reviews.data.length
            ).toFixed(
              1,
            )} from ${reviews.data.length} review${reviews.data.length === 1 ? "" : "s"}`,
            detail: "Reviews only from completed bookings.",
          },
        ]
      : []),
  ];

  return (
    <Screen>
      <TopBar title="Verification" subtitle="Trust signals across your profile" back="/profile" />
      <div className="space-y-4 px-5 pt-4 pb-4">
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ShieldCheck size={iconSize.md} className="shrink-0 text-primary" aria-hidden />
              <h2 className="min-w-0 text-2 leading-tight">{copy.title}</h2>
            </div>
            <StatusPill label={statusLabel[overall]} tone={statusTone[overall]} />
          </div>
          <p className="text-sm text-muted-foreground">{copy.body}</p>
          <BtnLink to="/verification/choose" className="w-full">
            {overall === "unverified" ? "Get verified" : "Add another badge"}
          </BtnLink>
        </Card>

        <section>
          <h2 className="text-2">Your status</h2>
          <div className="mt-3 space-y-2">
            {error ? (
              <StateCard
                tone="error"
                title="We couldn't load your verification"
                body="Check your connection and try again."
                action={<Btn onClick={retry}>Retry</Btn>}
              />
            ) : types === null ? (
              [0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-card" />)
            ) : (
              types.map((t) => {
                const req = requests.find((v) => v.type === t.key);
                const status = req?.status ?? "unverified";
                const gate = gateFor(t, history);
                return (
                  <Link
                    key={t.key}
                    to="/verification/$type"
                    params={{ type: t.key }}
                    search={{ step: 0 }}
                    className="state-layer block rounded-lg transition-transform duration-125 ease-standard active:scale-97"
                  >
                    <Card className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold">{t.title}</h3>
                          <p className="mt-0.5 truncate text-1 text-muted-foreground">
                            {t.appliesTo} · {t.turnaround}
                          </p>
                        </div>
                        <StatusPill
                          label={statusLabel[status]}
                          tone={statusTone[status]}
                          {...(!gate.allowed && status === "unverified"
                            ? { icon: <Lock size={iconSize.xs} aria-hidden /> }
                            : {})}
                        />
                      </div>
                      <p className="line-clamp-2 text-1 text-muted-foreground">
                        {status === "rejected" && req?.rejectionReason
                          ? req.rejectionReason
                          : status === "expired"
                            ? `Expired ${formatDay(req?.expiresAt)} — renew to keep the badge.`
                            : !gate.allowed && status === "unverified"
                              ? gate.reason
                              : t.blurb}
                      </p>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2">Trust signals people see</h2>
          {trustSignals.length === 0 ? (
            <p className="mt-3 text-1 text-muted-foreground">
              Verify a badge or complete a booking to start building trust signals here.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {trustSignals.map((sig) => {
                const tile = signalTiles[sig.key] ?? { Icon: ShieldCheck, wide: false };
                return (
                  <div
                    key={sig.key}
                    className={`flex flex-col rounded-lg bg-subtle p-4 ${
                      tile.wide ? "col-span-2" : ""
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-foreground">
                      <tile.Icon size={20} strokeWidth={1.75} aria-hidden />
                    </span>
                    <p className="mt-3 text-sm font-semibold leading-snug">{sig.label}</p>
                    <p className="mt-1 text-1 text-muted-foreground">{sig.detail}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-2 pb-4">
          <h2 className="text-2">Related</h2>
          <Row
            title="Where the badge appears"
            subtitle="Profile, search, listings, reviews"
            to="/verification/badge"
          />
          <Row
            title="How your documents are used"
            subtitle="Verification privacy"
            to="/verification/privacy"
          />
          <Row
            title="How verification works"
            subtitle="Guide · 4 min read"
            to="/help/$slug"
            params={{ slug: "how-verification-works" }}
          />
          <Row title="My reviews" subtitle="Trust built from completed work" to="/reviews" />
        </section>
      </div>
    </Screen>
  );
}
