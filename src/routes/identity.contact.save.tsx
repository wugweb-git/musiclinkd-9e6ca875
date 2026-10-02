import { StateCard } from "@/components/ml/kit";
/**
 * FLOW-23 · QR-20 "Save contact" · route: /identity/contact/save
 * states: ready, saving, success, error
 */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, UserRoundPlus } from "lucide-react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { ActionRow } from "@/components/ml/qr";
import { useMyTalentIdentity } from "@/hooks/use-my-talent-identity";
import { iconSize } from "@/lib/tokens";
import { downloadBlob } from "@/lib/download";

export const Route = createFileRoute("/identity/contact/save")({
  head: () => ({
    meta: [
      { title: "Save contact — MusicLinkd" },
      {
        name: "description",
        content:
          "Review exactly which details get saved to your phone before adding a MusicLinkd contact.",
      },
      { property: "og:title", content: "Save a MusicLinkd contact" },
      { property: "og:description", content: "Nothing is added to your phone until you confirm." },
    ],
  }),
  component: SaveContact,
});

/** A real .vcf a phone can open straight into its own "add contact" screen. */
function vCard(me: ReturnType<typeof useMyTalentIdentity>): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${me.name || "MusicLinkd contact"}`,
    me.role ? `TITLE:${me.role}` : null,
    me.company ? `ORG:${me.company}` : null,
    me.phone ? `TEL;TYPE=CELL:${me.phone}` : null,
    me.email ? `EMAIL:${me.email}` : null,
    me.url ? `URL:${me.url}` : null,
    "END:VCARD",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

function SaveContact() {
  const me = useMyTalentIdentity();
  const [phase, setPhase] = useState<"ready" | "saving" | "done" | "error">("ready");

  function save() {
    setPhase("saving");
    try {
      const blob = new Blob([vCard(me)], { type: "text/vcard" });
      setPhase(downloadBlob(`${me.name || "musiclinkd-contact"}.vcf`, blob) ? "done" : "error");
    } catch {
      setPhase("error");
    }
  }

  return (
    <Screen>
      <TopBar title="Save contact" subtitle="Review before saving" back="/identity/contact" />
      <main className="px-5 pt-4">
        {phase === "done" ? (
          <StateCard
            variant="subtle"
            title="Contact file downloaded"
            body={`Open the downloaded file to add ${me.name || "this contact"} to your phone contacts, with their MusicLinkd profile link.`}
          >
            <BtnLink to="/identity/contact" className="w-full">
              <Check size={iconSize.sm} className="mr-2" /> Done
            </BtnLink>
          </StateCard>
        ) : phase === "error" ? (
          <StateCard
            variant="subtle"
            title="Couldn't save the contact"
            body="Your browser blocked the download. You can copy the details manually instead."
          >
            <Btn onClick={() => setPhase("ready")}>Try again</Btn>
          </StateCard>
        ) : (
          <>
            <section className="rounded-[24px] bg-subtle p-4">
              <p className="pill bg-background text-muted-foreground">Will be saved</p>
              <div className="mt-3 flex flex-col gap-2">
                <ActionRow
                  icon={<UserRoundPlus size={iconSize.sm} />}
                  label={me.name || "MusicLinkd contact"}
                  hint={me.role}
                />
                {me.phone ? (
                  <ActionRow icon={<Check size={iconSize.sm} />} label={me.phone} hint="Mobile" />
                ) : null}
                {me.email ? (
                  <ActionRow icon={<Check size={iconSize.sm} />} label={me.email} hint="Email" />
                ) : null}
                {me.company ? (
                  <ActionRow
                    icon={<Check size={iconSize.sm} />}
                    label={me.company}
                    hint="Company"
                  />
                ) : null}
                {me.url ? (
                  <ActionRow
                    icon={<Check size={iconSize.sm} />}
                    label={me.url}
                    hint="Profile link"
                  />
                ) : null}
              </div>
            </section>

            <p className="mt-3 px-1 text-1 text-muted-foreground">
              Details you haven't shared are not included.
            </p>

            <div className="mt-4 flex gap-2">
              <Btn className="flex-1" onClick={save} disabled={phase === "saving"}>
                {phase === "saving" ? "Saving…" : "Save to contacts"}
              </Btn>
              <BtnLink to="/identity/contact" variant="outline" className="flex-1 w-full">
                Cancel
              </BtnLink>
            </div>
          </>
        )}
      </main>
    </Screen>
  );
}
