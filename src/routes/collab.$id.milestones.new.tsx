import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Btn, Chip, Screen, TopBar } from "@/components/ml/ui";
import { Field, PermissionState, StickyBar, TextInput } from "@/components/ml/collab";
import { getProject } from "@/data/collab";

export const Route = createFileRoute("/collab/$id/milestones/new")({
  head: () => ({
    meta: [
      { title: "Add a milestone | MusicLinkd" },
      {
        name: "description",
        content: "Add a milestone with an owner, due date and notes to a MusicLinkd collaboration.",
      },
      { property: "og:title", content: "Add a milestone | MusicLinkd" },
      { property: "og:description", content: "Break a music project into stages everyone can track." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewMilestone,
});

function NewMilestone() {
  const { id } = Route.useParams();
  const project = getProject(id);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [due, setDue] = useState("");
  const [owner, setOwner] = useState(project?.participants[0]?.name ?? "");

  if (!project) {
    return (
      <Screen>
        <TopBar title="Add milestone" back="/collab" />
        <div className="px-5 pt-6">
          <PermissionState />
        </div>
      </Screen>
    );
  }

  return (
    <Screen bottomNav={false}>
      <TopBar title="Add milestone" subtitle={project.name} back="/collab" />
      <main className="px-5 pt-5">
        <Field label="Milestone name">
          <TextInput value={name} onChange={setName} placeholder="e.g. Final vocal comp" />
        </Field>
        <Field label="Description" optional>
          <TextInput value={desc} onChange={setDesc} multiline placeholder="What has to be true to call this done?" />
        </Field>
        <Field label="Owner">
          <div className="flex flex-wrap gap-2">
            {project.participants.map((p) => (
              <Chip key={p.id} active={p.name === owner} onClick={() => setOwner(p.name)}>
                {p.name}
              </Chip>
            ))}
          </div>
        </Field>
        <Field label="Due date">
          <TextInput value={due} onChange={setDue} placeholder="24 Sep 2026" />
        </Field>
      </main>
      <StickyBar>
        <Link to="/collab/$id/timeline" params={{ id: project.id }}>
          <Btn className="w-full">Save milestone</Btn>
        </Link>
      </StickyBar>
    </Screen>
  );
}
