import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";
import { talents } from "@/data/discover";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages | MusicLinkd" },
      {
        name: "description",
        content: "Conversations with artists, studios and labels you are hiring on MusicLinkd.",
      },
      { property: "og:title", content: "Messages | MusicLinkd" },
      { property: "og:description", content: "Talk to talent, studios and labels directly." },
    ],
  }),
  component: Messages,
});

function Messages() {
  return (
    <Screen>
      <TopBar
        title="Messages"
        subtitle="3 unread"
        right={
          <Link
            to="/collab"
            className="text-[11px] font-bold uppercase tracking-wide text-primary"
          >
            Collabs
          </Link>
        }
      />
      <div className="px-5 pt-4">
        <Link
          to="/collab"
          className="flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-4"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold">Collaborations</span>
            <span className="block text-[11px] text-muted-foreground">
              2 invitations · 1 proposal · 3 active projects
            </span>
          </span>
          <span className="text-muted-foreground">›</span>
        </Link>
        <Link
          to="/portfolio/select"
          className="mt-3 flex items-center justify-between rounded-3xl border border-border bg-card px-4 py-4"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-semibold">Share work</span>
            <span className="block text-[11px] text-muted-foreground">
              Attach a track, project or performance to a conversation
            </span>
          </span>
          <span className="text-muted-foreground">›</span>
        </Link>
      </div>
      <div className="divide-y divide-border px-5">
        {talents.slice(0, 4).map((t, i) => (
          <div key={t.id} className="flex items-center gap-3 py-4">
            <img src={t.photo} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[14px]">{t.name}</h3>
              <p className="truncate text-[11px] text-muted-foreground">
                {i === 0 ? "Sending the reference track tonight." : "Sounds good — let's lock dates."}
              </p>
            </div>
            {i < 3 ? (
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            ) : (
              <span className="text-[10px] text-muted-foreground">2d</span>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}
