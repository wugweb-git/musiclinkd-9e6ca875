import { createFileRoute, Link } from "@tanstack/react-router";
import { Screen, TopBar, VerifiedBadge } from "@/components/ml/ui";
import { talents } from "@/data/discover";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Your Profile | MusicLinkd" },
      {
        name: "description",
        content: "Manage your MusicLinkd profile, shortlists and hiring requests.",
      },
      { property: "og:title", content: "Your Profile | MusicLinkd" },
      { property: "og:description", content: "Your MusicLinkd account and shortlists." },
    ],
  }),
  component: Me,
});

function Me() {
  const me = talents[1]!;
  return (
    <Screen>
      <TopBar title="Your profile" />
      <div className="px-5 py-5">
        <div className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4">
          <img src={me.photo} alt="You" className="h-16 w-16 rounded-2xl object-cover" />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-[17px]">{me.name}</h2>
              <VerifiedBadge />
            </div>
            <p className="text-[11px] text-muted-foreground">{me.role} · Bengaluru</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-border rounded-3xl border border-border bg-card">
          <Link to="/saved" className="flex items-center justify-between px-4 py-4">
            <span className="text-sm font-medium">Saved profiles</span>
            <span className="text-xs text-muted-foreground">18 →</span>
          </Link>
          <Link to="/recommended" className="flex items-center justify-between px-4 py-4">
            <span className="text-sm font-medium">Recommended for you</span>
            <span className="text-xs text-muted-foreground">24 →</span>
          </Link>
          <Link to="/categories" className="flex items-center justify-between px-4 py-4">
            <span className="text-sm font-medium">Browse categories</span>
            <span className="text-xs text-muted-foreground">→</span>
          </Link>
        </div>
      </div>
    </Screen>
  );
}
