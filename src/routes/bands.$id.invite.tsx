import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, TopBar, Btn, BtnLink, SearchBar, VerifiedBadge } from "@/components/ml/ui";
import { Card, Row, Dialog, EmptyState } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import { bandViewFromRow, loadBand } from "@/lib/band-view";
import { talents } from "@/data/discover";

export const Route = createFileRoute("/bands/$id/invite")({
  loader: ({ params }) => loadBand(params.id),
  head: () => ({
    meta: [
      { title: "Invite Band Members | MusicLinkd" },
      { name: "description", content: "Invite musicians to join your band line-up on MusicLinkd." },
      { property: "og:title", content: "Invite Band Members | MusicLinkd" },
      { property: "og:description", content: "Invite musicians to your band line-up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InviteMembers,
});

function InviteMembers() {
  const { id } = Route.useParams();
  const { band: row, labels } = Route.useLoaderData();
  const { user } = useAuth();
  const band = row ? bandViewFromRow(row, labels, user?.id ?? null) : undefined;
  const [q, setQ] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const [sent, setSent] = useState(false);

  const results = talents.filter((t) =>
    q ? `${t.name} ${t.role} ${t.location}`.toLowerCase().includes(q.toLowerCase()) : true,
  );

  return (
    <Screen bottomNav={false}>
      <TopBar title="Invite members" subtitle={band?.name ?? "Band"} back="/bands" />
      <div className="space-y-4 px-5 pt-4 pb-28">
        <SearchBar value={q} onChange={setQ} placeholder="Search people by name, role or city" />
        <Card className="space-y-2">
          <h2 className="text-sm">Invite by link</h2>
          <p className="text-1 text-muted-foreground">
            Share a join link or your band QR with someone who is not on MusicLinkd yet.
          </p>
          <BtnLink to="/identity/qr" variant="outline" className="w-full">
            Open Band QR
          </BtnLink>
        </Card>

        {results.length ? (
          results.map((t) => (
            <Row
              key={t.id}
              icon={
                <img
                  src={t.photo}
                  alt=""
                  loading="lazy"
                  className="h-10 w-10 rounded-full object-cover"
                />
              }
              title={t.name}
              subtitle={`${t.role} · ${t.location}`}
              right={
                <span className="flex shrink-0 items-center gap-2">
                  {t.verified ? <VerifiedBadge size={14} /> : null}
                  <span
                    className={`rounded-full px-3 py-1.5 text-0 font-bold ${invited.includes(t.id) ? "bg-subtle text-muted-foreground" : "bg-primary text-primary-foreground"}`}
                  >
                    {invited.includes(t.id) ? "Invited" : "Invite"}
                  </span>
                </span>
              }
              onClick={() =>
                setInvited((p) => (p.includes(t.id) ? p.filter((x) => x !== t.id) : [...p, t.id]))
              }
            />
          ))
        ) : (
          <EmptyState
            title="No people match that search"
            body="Try a different name, role or city."
          />
        )}
      </div>

      {invited.length ? (
        <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-app border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
          <Btn className="w-full" onClick={() => setSent(true)}>
            Send {invited.length} invitation{invited.length === 1 ? "" : "s"}
          </Btn>
        </div>
      ) : null}

      <Dialog
        open={sent}
        title="Invitations sent"
        body="They will see the invite in Notifications and can accept or decline from their profile."
        onClose={() => setSent(false)}
      >
        <BtnLink to="/bands/$id/manage" params={{ id }} className="w-full">
          View Invitations
        </BtnLink>
      </Dialog>
    </Screen>
  );
}
