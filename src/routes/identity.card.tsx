/**
 * FLOW-23 · QR-18 "Share card" · route: /identity/card
 * states: ready, generating, share error · actions: share, download, copy
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, RefreshCcw, Share2 } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import {
  QrIdentityCard,
  CopyLinkRow,
  StateCard,
  Skeleton,
  DownloadNote,
  nativeShare,
} from "@/components/ml/qr";
import { canonicalUrl, myIdentity } from "@/data/identity";

export const Route = createFileRoute("/identity/card")({
  head: () => ({
    meta: [
      { title: "MusicLinkd share card" },
      {
        name: "description",
        content:
          "A ready-to-post identity card with your name, role and QR — for stories, group chats and press kits.",
      },
      { property: "og:title", content: "MusicLinkd share card" },
      { property: "og:description", content: "Post it, print it, hand it over." },
    ],
  }),
  component: ShareCard,
});

function ShareCard() {
  const [phase, setPhase] = useState<"generating" | "ready" | "error">("generating");
  const url = canonicalUrl(myIdentity.code);

  useEffect(() => {
    if (phase !== "generating") return;
    const t = setTimeout(() => setPhase("ready"), 500);
    return () => clearTimeout(t);
  }, [phase]);

  return (
    <Screen>
      <TopBar title="Share card" subtitle="Story and print ready" back="/identity/qr" />
      <main className="px-5 pt-4">
        {phase === "generating" ? (
          <Skeleton className="h-[430px] w-full" />
        ) : phase === "error" ? (
          <StateCard
            title="Couldn't build the card"
            body="Something interrupted the export. Try building it again."
          >
            <Btn onClick={() => setPhase("generating")}>
              <RefreshCcw size={16} className="mr-2" /> Try again
            </Btn>
          </StateCard>
        ) : (
          <>
            <QrIdentityCard
              name={myIdentity.name}
              role={myIdentity.role}
              photo={myIdentity.photo}
              verified={myIdentity.verified}
              handle={myIdentity.username}
              code={myIdentity.code}
              style="branded"
              tagline={myIdentity.tagline}
            />

            <div className="mt-3">
              <CopyLinkRow url={url} />
            </div>

            <div className="mt-3 flex gap-2">
              <Btn
                className="flex-1"
                onClick={() =>
                  void nativeShare({
                    title: `${myIdentity.name} on MusicLinkd`,
                    text: myIdentity.tagline,
                    url,
                  })
                }
              >
                <Share2 size={16} className="mr-2" /> Share card
              </Btn>
              <Btn variant="outline" className="flex-1" onClick={() => toast.success("Card saved")}>
                <Download size={16} className="mr-2" /> Download
              </Btn>
            </div>

            <div className="mt-3">
              <DownloadNote />
            </div>

            <button
              type="button"
              onClick={() => setPhase("error")}
              className="mt-4 w-full text-[12px] text-muted-foreground underline"
            >
              Preview the export-failed state
            </button>
          </>
        )}
      </main>
    </Screen>
  );
}
