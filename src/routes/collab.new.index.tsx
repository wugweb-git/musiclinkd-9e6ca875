import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, Chip, Btn } from "@/components/ml/ui";
import { Field, TextInput, StickyBar, Label } from "@/components/ml/collab";
import { collabRoles, collabTypes } from "@/data/collab";

export const Route = createFileRoute("/collab/new/")({
  head: () => ({
    meta: [
      { title: "Create a collaboration — MusicLinkd" },
      {
        name: "description",
        content:
          "Set up a music collaboration: name, type, your role, timeline and optional budget.",
      },
      { property: "og:title", content: "Create a collaboration — MusicLinkd" },
      {
        property: "og:description",
        content: "Turn a conversation into a structured music project.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreateCollab,
});

function CreateCollab() {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("Song");
  const [description, setDescription] = useState("");
  const [role, setRole] = useState<string>("Composer");
  const [location, setLocation] = useState("");
  const [mode, setMode] = useState("Hybrid");
  const [start, setStart] = useState("");
  const [target, setTarget] = useState("");
  const [budget, setBudget] = useState("");

  return (
    <Screen bottomNav={false}>
      <TopBar title="New collaboration" subtitle="Step 1 of 2 · Project details" back="/collab" />
      <main className="px-5 pt-5">
        <Field label="Project name">
          <TextInput value={name} onChange={setName} placeholder="e.g. Raat Ki Rani" />
        </Field>

        <Field label="Project type">
          <div className="flex flex-wrap gap-2">
            {collabTypes.map((t) => (
              <Chip key={t} active={t === type} onClick={() => setType(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </Field>

        <Field
          label="Description"
          optional
          hint="What are you making, and what does success look like?"
        >
          <TextInput
            value={description}
            onChange={setDescription}
            multiline
            placeholder="A Hindi indie single blending Sufi vocal phrasing with a modern low-end..."
          />
        </Field>

        <Field label="Your role">
          <div className="flex flex-wrap gap-2">
            {collabRoles.map((r) => (
              <Chip key={r} active={r === role} onClick={() => setRole(r)}>
                {r}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Location" optional>
          <TextInput value={location} onChange={setLocation} placeholder="Mumbai" />
        </Field>

        <Field label="How you'll work">
          <div className="flex flex-wrap gap-2">
            {["Remote", "In person", "Hybrid"].map((m) => (
              <Chip key={m} active={m === mode} onClick={() => setMode(m)}>
                {m}
              </Chip>
            ))}
          </div>
        </Field>

        <Field label="Timeline" optional hint="You can set milestones once the project is created.">
          <div className="grid grid-cols-2 gap-3">
            <TextInput value={start} onChange={setStart} placeholder="Start date" />
            <TextInput value={target} onChange={setTarget} placeholder="Target date" />
          </div>
        </Field>

        <Field label="Budget" optional hint="Only visible to participants you invite.">
          <TextInput value={budget} onChange={setBudget} placeholder="₹1,80,000" />
        </Field>

        <div className="rounded-lg border border-border bg-card p-4">
          <Label>What happens next</Label>
          <p className="text-[12px] text-muted-foreground">
            You'll invite collaborators and set their roles. Nothing is shared until you send
            invitations.
          </p>
        </div>
      </main>

      <StickyBar>
        <div className="flex gap-3">
          <Link to="/collab" className="flex-1">
            <Btn variant="outline" className="w-full">
              Save draft
            </Btn>
          </Link>
          <Link to="/collab/new/collaborators" className="flex-[2]">
            <Btn className="w-full">Continue</Btn>
          </Link>
        </div>
      </StickyBar>
    </Screen>
  );
}
