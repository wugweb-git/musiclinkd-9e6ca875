import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, Chip } from "@/components/ml/ui";
import { Card, EmptyState, Loading, StatusPill } from "@/components/ml/kit";
import { leadStatusTone } from "@/data/business";
import { businessView, loadBusiness } from "@/lib/business-view";
import { listMyLeads, setLeadStatus, type EnquiryStatus } from "@/lib/enquiries.functions";

export const Route = createFileRoute("/business/$id/leads")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Leads inbox | MusicLinkd" },
      {
        name: "description",
        content:
          "Every enquiry that arrived on your business page, with what they asked for and how far it got.",
      },
      { property: "og:title", content: "Leads inbox | MusicLinkd" },
      { property: "og:description", content: "Enquiries from your business page in one queue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessLeads,
});

const filters = ["All", "New", "Replied", "Booked"] as const;

function BusinessLeads() {
  const b = businessView(Route.useLoaderData());
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const queryClient = useQueryClient();
  const load = useServerFn(listMyLeads);
  const q = useQuery({ queryKey: ["leads", "mine"], queryFn: () => load() });
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

  if (!b) {
    return (
      <Screen>
        <TopBar title="Leads" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or you no longer have access to it."
          />
        </div>
      </Screen>
    );
  }

  const leads = q.data ?? [];
  const list = leads.filter(
    (l) => filter === "All" || l.status === (filter.toLowerCase() as EnquiryStatus),
  );

  return (
    <Screen>
      <TopBar title="Leads" subtitle={b.name} back={`/business/${b.id}/dashboard`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <div className="rail no-scrollbar flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f}
            </Chip>
          ))}
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
                    {l.status === "new" ? (
                      <Btn
                        className="flex-1"
                        disabled={updating === l.id}
                        onClick={() => void updateStatus(l.id, "replied")}
                      >
                        Mark replied
                      </Btn>
                    ) : null}
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
