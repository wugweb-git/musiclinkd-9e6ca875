import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, StatusPill, Row, EmptyState } from "@/components/ml/kit";
import { verificationTypes, myVerifications, statusLabel, statusTone, trustSignals } from "@/data/verification";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Verification & Trust | MusicLinkd" },
      { name: "description", content: "Verify your identity, professional credits, business or studio to build trust on MusicLinkd." },
      { property: "og:title", content: "Verification & Trust | MusicLinkd" },
      { property: "og:description", content: "Identity, professional, business and studio verification." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VerificationHub,
});

function VerificationHub() {
  return (
    <Screen>
      <TopBar title="Verification" subtitle="Trust signals across your profile" back="/me" />
      <div className="space-y-4 px-5 pt-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-primary" aria-hidden />
            <h2 className="text-[17px] leading-tight">Why verification matters</h2>
          </div>
          <p className="text-[13px] text-text2">
            Verified profiles rank higher in Discover and Search, can be booked without a deposit, and show badges on listings, reviews and messages.
          </p>
        </Card>

        <section>
          <h2 className="text-[15px]">Your status</h2>
          <div className="mt-3 space-y-2">
            {verificationTypes.map((t) => {
              const req = myVerifications.find((v) => v.type === t.key);
              const status = req?.status ?? "unverified";
              return (
                <Link key={t.key} to="/verification/$type" params={{ type: t.key }} className="block">
                  <Card className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px]">{t.title}</h3>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{t.appliesTo} · {t.turnaround}</p>
                      </div>
                      <StatusPill label={statusLabel[status]} tone={statusTone[status]} />
                    </div>
                    <p className="line-clamp-2 text-[12px] text-text2">{req?.reason ?? t.blurb}</p>
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
          <Row title="How verification works" subtitle="Guide · 4 min read" to="/help/$slug" params={{ slug: "how-verification-works" }} />
          <Row title="My reviews" subtitle="Trust built from completed work" to="/reviews" />
          <Row title="Report a problem" subtitle="Trust & safety" to="/help/$slug" params={{ slug: "community-guidelines" }} />
        </section>

        {myVerifications.length === 0 ? (
          <EmptyState title="Nothing submitted yet" body="Start with identity verification — every other badge depends on it.">
            <Link to="/verification/$type" params={{ type: "identity" }}><Btn className="w-full">Verify identity</Btn></Link>
          </EmptyState>
        ) : null}
      </div>
    </Screen>
  );
}
