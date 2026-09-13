import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Lock } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, StatusPill, Row } from "@/components/ml/kit";
import {
  verificationTypes,
  myVerifications,
  statusLabel,
  statusTone,
  trustSignals,
  overallStatus,
  eligibility,
} from "@/data/verification";

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

function VerificationHub() {
  const overall = overallStatus();
  const copy = overallCopy[overall]!;

  return (
    <Screen>
      <TopBar title="Verification" subtitle="Trust signals across your profile" back="/me" />
      <div className="space-y-4 px-5 pt-4 pb-4">
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ShieldCheck size={18} className="shrink-0 text-primary" aria-hidden />
              <h2 className="min-w-0 text-[17px] leading-tight">{copy.title}</h2>
            </div>
            <StatusPill label={statusLabel[overall]} tone={statusTone[overall]} />
          </div>
          <p className="text-[13px] text-muted-foreground">{copy.body}</p>
          <BtnLink to="/verification/choose" className="w-full">
            {overall === "unverified" ? "Get verified" : "Add another badge"}
          </BtnLink>
        </Card>

        <section>
          <h2 className="text-[15px]">Your status</h2>
          <div className="mt-3 space-y-2">
            {verificationTypes.map((t) => {
              const req = myVerifications.find((v) => v.type === t.key);
              const status = req?.status ?? "unverified";
              const gate = eligibility(t.key);
              return (
                <Link
                  key={t.key}
                  to="/verification/$type"
                  params={{ type: t.key }}
                  search={{ step: 0 }}
                  className="block"
                >
                  <Card className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px]">{t.title}</h3>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                          {t.appliesTo} · {t.turnaround}
                        </p>
                      </div>
                      <StatusPill
                        label={statusLabel[status]}
                        tone={statusTone[status]}
                        {...(!gate.allowed && status === "unverified"
                          ? { icon: <Lock size={11} aria-hidden /> }
                          : {})}
                      />
                    </div>
                    <p className="line-clamp-2 text-[12px] text-muted-foreground">
                      {status === "rejected" && req?.reason
                        ? req.reason
                        : status === "expired"
                          ? `Expired ${req?.expiresOn ?? ""} — renew to keep the badge.`
                          : !gate.allowed && status === "unverified"
                            ? gate.reason
                            : t.blurb}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-[15px]">Trust signals people see</h2>
          <div className="mt-3 space-y-2">
            {trustSignals.map((s) => (
              <Card key={s.key} className="py-3">
                <p className="text-[13px] font-semibold">{s.label}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">{s.detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-2 pb-4">
          <h2 className="text-[15px]">Related</h2>
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
