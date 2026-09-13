/**
 * FLOW-23 · QR-08..16 destination results + QR-29..35 invalid / expired / private /
 * deleted / deactivated / offline / error states.
 * route: /identity/q/$code — the canonical resolver for every MusicLinkd QR.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageCircle, ScanLine, Share2, UserPlus } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import {
  DestinationPreviewCard,
  StateCard,
  Skeleton,
  PrimaryPair,
  nativeShare,
} from "@/components/ml/qr";
import { canonicalUrl, previewFor, resolveCode, statusCopy } from "@/data/identity";

export const Route = createFileRoute("/identity/q/$code")({
  head: () => ({
    meta: [
      { title: "Scanned MusicLinkd code" },
      {
        name: "description",
        content:
          "Preview where a MusicLinkd QR leads before you open it — profile, business, service, listing or portfolio work.",
      },
      { property: "og:title", content: "Scanned MusicLinkd code" },
      {
        property: "og:description",
        content: "Every MusicLinkd code resolves to a public, canonical destination.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: QrResult,
});

function QrResult() {
  const { code } = Route.useParams();
  const nav = useNavigate();
  const [phase, setPhase] = useState<"loading" | "done" | "offline">("loading");

  useEffect(() => {
    setPhase("loading");
    const online = typeof navigator === "undefined" || navigator.onLine;
    const t = setTimeout(() => setPhase(online ? "done" : "offline"), 420);
    return () => clearTimeout(t);
  }, [code]);

  const dest = resolveCode(code);
  const preview = previewFor(dest);
  const url = canonicalUrl(code);

  return (
    <Screen bottomNav={false}>
      <TopBar title="Scanned code" subtitle={`musiclinkd.app/q/${code}`} back="/identity/scan" />

      <main className="px-5 pt-4">
        {phase === "loading" ? (
          <div className="flex flex-col gap-3" aria-busy>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : phase === "offline" ? (
          <StateCard
            title="You're offline"
            body="We can't open this code until you're back online. The code stays valid."
          >
            <Btn onClick={() => setPhase("done")}>Try again</Btn>
            <Link to="/identity/scan">
              <Btn variant="outline" className="w-full">
                Back to scanner
              </Btn>
            </Link>
          </StateCard>
        ) : preview ? (
          <>
            <DestinationPreviewCard preview={preview} />

            <div className="mt-4">
              <PrimaryPair
                primary={{
                  label: "Open on MusicLinkd",
                  onClick: () => void nav({ href: preview.route }),
                }}
                secondary={{
                  label: "Share",
                  onClick: () => void nativeShare({ title: preview.title, url }),
                }}
              />
            </div>

            {preview.kind === "profile" || preview.kind === "business" ? (
              <div className="mt-2 flex gap-2">
                <Btn
                  variant="outline"
                  className="flex-1"
                  onClick={() => void nav({ to: "/messages" })}
                >
                  <MessageCircle size={16} className="mr-2" /> Message
                </Btn>
                <Btn
                  variant="ghost"
                  className="flex-1"
                  onClick={() => void nav({ href: preview.route })}
                >
                  <UserPlus size={16} className="mr-2" /> Connect
                </Btn>
              </div>
            ) : null}

            <div className="mt-6 rounded-[24px] border border-border bg-card p-4">
              <p className="text-[13px] font-semibold">Why you can trust this</p>
              <p className="mt-1 text-[12px] text-muted-foreground">
                The code carries only a MusicLinkd address. Nothing personal is stored inside it,
                and the destination always shows here before it opens.
              </p>
            </div>

            <div className="mt-3">
              <Link to="/identity/scan">
                <Btn variant="ghost" className="w-full">
                  <ScanLine size={16} className="mr-2" /> Scan another code
                </Btn>
              </Link>
            </div>
          </>
        ) : (
          <StateCard
            title={statusCopy[dest.status === "active" ? "invalid" : dest.status].title}
            body={statusCopy[dest.status === "active" ? "invalid" : dest.status].body}
          >
            <Link to="/identity/scan">
              <Btn className="w-full">
                {statusCopy[dest.status === "active" ? "invalid" : dest.status].cta}
              </Btn>
            </Link>
            <Link to="/">
              <Btn variant="outline" className="w-full">
                <Share2 size={16} className="mr-2" /> Discover on MusicLinkd
              </Btn>
            </Link>
          </StateCard>
        )}
      </main>
    </Screen>
  );
}
