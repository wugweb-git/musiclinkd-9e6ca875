import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { Screen, TopBar } from "@/components/ml/ui";
import { Card, Row } from "@/components/ml/kit";
import { privacyPoints, verificationFaq } from "@/data/verification";

export const Route = createFileRoute("/verification/privacy")({
  head: () => ({
    meta: [
      { title: "Verification privacy | MusicLinkd" },
      {
        name: "description",
        content:
          "What MusicLinkd stores during verification, who reviews it, and how to withdraw a request.",
      },
      { property: "og:title", content: "Verification privacy | MusicLinkd" },
      {
        property: "og:description",
        content: "Your verification documents are never shown publicly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VerificationPrivacy,
});

function VerificationPrivacy() {
  return (
    <Screen>
      <TopBar
        title="Document privacy"
        subtitle="What happens to what you upload"
        back="/verification"
      />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="flex gap-3">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
          <p className="text-[13px] text-text2">
            Verification documents are private. Other members only ever see the badge and its
            status.
          </p>
        </Card>

        <div className="space-y-2">
          {privacyPoints.map((p) => (
            <Card key={p.title} className="py-3">
              <h2 className="text-[14px]">{p.title}</h2>
              <p className="mt-1 text-[12px] text-text2">{p.body}</p>
            </Card>
          ))}
        </div>

        <section>
          <h2 className="text-[15px]">Common questions</h2>
          <div className="mt-3 space-y-2">
            {verificationFaq.map((f) => (
              <Card key={f.q} className="py-3">
                <p className="text-[13px] font-semibold">{f.q}</p>
                <p className="mt-1 text-[12px] text-text2">{f.a}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-[15px]">Related</h2>
          <Row
            title="How verification works"
            subtitle="Full guide"
            to="/help/$slug"
            params={{ slug: "how-verification-works" }}
          />
          <Row
            title="Back to verification"
            subtitle="Your badges and requests"
            to="/verification"
          />
        </section>
      </div>
    </Screen>
  );
}
