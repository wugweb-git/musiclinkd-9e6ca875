/**
 * FLOW-23 · QR-03 "Business QR" · route: /identity/business
 * dataSource: businessProfile, share · states: ready · actions: share, download, copy
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download, Printer, Share2 } from "lucide-react";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { QrIdentityCard, CopyLinkRow, ShareActions, DownloadNote } from "@/components/ml/qr";
import { canonicalUrl, myBusiness } from "@/data/identity";

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
  const url = canonicalUrl(myBusiness.code);

  return (
    <Screen>
      <TopBar title="Business QR" subtitle={myBusiness.name} back="/identity/qr" />
      <main className="px-5 pt-4">
        <QrIdentityCard
          name={myBusiness.name}
          role={myBusiness.category}
          photo={myBusiness.logo}
          verified={myBusiness.verified}
          handle={myBusiness.username}
          code={myBusiness.code}
          tagline={myBusiness.city}
        />

        <div className="mt-3">
          <CopyLinkRow url={url} />
        </div>

        <div className="mt-3 flex gap-2">
          <Btn className="flex-1" onClick={() => setShare(true)}>
            <Share2 size={16} className="mr-2" /> Share
          </Btn>
          <Btn
            variant="outline"
            className="flex-1"
            onClick={() => toast.success("Business QR saved")}
          >
            <Download size={16} className="mr-2" /> Download
          </Btn>
        </div>

        <div className="mt-3">
          <Link to="/identity/print">
            <Btn variant="ghost" className="w-full">
              <Printer size={16} className="mr-2" /> Preview studio sign & poster
            </Btn>
          </Link>
        </div>

        <p className="mt-5 px-1 text-[12px] text-muted-foreground">
          Scans land on your public business profile, where visitors can check availability and
          request a booking. Nothing private is encoded in the code itself.
        </p>
      </main>

      <Sheet open={share} onClose={() => setShare(false)} title="Share business QR">
        <ShareActions
          url={url}
          title={myBusiness.name}
          onDownload={() => toast.success("Business QR saved")}
        />
        <div className="mt-3">
          <DownloadNote />
        </div>
      </Sheet>
    </Screen>
  );
}
