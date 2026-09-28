import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, EmptyState, Loading, StatusPill, Segmented } from "@/components/ml/kit";
import { leadStatusTone } from "@/data/business";
import { listMyLeads, setLeadStatus, type EnquiryStatus } from "@/lib/enquiries.functions";
import { conversationWith } from "@/lib/messages.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads inbox | MusicLinkd" },
      {
        name: "description",
        content:
          "Every enquiry about the services you offer, with what they asked for and how far it got.",
      },
      { property: "og:title", content: "Leads inbox | MusicLinkd" },
      {
        property: "og:description",
        content: "Enquiries about the services you offer, in one queue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessLeads,
});

const filters = ["All", "New", "Replied", "Booked"] as const;

function BusinessLeads() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const queryClient = useQueryClient();
  const load = useServerFn(listMyLeads);
  const { loading, signedIn } = useAuth();
  /*
   * listMyLeads filters on the signed-in account, so this screen needs no id in its address —
   * and no business gate either. `sendEnquiry` writes `business_profile_id = the service owner`,
   * which is whoever offers the service: a session player with a mixing service receives enquiries
   * exactly as a studio does. This screen used to be behind `useRequireBusiness`, so that row was
   * written and never shown, while /leads stayed in the menu for talent accounts and walled them
   * off at it. The gate was tighter than the data (audit C2, 29 Sep 2026).
   */
  const q = useQuery({ queryKey: ["leads", "mine"], queryFn: () => load(), enabled: signedIn });
  const answer = useServerFn(setLeadStatus);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: EnquiryStatus) {
    if (status !== "replied" && status !== "booked" && status !== "closed") return;
    setUpdating(id);
    try {
      await answer({ data: { id, status } });
      await queryClient.invalidateQueries({ queryKey: ["leads", "mine"] });
    } catch {
      toast.error("Couldn't update that — try again");
    } finally {
      setUpdating(null);
    }
  }

  // Answer in Messages: the conversation with whoever sent it, and the lead counts as replied.
  const navigate = useNavigate();
  const startConversation = useServerFn(conversationWith);
  async function reply(id: string, senderId: string, status: EnquiryStatus) {
    setUpdating(id);
    try {
      const { id: conversationId } = await startConversation({ data: { profileId: senderId } });
      if (status === "new") await answer({ data: { id, status: "replied" } });
      await queryClient.invalidateQueries({ queryKey: ["leads", "mine"] });
      void navigate({ to: "/conversation/$id", params: { id: conversationId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't open that conversation — try again");
    } finally {
      setUpdating(null);
    }
  }

  if (loading || !signedIn) {
    return (
      <Screen>
        <TopBar title="Leads" back="/home" />
        {loading ? (
          <div className="px-5 pt-6">
            <Loading rows={3} />
          </div>
        ) : (
          <EmptyState
            title="Sign in to see your leads"
            body="Enquiries about the services you offer arrive here."
          >
            <Link
              to="/welcome"
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Sign in
            </Link>
          </EmptyState>
        )}
      </Screen>
    );
  }

  const leads = q.data ?? [];
  const list = leads.filter(
    (l) => filter === "All" || l.status === (filter.toLowerCase() as EnquiryStatus),
  );

  return (
    <Screen>
      <TopBar title="Leads" back="/home" />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <div className="">
          <Segmented value={filter} options={filters} onChange={setFilter} />
        </div>

        {q.isLoading ? (
          <Loading rows={3} />
        ) : list.length ? (
          <div className="space-y-3">
            {list.map((l) => (
              <Card key={l.id}>
                <div className="flex items-center gap-3">
                  {l.sender?.avatar_url ? (
                    <img
                      src={l.sender.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span className="h-10 w-10 shrink-0 rounded-full bg-subtle" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {l.sender?.display_name ?? l.sender?.username ?? "Someone"}
                    </p>
                    <p className="truncate text-1 text-muted-foreground">
                      {l.intent} · {new Date(l.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <StatusPill label={l.status} tone={leadStatusTone[l.status]} />
                </div>
                <p className="mt-3 text-1">{l.message}</p>
                {l.status === "new" || l.status === "replied" ? (
                  <div className="mt-3 flex gap-2">
                    {l.sender ? (
                      <Btn
                        variant="outline"
                        className="flex-1"
                        disabled={updating === l.id}
                        onClick={() => void reply(l.id, l.sender!.id, l.status)}
                      >
                        Message
                      </Btn>
                    ) : null}
                    {l.status === "new" ? (
                      <Btn
                        className="flex-1"
                        disabled={updating === l.id}
                        onClick={() => void updateStatus(l.id, "replied")}
                      >
                        Mark replied
                      </Btn>
                    ) : (
                      <Btn
                        className="flex-1"
                        disabled={updating === l.id}
                        onClick={() => void updateStatus(l.id, "booked")}
                      >
                        Mark booked
                      </Btn>
                    )}
                    <Btn
                      variant="ghost"
                      className="flex-1"
                      disabled={updating === l.id}
                      onClick={() => void updateStatus(l.id, "closed")}
                    >
                      Mark closed
                    </Btn>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing in this queue"
            body="New enquiries from your business page land here first."
          />
        )}
      </div>
    </Screen>
  );
}
