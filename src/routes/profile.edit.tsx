import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Save } from "lucide-react";
import { Btn, Screen, TopBar } from "@/components/ml/ui";
import { editSections } from "@/data/profile";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({
    meta: [
      { title: "Edit Professional Profile | MusicLinkd" },
      { name: "description", content: "Update your MusicLinkd identity, music profile, portfolio, services and availability." },
      { property: "og:title", content: "Edit Professional Profile | MusicLinkd" },
      { property: "og:description", content: "Keep your MusicLinkd professional identity current." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditProfile,
});

function EditProfile() {
  const [open, setOpen] = useState<string | null>("identity");
  const [saved, setSaved] = useState(false);

  return (
    <Screen>
      <TopBar title="Edit profile" subtitle="78% complete" back="/me" />
      <main className="px-5 py-5">
        <div className="mb-5">
          <p className="text-xs leading-relaxed text-muted-foreground">Keep the details people need to understand your work and reach you.</p>
        </div>
        <div className="space-y-2">
          {editSections.map((section) => {
            const isOpen = open === section.id;
            return (
              <section key={section.id} className="overflow-hidden rounded-3xl border border-border bg-card">
                <button type="button" onClick={() => setOpen(isOpen ? null : section.id)} aria-expanded={isOpen} className="flex min-h-[72px] w-full items-center gap-3 px-4 text-left">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${section.done ? "bg-success-container text-success" : "bg-pink-container text-primary"}`}>
                    {section.done ? <Check size={16} aria-hidden /> : <span className="text-xs font-bold">•</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{section.label}</span>
                    <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{section.detail}</span>
                  </span>
                  {isOpen ? <ChevronDown size={17} className="shrink-0 text-muted-foreground" aria-hidden /> : <ChevronRight size={17} className="shrink-0 text-muted-foreground" aria-hidden />}
                </button>
                {isOpen ? <div className="border-t border-border bg-subtle/50 px-4 pb-4 pt-3"><p className="text-xs leading-relaxed text-muted-foreground">Update your {section.label.toLowerCase()} details to keep your professional profile accurate and useful.</p><Btn variant="outline" className="mt-3 min-h-10 w-full text-xs">Open {section.label}</Btn></div> : null}
              </section>
            );
          })}
        </div>
        <Btn className="mt-5 w-full gap-2" onClick={() => setSaved(true)}><Save size={16} aria-hidden />{saved ? "Changes saved" : "Save changes"}</Btn>
      </main>
    </Screen>
  );
}