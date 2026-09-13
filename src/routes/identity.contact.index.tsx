/**
 * FLOW-23 · QR-19 "Digital business card" · route: /identity/contact
 * Only fields the owner marked shareable appear here.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Globe, Mail, Phone, UserRoundPlus } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { QrCode, ActionRow, nativeShare } from "@/components/ml/qr";
import { canonicalUrl, myIdentity } from "@/data/identity";

export const Route = createFileRoute("/identity/contact/")({
  head: () => ({
    meta: [
      { title: "Digital business card — MusicLinkd" },
      {
        name: "description",
        content:
          "Your professional card: name, role, the contact details you choose to share, and a QR that always stays current.",
      },
      { property: "og:title", content: "Digital business card on MusicLinkd" },
      {
        property: "og:description",
        content: "Share once, stay reachable — no reprints when details change.",
      },
    ],
  }),
  component: BusinessCard,
});

function BusinessCard() {
  const c = myIdentity.contact;
  const url = canonicalUrl(myIdentity.code);
  const shared = [
    c.phone.shared ? { icon: <Phone size={17} />, label: c.phone.value, hint: "Mobile" } : null,
    c.email.shared ? { icon: <Mail size={17} />, label: c.email.value, hint: "Email" } : null,
    c.company.shared
      ? { icon: <Building2 size={17} />, label: c.company.value, hint: "Studio" }
      : null,
    c.website.shared
      ? { icon: <Globe size={17} />, label: c.website.value, hint: "Website" }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; hint: string }[];

  return (
    <Screen>
      <TopBar title="Digital card" subtitle={myIdentity.name} back="/identity/qr" />
      <main className="px-5 pt-4">
        <section className="overflow-hidden rounded-[24px] border border-border bg-card">
          <div className="flex items-center gap-4 bg-ink px-5 py-5 text-background">
            <img src={myIdentity.photo} alt="" className="h-16 w-16 rounded-full object-cover" />
            <div className="min-w-0">
              <h2 className="truncate text-[19px] leading-tight text-background">
                {myIdentity.name}
              </h2>
              <p className="truncate text-[13px] text-background/70">{myIdentity.role}</p>
              <p className="truncate text-[12px] text-background/50">{myIdentity.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-5">
            <QrCode value={url} size={96} label="MusicLinkd QR" />
            <p className="text-[12px] text-muted-foreground">
              Scanning opens the live profile — portfolio, services and availability stay up to date
              without a reprint.
            </p>
          </div>
        </section>

        <div className="mt-4 flex flex-col gap-2">
          <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Shared details
          </p>
          {shared.map((s) => (
            <ActionRow key={s.label} icon={s.icon} label={s.label} hint={s.hint} />
          ))}
          <p className="px-1 text-[12px] text-muted-foreground">
            Hidden fields are never included in shares. Change what's shared in QR settings.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Link to="/identity/contact/save" className="flex-1">
            <Btn className="w-full">
              <UserRoundPlus size={16} className="mr-2" /> Save contact
            </Btn>
          </Link>
          <Btn
            variant="outline"
            className="flex-1"
            onClick={() => void nativeShare({ title: myIdentity.name, url })}
          >
            Share card
          </Btn>
        </div>

        <div className="mt-3">
          <Link to="/identity/settings">
            <Btn variant="ghost" className="w-full">
              Manage shared details
            </Btn>
          </Link>
        </div>
      </main>
    </Screen>
  );
}
