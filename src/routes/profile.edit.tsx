import { createFileRoute } from "@tanstack/react-router";
import { Btn, Screen, TopBar } from "@/components/ml/ui";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({
    meta: [
      { title: "Edit Your Profile | MusicLinkd" },
      {
        name: "description",
        content:
          "Update your MusicLinkd professional identity: role, availability, portfolio and services.",
      },
      { property: "og:title", content: "Edit Your Profile | MusicLinkd" },
      {
        property: "og:description",
        content: "Complete your MusicLinkd profile to get discovered and hired.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditProfile,
});

const sections = [
  { label: "Basic details", hint: "Name, role, city, languages" },
  { label: "About & skills", hint: "Bio, genres, instruments" },
  { label: "Portfolio", hint: "Audio, video and gallery" },
  { label: "Projects & credits", hint: "Discography and collaborators" },
  { label: "Services & rates", hint: "What you offer and pricing" },
  { label: "Availability", hint: "Status, remote work, turnaround" },
];

function EditProfile() {
  return (
    <Screen>
      <TopBar title="Edit profile" subtitle="78% complete" back="/me" />
      <div className="space-y-3 px-5 py-5">
        {sections.map((s) => (
          <button
            key={s.label}
            type="button"
            className="flex w-full items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 text-left"
          >
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold">{s.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{s.hint}</span>
            </span>
            <span className="text-xs text-primary">→</span>
          </button>
        ))}
        <Btn className="w-full">Save changes</Btn>
      </div>
    </Screen>
  );
}
