/**
 * FLOW-23 · QR-20 "Save contact" · route: /identity/contact/save
 * states: ready, saving, success, error
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, UserRoundPlus } from "lucide-react";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { StateCard, ActionRow } from "@/components/ml/qr";
import { myIdentity } from "@/data/identity";

export const Route = createFileRoute("/identity/contact/save")({
  head: () => ({
    meta: [
      { title: "Save contact — MusicLinkd" },
      { name: "description", content: "Review exactly which details get saved to your phone before adding a MusicLinkd contact." },
      { property: "og:title", content: "Save a MusicLinkd contact" },
      { property: "og:description", content: "Nothing is added to your phone until you confirm." },
    ],
  }),
  component: SaveContact,
});

function SaveContact() {
  const [phase, setPhase] = useState<"ready" | "saving" | "done" | "error">("ready");
  const c = myIdentity.contact;

  return (
    <Screen>
      <TopBar title="Save contact" subtitle="Review before saving" back="/identity/contact" />
      <main className="px-5 pt-4">
        {phase === "done" ? (
          <StateCard title="Contact saved" body={`${myIdentity.name} was added to your phone contacts with their MusicLinkd profile link.`}>
            <Link to="/identity/contact">
              <Btn className="w-full">
                <Check size={16} className="mr-2" /> Done
              </Btn>
            </Link>
          </StateCard>
        ) : phase === "error" ? (
          <StateCard title="Couldn't save the contact" body="Your browser blocked the download or contacts access. You can copy the details manually instead.">
            <Btn onClick={() => setPhase("ready")}>Try again</Btn>
          </StateCard>
        ) : (
          <>
            <section className="rounded-[24px] border border-border bg-card p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Will be saved
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <ActionRow icon={<UserRoundPlus size={17} />} label={myIdentity.name} hint={myIdentity.role} />
                {c.phone.shared ? <ActionRow icon={<Check size={17} />} label={c.phone.value} hint="Mobile" /> : null}
                {c.email.shared ? <ActionRow icon={<Check size={17} />} label={c.email.value} hint="Email" /> : null}
                {c.company.shared ? <ActionRow icon={<Check size={17} />} label={c.company.value} hint="Company" /> : null}
                <ActionRow icon={<Check size={17} />} label={`musiclinkd.app/q/${myIdentity.code}`} hint="Profile link" />
              </div>
            </section>

            <p className="mt-3 px-1 text-[12px] text-muted-foreground">
              Details the owner keeps private are not included.
            </p>

            <div className="mt-4 flex gap-2">
              <Btn
                className="flex-1"
                onClick={() => {
                  setPhase("saving");
                  setTimeout(() => setPhase("done"), 600);
                }}
              >
                {phase === "saving" ? "Saving…" : "Save to contacts"}
              </Btn>
              <Link to="/identity/contact" className="flex-1">
                <Btn variant="outline" className="w-full">Cancel</Btn>
              </Link>
            </div>
          </>
        )}
      </main>
    </Screen>
  );
}
