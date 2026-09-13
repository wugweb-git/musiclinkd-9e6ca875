import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { BtnLink, Chip, Screen, TopBar } from "@/components/ml/ui";
import { Field, PermissionState, StickyBar, TextInput } from "@/components/ml/collab";
import { collabRoles, getProposal } from "@/data/collab";

export const Route = createFileRoute("/collab/proposals/$id/counter")({
  head: () => ({
    meta: [
      { title: "Counter proposal | MusicLinkd" },
      {
        name: "description",
        content:
          "Adjust scope, deliverables, timeline and compensation, then send a counter proposal.",
      },
      { property: "og:title", content: "Counter proposal | MusicLinkd" },
      { property: "og:description", content: "Negotiate collaboration terms in the open." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Counter,
});

function Counter() {
  const { id } = Route.useParams();
  const p = getProposal(id);
  const [role, setRole] = useState(p?.role ?? "Engineer");
  const [scope, setScope] = useState(p?.scope ?? "");
  const [deliverables, setDeliverables] = useState(p?.deliverables.join("\n") ?? "");
  const [timeline, setTimeline] = useState(p?.timeline ?? "");
  const [compensation, setCompensation] = useState(p?.compensation ?? "");
  const [notes, setNotes] = useState("");

  if (!p) {
    return (
      <Screen>
        <TopBar title="Counter proposal" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Counter proposal" subtitle={p.projectName} back="/collab" />
      <main className="px-5 pt-5">
        <Field label="Role">
          <div className="flex flex-wrap gap-2">
            {collabRoles.map((r) => (
              <Chip key={r} active={r === role} onClick={() => setRole(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Scope">
          <TextInput value={scope} onChange={setScope} multiline />
        </Field>
        <Field label="Deliverables" hint="One per line.">
          <TextInput value={deliverables} onChange={setDeliverables} multiline />
        </Field>
        <Field label="Timeline">
          <TextInput value={timeline} onChange={setTimeline} />
        </Field>
        <Field label="Compensation">
          <TextInput value={compensation} onChange={setCompensation} />
        </Field>
        <Field label="Note to collaborator" optional>
          <TextInput
            value={notes}
            onChange={setNotes}
            multiline
            placeholder="Explain what you changed and why."
          />
        </Field>
      </main>
      <StickyBar>
        <div className="flex gap-3">
          <BtnLink
            to="/collab/proposals/$id"
            params={{ id: p.id }}
            variant="outline"
            className="flex-1 w-full"
          >
            Cancel
          </BtnLink>
          <BtnLink to="/collab/proposals/$id" params={{ id: p.id }} className="flex-[2] w-full">
            Send counter
          </BtnLink>
        </div>
      </StickyBar>
    </Screen>
  );
}
