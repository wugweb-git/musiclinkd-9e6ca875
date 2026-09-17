import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState } from "@/components/ml/kit";
import { businessRoleLabel, rolePermissions, type BusinessRole } from "@/data/business";
import { businessView, loadBusiness } from "@/lib/business-view";
import { addTeamMember, updateTeamMember, removeTeamMember } from "@/lib/profile-groups.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";

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
  const { user } = useAuth();
  const router = useRouter();
  const b = businessView(Route.useLoaderData());
  const [invite, setInvite] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const addMember = useServerFn(addTeamMember);
  const changeRole = useServerFn(updateTeamMember);
  const removeMember = useServerFn(removeTeamMember);

  const add = useMutation({
    mutationFn: (memberName: string) => addMember({ data: { name: memberName } }),
    onSuccess: async () => {
      setInvite(false);
      setName("");
      await router.invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't add them. Try again."),
  });
  const setRole = useMutation({
    mutationFn: (vars: { id: string; role: string }) => changeRole({ data: vars }),
    onSuccess: async () => {
      setEditing(null);
      await router.invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });
  const remove = useMutation({
    mutationFn: (memberId: string) => removeMember({ data: { id: memberId } }),
    onSuccess: async () => {
      setEditing(null);
      await router.invalidate();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Couldn't remove them. Try again."),
  });

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

  const owner = Boolean(user && user.id === b.profileId);
  const active = b.members;
  const current = active.find((m) => m.id === editing);

  return (
    <Screen>
      <TopBar
        title="Team"
        subtitle={b.name}
        back={`/business/${id}`}
        {...(owner
          ? {
              right: (
                <button
                  type="button"
                  onClick={() => setInvite(true)}
                  aria-label="Add team member"
                  className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"
                >
                  <UserPlus size={iconSize.sm} />
                </button>
              ),
            }
          : {})}
      />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {active.length ? (
          <Card className="space-y-1">
            {active.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!owner}
                onClick={() => owner && setEditing(m.id)}
                className="flex w-full items-center gap-3 border-b border-border py-2.5 text-left last:border-0 disabled:opacity-100"
              >
                {m.photo ? (
                  <img
                    src={m.photo}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span aria-hidden className="h-10 w-10 shrink-0 rounded-full bg-background" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-1 font-semibold">{m.name}</span>
                  {m.detail ? (
                    <span className="block text-1 text-muted-foreground">{m.detail}</span>
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
          <h2 className="text-sm">What each role can do</h2>
          {rolePermissions.map((r) => (
            <div key={r.role} className="border-b border-border py-2 last:border-0">
              <p className="text-1 font-semibold">{businessRoleLabel[r.role]}</p>
              <p className="text-1 text-muted-foreground">{r.can.join(" · ")}</p>
            </div>
          ))}
        </Card>
      </div>

      <Sheet open={invite} onClose={() => setInvite(false)} title="Add team member">
        <div className="space-y-3">
          <label className="block">
            <span className="pill bg-background text-muted-foreground">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kabir Menon"
              className="mt-1.5 min-h-control w-full rounded-lg border border-border bg-background px-3 text-1 outline-none focus:border-primary"
            />
          </label>
          <p className="text-1 text-muted-foreground">
            They join your team roster right away — set their role from the list after.
          </p>
          <Btn
            className="w-full"
            disabled={name.trim().length < 1 || add.isPending}
            onClick={() => name.trim() && add.mutate(name.trim())}
          >
            {add.isPending ? "Adding…" : "Add to Team"}
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
              disabled={setRole.isPending}
              onClick={() => editing && setRole.mutate({ id: editing, role: businessRoleLabel[r] })}
            >
              Make {businessRoleLabel[r]}
            </Btn>
          ))}
          <Btn
            variant="ghost"
            className="w-full"
            disabled={remove.isPending}
            onClick={() => editing && remove.mutate(editing)}
          >
            Remove from team
          </Btn>
        </div>
      </Sheet>
    </Screen>
  );
}
