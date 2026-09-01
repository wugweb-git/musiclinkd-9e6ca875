import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Field, Label, StickyBar, TextInput } from "@/components/ml/collab";
import { OutcomePanel } from "@/components/ml/collab-extra";
import { collabRoles, projects } from "@/data/collab";

export const Route = createFileRoute("/collab/proposals/new")({
  head: () => ({
    meta: [
      { title: "Send a collaboration proposal | MusicLinkd" },
      {
        name: "description",
        content:
          "Propose a collaboration with a clear role, scope, deliverables, timeline and compensation before the work starts.",
      },
      { property: "og:title", content: "Send a collaboration proposal | MusicLinkd" },
      {
        property: "og:description",
        content: "Turn a conversation into a defined working relationship on MusicLinkd.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewProposal,
});

function NewProposal() {
  const [project, setProject] = useState(projects[0]?.name ?? "");
  const [role, setRole] = useState<string>("Engineer");
  const [scope, setScope] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("");
  const [comp, setComp] = useState("");
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <Screen>
        <TopBar title="Proposal sent" back="/collab" />
        <main className="px-5 pt-5">
          <OutcomePanel
            title="Proposal sent"
            body={`Your proposal for ${project} is with them now. You'll be notified when they accept, decline or counter.`}
          >
            <Link to="/collab">
              <Btn className="w-full">Back to collaborations</Btn>
            </Link>
          </OutcomePanel>
        </main>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="New proposal" subtitle="Role, scope and terms" back="/collab" />
      <main className="px-5 pt-5">
        <Field label="Project">
          <div className="flex flex-wrap gap-2">
            {projects.slice(0, 5).map((p) => (
              <Chip key={p.id} active={p.name === project} onClick={() => setProject(p.name)}>
                {p.name}
              </Chip>
            ))}
          </div>
        </Field>

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
          <TextInput
            value={scope}
            onChange={setScope}
            multiline
            placeholder="What exactly are you proposing to do?"
          />
        </Field>

        <Field label="Deliverables" optional hint="One per line.">
          <TextInput
            value={deliverables}
            onChange={setDeliverables}
            multiline
            placeholder={"Final mix (WAV 24/48)\nStreaming master"}
          />
        </Field>

        <Field label="Timeline" optional>
          <TextInput value={timeline} onChange={setTimeline} placeholder="12 Sep – 24 Sep 2026" />
        </Field>

        <Field label="Compensation" optional>
          <TextInput value={comp} onChange={setComp} placeholder="₹55,000 on delivery" />
        </Field>

        <Field label="Notes" optional>
          <TextInput value={notes} onChange={setNotes} multiline placeholder="Anything else they should know" />
        </Field>

        <Label>Before you send</Label>
        <p className="mb-6 text-[11px] text-muted-foreground">
          A proposal is a working agreement between collaborators, not a legal contract. Payments and contracts
          are handled outside MusicLinkd.
        </p>
      </main>
      <StickyBar>
        <div className="flex gap-3">
          <Link to="/collab" className="flex-1">
            <Btn variant="outline" className="w-full">
              Save draft
            </Btn>
          </Link>
          <Btn className="flex-1" onClick={() => setSent(true)}>
            Send proposal
          </Btn>
        </div>
      </StickyBar>
    </Screen>
  );
}
