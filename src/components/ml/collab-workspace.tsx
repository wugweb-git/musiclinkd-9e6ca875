import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { StatusPill } from "@/components/ml/collab";
import type { Project } from "@/data/collab";

const tabs = [
  { key: "overview", label: "Overview", to: "/collab/$id" },
  { key: "discussion", label: "Discussion", to: "/collab/$id/discussion" },
  { key: "files", label: "Files", to: "/collab/$id/files" },
  { key: "timeline", label: "Timeline", to: "/collab/$id/timeline" },
  { key: "participants", label: "People", to: "/collab/$id/participants" },
  { key: "notes", label: "Notes", to: "/collab/$id/notes" },
  { key: "activity", label: "Activity", to: "/collab/$id/activity" },
] as const;

export function WorkspaceShell({
  project,
  tab,
  children,
  right,
}: {
  project: Project;
  tab: (typeof tabs)[number]["key"] | (string & {});
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <Screen>
      <TopBar
        title={project.name}
        subtitle={`${project.type} · You are ${project.myRole}`}
        back="/collab"
        right={
          right ?? (
            <Link
              to="/collab/$id/settings"
              params={{ id: project.id }}
              className="pill bg-subtle text-muted-foreground"
            >
              Settings
            </Link>
          )
        }
      />
      <div className="flex items-center gap-2 px-5 pt-3">
        <StatusPill status={project.status} />
        <span className="truncate text-1 text-muted-foreground">{project.timeline}</span>
      </div>
      <nav className="rail mt-3 flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
        {tabs.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              to={t.to}
              params={{ id: project.id }}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold ${
                active
                  ? "border-transparent bg-selected-bg text-selected-text"
                  : "border-border bg-card text-foreground"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <main className="px-5 pt-1">{children}</main>
    </Screen>
  );
}
