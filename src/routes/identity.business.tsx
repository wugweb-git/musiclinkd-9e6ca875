/**
 * FLOW-23 · QR-03 "Business QR" · route: /identity/business
 * dataSource: businessProfile, share · states: ready · actions: share, download, copy
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Printer, Share2 } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { QrIdentityCard, CopyLinkRow, ShareActions, DownloadNote } from "@/components/ml/qr";
import { useMyBusinessIdentity } from "@/hooks/use-my-business-identity";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/identity/business")({
  head: () => ({
    meta: [
      { title: "Business QR — Octave Sound Labs on MusicLinkd" },
      {
        name: "description",
        content:
          "A scannable QR for your studio or business profile: print it for reception, posters and event stands.",
      },
      { property: "og:title", content: "Business QR on MusicLinkd" },
      {
        property: "og:description",
        content: "Turn a printed code into bookings, messages and follows.",
      },
    ],
  }),
  component: BusinessQr,
});

function BusinessQr() {
  const [share, setShare] = useState(false);
  const business = useMyBusinessIdentity();
  const url = business.url;

  return (
    <Screen>
      <TopBar title="Business QR" subtitle={business.name} back="/identity/qr" />
      <main className="px-5 pt-4">
        {!business.ready ? (
          <div className="h-[280px] animate-pulse rounded-lg bg-subtle" aria-busy />
        ) : url ? (
          <QrIdentityCard
            name={business.name}
            role={business.category}
            photo={business.logo}
            verified={business.verified}
            handle={business.username ?? ""}
            url={url}
            tagline={business.city}
          />
        ) : (
          <div className="rounded-lg bg-subtle p-5 text-center">
            <h1 className="text-2 font-semibold">Claim a username first</h1>
            <p className="mt-1 text-1 text-muted-foreground">
              Your business QR points at your public profile, and that needs a username.
            </p>
          </div>
        )}

        <div className={`mt-3 ${url ? "" : "hidden"}`}>
          <CopyLinkRow url={url} />
        </div>

        <div className={`mt-3 flex gap-2 ${url ? "" : "hidden"}`}>
          <Btn className="flex-1" onClick={() => setShare(true)}>
            <Share2 size={iconSize.sm} className="mr-2" /> Share
          </Btn>
          <Btn
            variant="outline"
            className="flex-1"
            onClick={() => toast.success("Business QR saved")}
          >
            <Download size={iconSize.sm} className="mr-2" /> Download
          </Btn>
        </div>

        <div className="mt-3">
          <BtnLink to="/identity/print" variant="ghost" className="w-full">
            <Printer size={iconSize.sm} className="mr-2" /> Preview Studio Sign & Poster
          </BtnLink>
        </div>

        <p className="mt-5 px-1 text-1 text-muted-foreground">
          Scans land on your public business profile, where visitors can check availability and
          request a booking. Nothing private is encoded in the code itself.
        </p>
      </main>

      <Sheet open={share} onClose={() => setShare(false)} title="Share business QR">
        <ShareActions
          url={url}
          title={business.name}
          onDownload={() => toast.success("Business QR saved")}
        />
        <div className="mt-3">
          <DownloadNote />
        </div>
      </Sheet>
    </Screen>
  );
}
