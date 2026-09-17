import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { MessageCircle, MoreHorizontal, UserRoundPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { EmptyState, Loading, SegmentedField } from "@/components/ml/kit";
import {
  addCollabMember,
  answerCollabInvite,
  getCollab,
  listProjectTypes,
  leaveCollab,
  removeMember,
  setCollabStatus,
  setCollabVisibility,
  setMemberRole,
  transferCollab,
  type CollabStatus,
} from "@/lib/collabs.functions";
import { getMyProfile } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";

/*
 * One collab: what it is, who is in it, and where to talk. A band shows the same room; only its
 * kind and its members differ. Everything a tracker would hold — milestones, files, agreements —
 * the people in it keep between themselves.
 */
export const Route = createFileRoute("/collab/$id/")({
  head: () => ({
    meta: [
      { title: "Collaboration | MusicLinkd" },
      { name: "description", content: "Who is in this collaboration, and what it is." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CollabRoom,
});

const statuses = ["active", "paused", "completed", "archived"] as const;
const statusLabel: Record<CollabStatus, string> = {
  active: "Active",
  paused: "Paused",
  completed: "Finished",
  archived: "Archived",
};

function CollabRoom() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { signedIn, loading } = useAuth();
  const queryClient = useQueryClient();
  const load = useServerFn(getCollab);
  const add = useServerFn(addCollabMember);
  const move = useServerFn(setCollabStatus);
  const leave = useServerFn(leaveCollab);
  const changeRole = useServerFn(setMemberRole);
  const takeOut = useServerFn(removeMember);
  const handOver = useServerFn(transferCollab);
  const changeVisibility = useServerFn(setCollabVisibility);
  const answer = useServerFn(answerCollabInvite);
  const [username, setUsername] = useState("");

  const q = useQuery({
    queryKey: ["collab", id],
    queryFn: () => load({ data: { id } }),
    enabled: signedIn,
    retry: false,
  });
  const readProfile = useServerFn(getMyProfile);
  const profile = useQuery({
    queryKey: ["profile", "mine"],
    queryFn: () => readProfile(),
    enabled: signedIn,
  });

  const readTypes = useServerFn(listProjectTypes);
  const types = useQuery({ queryKey: ["project-types"], queryFn: () => readTypes() });

  const c = q.data ?? null;
  const myId = (profile.data as { id?: string } | null)?.id;
  const myMembership = c?.members.find((m) => m.profile_id === myId);
  const invited = myMembership?.status === "invited";
  const canManage =
    myMembership && myMembership.status === "active"
      ? ["owner", "admin"].includes(myMembership.role)
      : false;
  const inRoom = c?.members.filter((m) => m.status === "active") ?? [];
  const asked = c?.members.filter((m) => m.status === "invited") ?? [];
  const kind = c?.project_type
    ? (types.data?.find((t) => t.slug === c.project_type)?.label ?? c.project_type)
    : "";

  // Being asked in is a yes or a no, and nothing else happens until one of them.
  const decide = useMutation({
    mutationFn: (a: "join" | "no") => answer({ data: { id, answer: a } }),
    onSuccess: (_r, a) => {
      if (a === "no") {
        void navigate({ to: "/collab" });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["collab", id] });
      void queryClient.invalidateQueries({ queryKey: ["collabs", "mine"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  const invite = useMutation({
    mutationFn: () => add({ data: { id, username: username.trim().replace(/^@/, "") } }),
    onSuccess: () => {
      setUsername("");
      void queryClient.invalidateQueries({ queryKey: ["collab", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  // The three things you can do about a person, folded into their row.
  const person = useMutation<
    unknown,
    Error,
    { profileId: string; what: "admin" | "member" | "remove" | "owner" }
  >({
    mutationFn: ({
      profileId,
      what,
    }: {
      profileId: string;
      what: "admin" | "member" | "remove" | "owner";
    }) =>
      what === "remove"
        ? takeOut({ data: { id, profileId } })
        : what === "owner"
          ? handOver({ data: { id, profileId } })
          : changeRole({ data: { id, profileId, role: what } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collab", id] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  const visibility = useMutation({
    mutationFn: (next: "public" | "private") =>
      changeVisibility({ data: { id, visibility: next } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collab", id] }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  const status = useMutation({
    mutationFn: (next: CollabStatus) => move({ data: { id, status: next } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collab", id] }),
    onError: () => toast.error("That didn't save. Try again."),
  });

  const walkOut = useMutation({
    mutationFn: () => leave({ data: { id } }),
    onSuccess: () => void navigate({ to: "/collab" }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  if (signedIn && q.isLoading) {
    return (
      <Screen>
        <TopBar title="Collaboration" back="/collab" />
        <div className="px-5 pt-4">
          <Loading rows={3} />
        </div>
      </Screen>
    );
  }

  if (!c) {
    return (
      <Screen>
        <TopBar title="Collaboration" back="/collab" />
        <div className="px-5 pt-6">
          <EmptyState
            title={signedIn || loading ? "This collaboration is not open to you" : "Sign in first"}
            body={
              signedIn || loading
                ? "A private project is visible to the people in it."
                : "Sign in to see the projects and bands you are part of."
            }
          >
            <BtnLink to={signedIn ? "/collab" : "/welcome"} className="w-full">
              {signedIn ? "Back to Collaborations" : "Sign In"}
            </BtnLink>
          </EmptyState>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar
        title={c.name}
        subtitle={joinParts(
          c.type === "band" ? "Band" : kind || "Project",
          c.visibility === "private" ? "Private" : "Public",
          c.city ?? "",
        )}
        back="/collab"
      />

      <div className="space-y-6 px-5 pt-4 pb-8">
        {invited ? (
          <section className="space-y-3 rounded-lg bg-subtle p-4">
            <p className="text-sm">
              {joinParts(
                myMembership?.role === "admin" ? "You were asked in as an admin" : "You were asked to join",
                c.name,
              )}
            </p>
            <div className="flex gap-2">
              <Btn
                className="flex-1"
                loading={decide.isPending && decide.variables === "join"}
                onClick={() => decide.mutate("join")}
              >
                Join
              </Btn>
              <Btn
                variant="outline"
                className="flex-1"
                loading={decide.isPending && decide.variables === "no"}
                onClick={() => decide.mutate("no")}
              >
                No thanks
              </Btn>
            </div>
          </section>
        ) : null}

        {c.bio ? <p className="text-sm leading-relaxed">{c.bio}</p> : null}

        <section className="space-y-2">
          <h2 className="text-sm">
            {inRoom.length} {inRoom.length === 1 ? "person" : "people"}
          </h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
            {inRoom.map((m) => (
              <li key={m.profile_id} className="flex items-center gap-3 px-4 py-3">
                {m.profile?.avatar_url ? (
                  <img
                    src={m.profile.avatar_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background"
                  >
                    <UsersRound size={iconSize.sm} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  {m.profile?.username ? (
                    <Link
                      to="/profile/$username"
                      params={{ username: m.profile.username }}
                      className="block truncate text-sm font-semibold"
                    >
                      {m.profile.display_name ?? m.profile.username}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-semibold">Someone</span>
                  )}
                  {m.instrument ? (
                    <span className="block truncate text-1 text-muted-foreground">
                      {m.instrument}
                    </span>
                  ) : null}
                </span>
                {m.role === "owner" ? (
                  <span className="pill shrink-0 bg-background text-muted-foreground">Owner</span>
                ) : canManage && m.profile_id !== myId ? (
                  <MemberMenu
                    role={m.role}
                    busy={person.isPending}
                    isOwner={myMembership?.role === "owner"}
                    onChoose={(what) => person.mutate({ profileId: m.profile_id, what })}
                  />
                ) : m.role === "admin" ? (
                  <span className="pill shrink-0 bg-background text-muted-foreground">Admin</span>
                ) : null}
              </li>
            ))}
          </ul>

          {/* Asked, not answered: they are not in the room until they say yes. */}
          {asked.length ? (
            <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
              {asked.map((m) => (
                <li key={m.profile_id} className="flex items-center gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {m.profile?.display_name ?? m.profile?.username ?? "Someone"}
                  </span>
                  <span className="pill shrink-0 bg-background text-muted-foreground">Asked</span>
                  {canManage ? (
                    <button
                      type="button"
                      className="state-layer shrink-0 rounded-lg px-2 py-1 text-1 font-semibold text-destructive"
                      onClick={() => person.mutate({ profileId: m.profile_id, what: "remove" })}
                    >
                      Undo
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {canManage ? (
            <form
              className="flex gap-2 pt-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (username.trim() && !invite.isPending) invite.mutate();
              }}
            >
              <label className="sr-only" htmlFor="add-member">
                Username
              </label>
              <input
                id="add-member"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="min-h-control min-w-0 flex-1 rounded-lg border border-border bg-card px-4 text-sm outline-none"
              />
              <Btn
                type="submit"
                variant="outline"
                className="shrink-0 px-4"
                icon={<UserRoundPlus size={iconSize.sm} aria-hidden />}
                loading={invite.isPending}
              >
                Ask
              </Btn>
            </form>
          ) : null}
          {canManage ? (
            <p className="text-1 text-muted-foreground">
              They get asked, and are in once they say yes.
            </p>
          ) : null}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm">Talk</h2>
          <BtnLink to="/messages" variant="outline" className="w-full">
            <MessageCircle size={iconSize.sm} className="mr-1.5" aria-hidden /> Open messages
          </BtnLink>
        </section>

        {canManage ? (
          <section className="space-y-2">
            <h2 className="text-sm">Who can see it</h2>
            <SegmentedField
              label="Who can see it"
              value={c.visibility === "private" ? "Only the people in it" : "Anyone on MusicLinkd"}
              options={["Only the people in it", "Anyone on MusicLinkd"] as const}
              onChange={(next) =>
                visibility.mutate(next === "Anyone on MusicLinkd" ? "public" : "private")
              }
            />
          </section>
        ) : null}

        {canManage ? (
          <section className="space-y-2">
            <h2 className="text-sm">Where it stands</h2>
            <SegmentedField
              label="Where it stands"
              value={statusLabel[c.status]}
              options={statuses.map((s) => statusLabel[s])}
              onChange={(next) => {
                const match = statuses.find((s) => statusLabel[s] === next);
                if (match) status.mutate(match);
              }}
            />
          </section>
        ) : null}

        {/* The owner cannot walk out of their own; they hand it over first. */}
        {myMembership && myMembership.role !== "owner" ? (
          <Btn
            variant="ghost"
            className="w-full"
            loading={walkOut.isPending}
            onClick={() => walkOut.mutate()}
          >
            Leave this collaboration
          </Btn>
        ) : null}
      </div>
    </Screen>
  );
}

/** What an owner or admin can do about one person: make them admin, hand over, or take them out. */
function MemberMenu({
  role,
  isOwner,
  busy,
  onChoose,
}: {
  role: "owner" | "admin" | "member";
  isOwner: boolean;
  busy: boolean;
  onChoose: (what: "admin" | "member" | "remove" | "owner") => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative shrink-0">
      <button
        type="button"
        aria-label="Change this person"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="state-layer flex h-9 w-9 items-center justify-center rounded-full"
        disabled={busy}
      >
        <MoreHorizontal size={iconSize.md} aria-hidden />
      </button>
      {open ? (
        <span className="absolute right-0 top-10 z-tabs flex w-44 flex-col overflow-hidden rounded-lg bg-card shadow-elevation-2">
          <button
            type="button"
            className="state-layer px-4 py-3 text-left text-1 font-semibold"
            onClick={() => {
              setOpen(false);
              onChoose(role === "admin" ? "member" : "admin");
            }}
          >
            {role === "admin" ? "Make a member" : "Make an admin"}
          </button>
          {isOwner ? (
            <button
              type="button"
              className="state-layer px-4 py-3 text-left text-1 font-semibold"
              onClick={() => {
                setOpen(false);
                onChoose("owner");
              }}
            >
              Hand the project over
            </button>
          ) : null}
          <button
            type="button"
            className="state-layer px-4 py-3 text-left text-1 font-semibold text-destructive"
            onClick={() => {
              setOpen(false);
              onChoose("remove");
            }}
          >
            Take out of the project
          </button>
        </span>
      ) : null}
    </span>
  );
}
