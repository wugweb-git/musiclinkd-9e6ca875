import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ActionBar,
  Screen,
  TopBar,
  Btn,
  BtnLink,
  SearchBar,
  VerifiedBadge,
} from "@/components/ml/ui";
import { Card, Row, Dialog, EmptyState } from "@/components/ml/kit";
import { useAuth } from "@/hooks/use-auth";
import { bandViewFromRow, loadBand } from "@/lib/band-view";
import { listPeopleByRole } from "@/lib/profile-groups.functions";
import { addCollabMember } from "@/lib/collabs.functions";
import { sized } from "@/lib/image-url";

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
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [invited, setInvited] = useState<string[]>([]);
  const [sent, setSent] = useState<{ asked: number; failed: number } | null>(null);
  const [sending, setSending] = useState(false);

  const list = useServerFn(listPeopleByRole);
  const ask = useServerFn(addCollabMember);

  /* A band is a collab of type "band", so asking someone in is addCollabMember — it writes a
     collab_members row with status "invited", which they answer from their own side. */
  async function sendInvites(people: { id: string; username: string }[]) {
    if (!row) return;
    setSending(true);
    let failed = 0;
    for (const p of people) {
      try {
        await ask({ data: { id: row.id, username: p.username } });
      } catch {
        failed++;
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["band", row.slug] });
    setInvited([]);
    setSent({ asked: people.length - failed, failed });
    setSending(false);
  }
  const people = useQuery({
    queryKey: ["people", "invite-candidates"],
    queryFn: () => list({ data: {} }),
  });

  const results = (people.data ?? []).filter((p) =>
    q
      ? `${p.name} ${p.roles.join(" ")} ${p.city ?? ""}`.toLowerCase().includes(q.toLowerCase())
      : true,
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

        {people.isLoading ? (
          <ul className="space-y-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-16 animate-pulse rounded-lg bg-subtle" />
            ))}
          </ul>
        ) : people.isError ? (
          <EmptyState title="Couldn't load people" body="Check your connection and try again." />
        ) : results.length ? (
          results.map((t) => (
            <Row
              key={t.id}
              icon={
                <img
                  src={sized(t.avatarUrl ?? "", { width: 40 })}
                  alt=""
                  loading="lazy"
                  className="h-10 w-10 rounded-full object-cover"
                />
              }
              title={t.name}
              subtitle={[t.roles[0], t.city].filter(Boolean).join(" · ")}
              right={
                <span className="flex shrink-0 items-center gap-2">
                  {t.verified ? <VerifiedBadge size={16} /> : null}
                  <span
                    className={`rounded-full px-3 py-1.5 text-1 font-bold ${invited.includes(t.id) ? "bg-background text-muted-foreground" : "bg-ink text-ink-foreground"}`}
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
        <ActionBar>
          <Btn
            className="w-full"
            disabled={sending}
            onClick={() =>
              void sendInvites(
                results
                  .filter((t) => invited.includes(t.id) && t.username)
                  .map((t) => ({ id: t.id, username: t.username })),
              )
            }
          >
            {sending
              ? "Sending…"
              : `Send ${invited.length} invitation${invited.length === 1 ? "" : "s"}`}
          </Btn>
        </ActionBar>
      ) : null}

      <Dialog
        open={sent !== null}
        title={sent?.asked ? "Invitations sent" : "Nothing sent"}
        body={
          sent?.failed
            ? `${sent.asked} asked in. ${sent.failed} couldn't be — they may already be in this band.`
            : "They answer from their own side; the line-up updates when they accept."
        }
        onClose={() => setSent(null)}
      >
        <BtnLink to="/bands/$id/manage" params={{ id }} className="w-full">
          View Line-up
        </BtnLink>
      </Dialog>
    </Screen>
  );
}
