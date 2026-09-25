import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { shareUrl } from "@/lib/site";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Camera,
  ImagePlus,
  CircleCheck,
  CirclePause,
  CirclePlay,
  Copy,
  Link2,
  MoreHorizontal,
  Pencil,
  Share2,
  UserRoundCheck,
  UserRoundPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink, Chip, IconBtn, Sheet } from "@/components/ml/ui";
import { Dialog, EmptyState, Loading, SegmentedField } from "@/components/ml/kit";
import {
  addCollabMember,
  answerCollabInvite,
  deleteCollab,
  setCollabImage,
  setCollabBudget,
  getCollabBudget,
  getCollab,
  getCollabInviteLink,
  letInCollabMember,
  listProjectTypes,
  leaveCollab,
  setCollabInviteLink,
  removeMember,
  setCollabStatus,
  setCollabVisibility,
  setMemberRole,
  transferCollab,
  updateCollab,
  type Collab,
  type CollabStatus,
} from "@/lib/collabs.functions";
import { searchPeople } from "@/lib/profile-groups.functions";
import { getMyProfile } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";
import { CityField, Field, SheetSelect, inputClass } from "@/components/ml/listing-form";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
import { CoverHero, ImagePickButton } from "@/components/ml/profile";
import { uploadProfileImage, type ProfileImageKind } from "@/lib/profile-images";
import { SwitchRow } from "@/components/ml/market";
import { shareLink } from "@/lib/booking-actions";
import { useMessagePerson } from "@/hooks/use-message-person";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";

/*
 * One collab: what it is and who is in it; talking happens in Messages (owner, 22 Sep 2026). A band
 * shows the same room; only its
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

/** One line under each choice in the drawer: what it means for the people in it. */
const statusHint: Record<CollabStatus, string> = {
  active: "Work is going on",
  paused: "On hold for now",
  completed: "Done; it stays for the record",
  archived: "Put away; hidden from your list",
};

const statusIcon: Record<CollabStatus, LucideIcon> = {
  active: CirclePlay,
  paused: CirclePause,
  completed: CircleCheck,
  archived: Archive,
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
  const remove = useServerFn(deleteCollab);
  const saveImage = useServerFn(setCollabImage);
  const find = useServerFn(searchPeople);
  const [username, setUsername] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
  const taxonomy = useTaxonomy().options;
  // The budget is for the people in it; the database answers null for anyone else.
  const readBudget = useServerFn(getCollabBudget);
  const budgetQ = useQuery({
    queryKey: ["collab-budget", id],
    queryFn: () => readBudget({ data: { id } }),
    enabled: myMembership?.status === "active" && c?.type === "project",
  });
  const invited = myMembership?.status === "invited";
  // Asked to join by link, waiting for an owner or admin: they asked themselves in.
  const requested = invited && myMembership?.invited_by === myMembership?.profile_id;
  const inviterName =
    myMembership?.inviter?.display_name ?? myMembership?.inviter?.username ?? null;
  const messagePerson = useMessagePerson();
  const canManage =
    myMembership && myMembership.status === "active"
      ? ["owner", "admin"].includes(myMembership.role)
      : false;
  const inRoom = c?.members.filter((m) => m.status === "active") ?? [];
  const asked = c?.members.filter((m) => m.status === "invited") ?? [];
  const kind = c?.project_type
    ? (types.data?.find((t) => t.slug === c.project_type)?.label ?? c.project_type)
    : "";

  // Asking someone in: type a name and pick them, or type their exact username.
  const term = username.trim().replace(/^@/, "");
  const candidates = useQuery({
    queryKey: ["collab-invite-search", term],
    queryFn: () => find({ data: { q: term, limit: 8 } }),
    enabled: canManage && term.length >= 2,
  });
  const inCollab = new Set(c?.members.map((m) => m.profile_id) ?? []);
  const suggestions = (candidates.data?.people ?? [])
    .filter((p) => !inCollab.has(p.id) && p.id !== myId)
    .slice(0, 5);

  // Being asked in is a yes or a no, and nothing else happens until one of them.
  const decide = useMutation({
    mutationFn: (a: "join" | "no") => answer({ data: { id, answer: a } }),
    onSuccess: (_r, a) => {
      void queryClient.invalidateQueries({ queryKey: ["collabs", "mine"] });
      if (a === "no") {
        void navigate({ to: "/collab" });
        return;
      }
      // A band has its own page (owner, 22 Sep 2026); once in, that is where they go.
      if (c?.type === "band") {
        void navigate({ to: "/bands/$id", params: { id: c.slug }, replace: true });
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["collab", id] });
      void queryClient.invalidateQueries({ queryKey: ["collabs", "mine"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  const invite = useMutation({
    mutationFn: (who: string) => add({ data: { id, username: who } }),
    onSuccess: () => {
      setUsername("");
      void queryClient.invalidateQueries({ queryKey: ["collab", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  // A band is shown on its own page (owner, 22 Sep 2026). Someone invited stays here to answer,
  // so wait until we know where this account stands before sending anyone on.
  const standingKnown = !signedIn || profile.isSuccess;
  useEffect(() => {
    if (c?.type === "band" && standingKnown && !invited) {
      void navigate({ to: "/bands/$id", params: { id: c.slug }, replace: true });
    }
  }, [c?.type, c?.slug, standingKnown, invited, navigate]);

  // Someone who asked to join by link comes in when an owner or admin lets them.
  const letIn = useServerFn(letInCollabMember);
  const admit = useMutation({
    mutationFn: (profileId: string) => letIn({ data: { id, profileId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collab", id] }),
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

  const destroy = useMutation({
    mutationFn: () => remove({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["collabs", "mine"] });
      void navigate({ to: "/collab" });
    },
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

  // Banner and picture: uploaded to the signed-in owner's folder, then saved on the project.
  async function pickImage(which: ProfileImageKind, file: File) {
    if (!c) return;
    try {
      const url = await uploadProfileImage(which, file);
      await saveImage({ data: { id: c.id, kind: which, url } });
      await queryClient.invalidateQueries({ queryKey: ["collab", id] });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "That didn't upload. Try again.");
    }
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
      {/* The project's banner and picture: the cover header profiles use, changed from the cover. */}
      <CoverHero
        cover={c.cover_url ?? undefined}
        photo={c.avatar_url ?? undefined}
        name={c.name}
        square
        back="/collab"
        actions={
          <>
            <IconBtn
              label="Share"
              variant="plain"
              onClick={() => void shareLink({ title: c.name, url: shareUrl(`/collab/${c.id}`) })}
              className="bg-card/90"
            >
              <Share2 size={iconSize.sm} aria-hidden />
            </IconBtn>
            {canManage ? (
              <>
                <ImagePickButton
                  kind="cover"
                  label="Change banner"
                  className="h-10 w-10 bg-card/90 text-foreground"
                  onPick={pickImage}
                >
                  <ImagePlus size={iconSize.sm} aria-hidden />
                </ImagePickButton>
                <IconBtn
                  label="Edit"
                  variant="plain"
                  onClick={() => setEditing(true)}
                  className="bg-card/90"
                >
                  <Pencil size={iconSize.sm} aria-hidden />
                </IconBtn>
              </>
            ) : null}
          </>
        }
        photoPick={
          canManage ? (
            <ImagePickButton
              kind="avatar"
              label="Change picture"
              className="absolute -bottom-1 -left-1 h-9 w-9 border border-border bg-card text-foreground"
              onPick={pickImage}
            >
              <Camera size={iconSize.sm} aria-hidden />
            </ImagePickButton>
          ) : null
        }
      >
        <p className="mt-1 text-1 text-muted-foreground">
          {joinParts(
            c.type === "band" ? "Band" : kind || "Project",
            c.visibility === "private" ? "Private" : "Public",
            c.city ?? "",
            c.ends_on ? `Wraps up ${formatDay(c.ends_on)}` : "",
          )}
        </p>
      </CoverHero>

      <div className="space-y-6 px-5 pt-4 pb-8">
        {requested ? (
          <section className="space-y-3 rounded-lg bg-subtle p-4">
            <p className="text-sm">You asked to join. An owner or admin lets you in.</p>
            <Btn
              variant="outline"
              className="w-full"
              loading={decide.isPending}
              onClick={() => decide.mutate("no")}
            >
              Withdraw
            </Btn>
          </section>
        ) : invited ? (
          <section className="space-y-3 rounded-lg bg-subtle p-4">
            <p className="text-sm">
              {joinParts(
                myMembership?.role === "admin"
                  ? "You were asked in as an admin"
                  : "You were asked to join",
                c.name,
              )}
            </p>
            {inviterName ? (
              <p className="text-1 text-muted-foreground">Invited by {inviterName}</p>
            ) : null}
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
            {myMembership?.invited_by ? (
              <Btn
                variant="ghost"
                className="w-full"
                loading={messagePerson.pending}
                onClick={() => {
                  if (myMembership.invited_by) void messagePerson.open(myMembership.invited_by);
                }}
              >
                Ask a question first
              </Btn>
            ) : null}
          </section>
        ) : null}

        {c.bio ? <p className="text-sm leading-relaxed">{c.bio}</p> : null}

        {c.type === "project" &&
        (c.starts_on || c.ends_on || c.work_mode || budgetQ.data?.budgetPaise != null) ? (
          <section className="space-y-2">
            <h2 className="text-sm">Plan</h2>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-lg bg-subtle p-4 text-1">
              {c.starts_on ? (
                <>
                  <dt className="text-muted-foreground">Starts</dt>
                  <dd>{formatDay(c.starts_on)}</dd>
                </>
              ) : null}
              {c.ends_on ? (
                <>
                  <dt className="text-muted-foreground">Target</dt>
                  <dd>{formatDay(c.ends_on)}</dd>
                </>
              ) : null}
              {c.work_mode ? (
                <>
                  <dt className="text-muted-foreground">How you'll work</dt>
                  <dd>{labelFor(taxonomy?.work_modes, c.work_mode)}</dd>
                </>
              ) : null}
              {budgetQ.data?.budgetPaise != null ? (
                <>
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd>
                    ₹{(budgetQ.data.budgetPaise / 100).toLocaleString("en-IN")}
                    <span className="block text-muted-foreground">People in it only</span>
                  </dd>
                </>
              ) : null}
            </dl>
          </section>
        ) : null}

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
                  {m.invited_by === m.profile_id ? (
                    // They asked to join by link; an owner or admin lets them in.
                    <span className="shrink-0 text-1 text-muted-foreground">Asked to join</span>
                  ) : (
                    <span className="pill shrink-0 bg-background text-muted-foreground">Asked</span>
                  )}
                  {canManage && m.invited_by === m.profile_id ? (
                    <IconBtn
                      label="Let in"
                      variant="plain"
                      loading={admit.isPending && admit.variables === m.profile_id}
                      onClick={() => admit.mutate(m.profile_id)}
                    >
                      <UserRoundCheck size={iconSize.sm} aria-hidden />
                    </IconBtn>
                  ) : null}
                  {canManage ? (
                    <button
                      type="button"
                      className="state-layer shrink-0 rounded-lg px-2 py-1 text-1 font-semibold text-destructive"
                      onClick={() => person.mutate({ profileId: m.profile_id, what: "remove" })}
                    >
                      {m.invited_by === m.profile_id ? "Say no" : "Undo"}
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
                if (term && !invite.isPending) invite.mutate(term);
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
          {canManage && suggestions.length ? (
            <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
              {suggestions.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="state-layer flex w-full items-center gap-3 px-4 py-3 text-left"
                    disabled={invite.isPending}
                    onClick={() => invite.mutate(p.username)}
                  >
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background"
                      >
                        <UsersRound size={iconSize.sm} />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.name}</span>
                      <span className="block truncate text-1 text-muted-foreground">
                        {joinParts(`@${p.username}`, p.city ?? "")}
                      </span>
                    </span>
                    <UserRoundPlus size={iconSize.sm} aria-hidden className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {canManage ? (
            <p className="text-1 text-muted-foreground">
              They get asked, and are in once they say yes.
            </p>
          ) : null}
          {canManage ? <InviteLinkRow collabId={c.id} name={c.name} /> : null}
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
            <SheetSelect
              title="Where it stands"
              value={c.status}
              options={statuses.map((s) => ({
                value: s,
                label: statusLabel[s],
                hint: statusHint[s],
                icon: statusIcon[s],
              }))}
              onChange={(next) => {
                const match = statuses.find((s) => s === next);
                if (match && match !== c.status) status.mutate(match);
              }}
              placeholder="Pick one"
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

        {/* Only a project is ended here, and only by its owner; a band has its own screens. */}
        {myMembership?.role === "owner" &&
        myMembership.status === "active" &&
        c.type === "project" ? (
          <Btn
            variant="ghost"
            className="w-full text-destructive"
            onClick={() => setConfirmDelete(true)}
          >
            Delete this project
          </Btn>
        ) : null}
      </div>

      {canManage ? (
        <EditCollabSheet
          open={editing}
          collab={c}
          types={types.data ?? []}
          budgetPaise={budgetQ.data?.budgetPaise ?? null}
          onClose={() => setEditing(false)}
        />
      ) : null}

      <Dialog
        open={confirmDelete}
        title={`Delete ${c.name}?`}
        body="The project, who is in it and what was said in it go for good."
        onClose={() => setConfirmDelete(false)}
      >
        <Btn className="w-full" loading={destroy.isPending} onClick={() => destroy.mutate()}>
          Delete
        </Btn>
        <Btn variant="outline" className="w-full" onClick={() => setConfirmDelete(false)}>
          Keep it
        </Btn>
      </Dialog>
    </Screen>
  );
}

/**
 * The project's join link, for owners and admins: make it, copy or share it, turn it off, and say
 * whether the owner approves each join (the old invite-link screen, now a row in the project).
 */
function InviteLinkRow({ collabId, name }: { collabId: string; name: string }) {
  const queryClient = useQueryClient();
  const read = useServerFn(getCollabInviteLink);
  const write = useServerFn(setCollabInviteLink);
  const link = useQuery({
    queryKey: ["collab-invite-link", collabId],
    queryFn: () => read({ data: { id: collabId } }),
  });
  const change = useMutation({
    mutationFn: (patch: { active?: boolean; needsApproval?: boolean }) =>
      write({ data: { id: collabId, ...patch } }),
    onSuccess: (row) => queryClient.setQueryData(["collab-invite-link", collabId], row),
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  if (link.isLoading) return null;
  const row = link.data;
  if (!row) {
    return (
      <Btn
        variant="outline"
        className="w-full"
        icon={<Link2 size={iconSize.sm} aria-hidden />}
        loading={change.isPending}
        onClick={() => change.mutate({})}
      >
        Create a link
      </Btn>
    );
  }

  const url = shareUrl(`/collab/join/${row.token}`);
  return (
    <div className="overflow-hidden rounded-lg bg-subtle">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link2 size={iconSize.sm} aria-hidden className="shrink-0" />
        <span
          className={`min-w-0 flex-1 truncate text-1 text-muted-foreground ${row.active ? "" : "line-through"}`}
        >
          {url}
        </span>
        <IconBtn
          label="Copy link"
          variant="plain"
          disabled={!row.active}
          onClick={() => {
            navigator.clipboard.writeText(url).then(
              () => toast.success("Link copied"),
              () => toast.error("Couldn't copy the link"),
            );
          }}
        >
          <Copy size={iconSize.sm} aria-hidden />
        </IconBtn>
        <IconBtn
          label="Share link"
          variant="plain"
          disabled={!row.active}
          onClick={() => void shareLink({ title: `Join ${name}`, url })}
        >
          <Share2 size={iconSize.sm} aria-hidden />
        </IconBtn>
      </div>
      <SwitchRow
        label="Link is active"
        value={row.active}
        onChange={(v) => change.mutate({ active: v })}
      />
      <SwitchRow
        label="Owner approves each join"
        value={row.needs_approval}
        onChange={(v) => change.mutate({ needsApproval: v })}
      />
    </div>
  );
}

/** "12 Dec 2026" from a yyyy-mm-dd date, read as a calendar day. */
function formatDay(day: string) {
  const [y = 0, m = 1, d = 1] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Change what the collab is. The same fields as starting one, plus when it wraps up. */
function EditCollabSheet({
  open,
  collab,
  types,
  budgetPaise,
  onClose,
}: {
  open: boolean;
  collab: Collab;
  types: { slug: string; label: string }[];
  /** What the budget is now, for the people in it; null when none was set. */
  budgetPaise: number | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(updateCollab);
  const saveBudget = useServerFn(setCollabBudget);
  const taxonomy = useTaxonomy().options;
  const [name, setName] = useState(collab.name);
  const [about, setAbout] = useState(collab.bio ?? "");
  const [city, setCity] = useState(collab.city ?? "");
  const [kind, setKind] = useState(collab.project_type ?? "");
  const [startsOn, setStartsOn] = useState(collab.starts_on ?? "");
  const [endsOn, setEndsOn] = useState(collab.ends_on ?? "");
  const [workMode, setWorkMode] = useState(collab.work_mode ?? "");
  const [budget, setBudget] = useState(budgetPaise ? String(budgetPaise / 100) : "");

  // Opening it again starts from what is saved, not from an earlier unsaved draft.
  useEffect(() => {
    if (!open) return;
    setName(collab.name);
    setAbout(collab.bio ?? "");
    setCity(collab.city ?? "");
    setKind(collab.project_type ?? "");
    setStartsOn(collab.starts_on ?? "");
    setEndsOn(collab.ends_on ?? "");
    setWorkMode(collab.work_mode ?? "");
    setBudget(budgetPaise ? String(budgetPaise / 100) : "");
  }, [open, collab, budgetPaise]);

  const isProject = collab.type === "project";
  const datesProblem =
    startsOn && endsOn && endsOn < startsOn ? "The target date comes after the start." : null;
  const nameProblem = name.trim().length < 2 ? "Give it a name of at least 2 letters." : null;

  const commit = useMutation({
    mutationFn: async () => {
      await save({
        data: {
          id: collab.id,
          name: name.trim(),
          bio: about,
          city,
          projectType: kind,
          endsOn,
          ...(isProject ? { startsOn, workMode } : {}),
        },
      });
      const next = budget ? Number(budget) * 100 : null;
      if (isProject && next !== budgetPaise) {
        await saveBudget({ data: { id: collab.id, budgetPaise: next } });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["collab", collab.id] });
      void queryClient.invalidateQueries({ queryKey: ["collab-budget", collab.id] });
      void queryClient.invalidateQueries({ queryKey: ["collabs", "mine"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  return (
    <Sheet open={open} onClose={onClose} title="Edit">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nameProblem && !datesProblem && !commit.isPending) commit.mutate();
        }}
      >
        <Field label="Name" id="edit-collab-name" error={nameProblem}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            aria-labelledby="edit-collab-name"
            className={inputClass}
          />
        </Field>

        {isProject ? (
          <Field label="What kind (optional)" id="edit-collab-kind">
            <SheetSelect
              title="What kind"
              value={kind || null}
              options={types.map((t) => ({ value: t.slug, label: t.label }))}
              onChange={setKind}
              placeholder="Song, EP, film score…"
            />
          </Field>
        ) : null}

        <Field label="What it is" id="edit-collab-about">
          <textarea
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={2000}
            aria-labelledby="edit-collab-about"
            className="w-full resize-none rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
          />
        </Field>

        <CityField id="edit-collab-city" label="Where (optional)" value={city} onChange={setCity} />

        {isProject ? (
          <>
            <Field label="How you'll work (optional)" id="edit-collab-mode">
              <SheetSelect
                title="How you'll work"
                value={workMode || null}
                options={(taxonomy?.work_modes ?? []).map((w) => ({
                  value: w.slug,
                  label: w.label,
                }))}
                onChange={setWorkMode}
                placeholder="Remote, in person…"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Starts (optional)" id="edit-collab-starts">
                <input
                  type="date"
                  value={startsOn}
                  onChange={(e) => setStartsOn(e.target.value)}
                  aria-labelledby="edit-collab-starts"
                  className={inputClass}
                />
              </Field>
              <Field label="Target (optional)" id="edit-collab-ends" error={datesProblem}>
                <input
                  type="date"
                  value={endsOn}
                  min={startsOn || undefined}
                  onChange={(e) => setEndsOn(e.target.value)}
                  aria-labelledby="edit-collab-ends"
                  className={inputClass}
                />
              </Field>
            </div>
            <Field
              label="Budget (optional)"
              id="edit-collab-budget"
              hint="Only the people in the project see this."
            >
              <div className="relative">
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                >
                  ₹
                </span>
                <input
                  value={budget ? Number(budget).toLocaleString("en-IN") : ""}
                  onChange={(e) => setBudget(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                  placeholder="1,80,000"
                  aria-labelledby="edit-collab-budget"
                  className={`${inputClass} pl-9`}
                />
              </div>
            </Field>
          </>
        ) : null}

        <Btn
          type="submit"
          className="w-full"
          disabled={Boolean(nameProblem || datesProblem)}
          loading={commit.isPending}
        >
          Save
        </Btn>
      </form>
    </Sheet>
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
