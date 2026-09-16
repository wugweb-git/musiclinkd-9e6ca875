/**
 * FLOW-23 · QR-21 "Print preview" · route: /identity/print
 * Preview only — no print production pipeline.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { QrCode, DownloadNote } from "@/components/ml/qr";
import { canonicalUrl, myBusiness, myIdentity, printFormats } from "@/data/identity";

export const Route = createFileRoute("/identity/print")({
  head: () => ({
    meta: [
      { title: "Print preview — MusicLinkd QR" },
      {
        name: "description",
        content:
          "See how your MusicLinkd QR looks on a business card, poster, studio sign, event badge or portfolio card.",
      },
      { property: "og:title", content: "Print your MusicLinkd QR" },
      { property: "og:description", content: "Five layouts sized for real-world printing." },
    ],
  }),
  component: PrintPreview,
});

function PrintPreview() {
  const [format, setFormat] = useState<string>(printFormats[0]!.id);
  const [subject, setSubject] = useState<"me" | "business">("me");
  const who = subject === "me" ? myIdentity : myBusiness;
  const name = subject === "me" ? myIdentity.name : myBusiness.name;
  const line = subject === "me" ? myIdentity.role : myBusiness.category;
  const active = printFormats.find((f) => f.id === format)!;

  return (
    <Screen>
      <TopBar title="Print preview" subtitle={active.size} back="/identity/qr" />
      <main className="px-5 pt-4">
        <div className="flex gap-2">
          {(["me", "business"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s)}
              aria-pressed={subject === s}
              className={`flex-1 rounded-full border px-4 py-2.5 text-1 font-semibold ${
                subject === s
                  ? "border-transparent bg-ink text-background"
                  : "border-border bg-card"
              }`}
            >
              {s === "me" ? "Personal" : "Business"}
            </button>
          ))}
        </div>

        <section className="mt-4 rounded-[24px] border border-border bg-subtle p-5">
          <div
            className={`mx-auto flex items-center gap-4 rounded-[16px] bg-card p-5 shadow-sm ${
              format === "poster" ? "flex-col text-center" : ""
            }`}
            style={{
              aspectRatio:
                format === "poster" ? "3 / 4" : format === "studio-sign" ? "1 / 1" : "16 / 9",
            }}
          >
            <QrCode value={canonicalUrl(who.code)} size={format === "poster" ? 180 : 110} />
            <div className={format === "poster" ? "" : "min-w-0"}>
              <p className="pill bg-subtle text-muted-foreground">MusicLinkd</p>
              <p className="truncate text-2 leading-tight">{name}</p>
              <p className="truncate text-1 text-muted-foreground">{line}</p>
              <p className="mt-1 truncate text-0 text-muted-foreground">
                musiclinkd.app/q/{who.code}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-4 flex flex-col gap-2">
          {printFormats.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFormat(f.id)}
              aria-pressed={format === f.id}
              className={`flex items-center justify-between gap-3 rounded-[20px] border px-4 py-3 text-left ${
                format === f.id ? "border-primary bg-pinkc" : "border-border bg-card"
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{f.label}</span>
                <span className="block truncate text-1 text-muted-foreground">{f.blurb}</span>
              </span>
              <span className="shrink-0 text-0 font-semibold text-muted-foreground">{f.size}</span>
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Btn className="w-full" onClick={() => toast.success(`${active.label} preview saved`)}>
            <Download size={16} className="mr-2" /> Download print file
          </Btn>
        </div>
        <div className="mt-3">
          <DownloadNote />
        </div>
      </main>
    </Screen>
  );
}
