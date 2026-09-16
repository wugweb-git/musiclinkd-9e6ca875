import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState } from "@/components/ml/kit";
import { businessRoleLabel, rolePermissions, type BusinessRole } from "@/data/business";
import { businessView, loadBusiness } from "@/lib/business-view";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/business/$id/team")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Team & roles | MusicLinkd" },
      {
        name: "description",
        content: "Invite staff, set what each role can do and remove people from your business.",
      },
      { property: "og:title", content: "Team & roles | MusicLinkd" },
      { property: "og:description", content: "Owners, managers, engineers and staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamScreen,
});

function TeamScreen() {
  const { id } = Route.useParams();
  const b = businessView(Route.useLoaderData());
  const [members, setMembers] = useState(b?.members ?? []);
  const [invite, setInvite] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  if (!b) {
    return (
      <Screen>
        <TopBar title="Team" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState title="Business not found" body="It may have been removed." />
        </div>
      </Screen>
    );
  }

  const active = members;
  const current = members.find((m) => m.id === editing);

  return (
    <Screen>
      <TopBar
        title="Team"
        subtitle={b.name}
        back={`/business/${id}`}
        right={
          <button
            type="button"
            onClick={() => setInvite(true)}
            aria-label="Invite member"
            className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
          >
            <UserPlus size={16} />
          </button>
        }
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {active.length ? (
          <Card className="space-y-1">
            {active.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setEditing(m.id)}
                className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left last:border-0"
              >
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-subtle" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{m.name}</span>
                  {m.detail ? (
                    <span className="block text-[11px] text-muted-foreground">{m.detail}</span>
                  ) : null}
                </span>
                {m.invited ? <StatusPill label="invited" tone="warn" /> : null}
              </button>
            ))}
          </Card>
        ) : (
          <EmptyState title="No team yet" body="Invite the people who run sessions with you." />
        )}

        <Card className="space-y-2">
          <h2 className="text-[15px]">What each role can do</h2>
          {rolePermissions.map((r) => (
            <div key={r.role} className="border-b border-border py-2 last:border-0">
              <p className="text-[13px] font-semibold">{businessRoleLabel[r.role]}</p>
              <p className="text-[11px] text-muted-foreground">{r.can.join(" · ")}</p>
            </div>
          ))}
        </Card>
      </div>

      <Sheet open={invite} onClose={() => setInvite(false)} title="Invite to team">
        <div className="space-y-3">
          <label className="block">
            <span className="pill bg-subtle text-muted-foreground">Email or @username</span>
            <input
              placeholder="@kabir"
              className="mt-1.5 min-h-12 w-full rounded-lg border border-border bg-background px-3 text-[13px] outline-none focus:border-primary"
            />
          </label>
          <p className="text-[12px] text-muted-foreground">
            They keep their own profile and appear on your team page once they accept.
          </p>
          <Btn className="w-full" onClick={() => setInvite(false)}>
            Send invite
          </Btn>
        </div>
      </Sheet>

      <Sheet open={!!current} onClose={() => setEditing(null)} title={current?.name ?? "Member"}>
        <div className="space-y-2">
          {(Object.keys(businessRoleLabel) as BusinessRole[]).map((r) => (
            <Btn
              key={r}
              variant={current?.role === businessRoleLabel[r] ? "primary" : "outline"}
              className="w-full"
              onClick={() => {
                setMembers((list) =>
                  list.map((m) =>
                    m.id === editing
                      ? {
                          ...m,
                          role: businessRoleLabel[r],
                          detail: joinParts(
                            businessRoleLabel[r],
                            m.since ? `since ${m.since}` : "",
                          ),
                        }
                      : m,
                  ),
                );
                setEditing(null);
              }}
            >
              Make {businessRoleLabel[r]}
            </Btn>
          ))}
          <Btn
            variant="ghost"
            className="w-full"
            onClick={() => {
              setMembers((list) => list.filter((m) => m.id !== editing));
              setEditing(null);
            }}
          >
            Remove from team
          </Btn>
        </div>
      </Sheet>
    </Screen>
  );
}
