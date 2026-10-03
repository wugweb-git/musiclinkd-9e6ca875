/**
 * FLOW-23 · QR-19 "Digital business card" · route: /identity/contact
 * Only fields the owner marked shareable appear here.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Globe, Mail, Phone, UserRoundPlus } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { QrCode, ActionRow, nativeShare } from "@/components/ml/qr";
import { useMyTalentIdentity } from "@/hooks/use-my-talent-identity";
import { iconSize } from "@/lib/tokens";
import { sized } from "@/lib/image-url";

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
  const me = useMyTalentIdentity();
  const url = me.url;
  const shared = [
    me.phone ? { icon: <Phone size={iconSize.sm} />, label: me.phone, hint: "Mobile" } : null,
    me.email ? { icon: <Mail size={iconSize.sm} />, label: me.email, hint: "Email" } : null,
    me.website ? { icon: <Globe size={iconSize.sm} />, label: me.website, hint: "Website" } : null,
    me.company
      ? { icon: <Building2 size={iconSize.sm} />, label: me.company, hint: "Company" }
      : null,
  ].filter(Boolean) as { icon: React.ReactNode; label: string; hint: string }[];

  return (
    <Screen>
      <TopBar title="Digital card" subtitle={me.name} back="/identity/qr" />
      <main className="px-5 pt-4">
        <section className="overflow-hidden rounded-lg bg-subtle">
          <div className="flex items-center gap-4 bg-ink px-5 py-5 text-background">
            {me.photo ? (
              <img
                src={sized(me.photo, { width: 64 })}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span aria-hidden className="h-16 w-16 shrink-0 rounded-full bg-background/20" />
            )}
            <div className="min-w-0">
              <h2 className="truncate text-3 leading-tight text-background">{me.name}</h2>
              <p className="truncate text-1 text-background/70">{me.role}</p>
              {me.username ? (
                <p className="truncate text-1 text-background/50">@{me.username}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 py-5">
            {url ? <QrCode value={url} size={96} label="MusicLinkd QR" /> : null}
            <p className="text-1 text-muted-foreground">
              Scanning opens the live profile — portfolio, services and availability stay up to date
              without a reprint.
            </p>
          </div>
        </section>

        <div className="mt-4 flex flex-col gap-2">
          <p className="pill px-1 bg-background text-muted-foreground">Shared details</p>
          {shared.length ? (
            shared.map((s) => (
              <ActionRow key={s.label} icon={s.icon} label={s.label} hint={s.hint} />
            ))
          ) : (
            <p className="px-1 text-1 text-muted-foreground">
              No contact details on file yet — add a website in Profile edit, or your phone/email
              come from your sign-in.
            </p>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <BtnLink to="/identity/contact/save" className="flex-1 w-full">
            <UserRoundPlus size={iconSize.sm} className="mr-2" /> Save Contact
          </BtnLink>
          <Btn
            variant="outline"
            className="flex-1"
            onClick={() => void nativeShare({ title: me.name || "MusicLinkd", url })}
          >
            Share Card
          </Btn>
        </div>
      </main>
    </Screen>
  );
}
