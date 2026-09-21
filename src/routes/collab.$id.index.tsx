import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  MoreHorizontal,
  Pencil,
  SendHorizontal,
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
  getCollab,
  listCollabMessages,
  listProjectTypes,
  leaveCollab,
  removeMember,
  sendCollabMessage,
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
import { SheetSelect } from "@/components/ml/listing-form";
import { CoverHero, ImagePickButton } from "@/components/ml/profile";
import { uploadProfileImage, type ProfileImageKind } from "@/lib/profile-images";
import { iconSize } from "@/lib/tokens";
import { joinParts } from "@/lib/utils";

/*
 * One collab: what it is, who is in it, and where to talk (its own thread, collab_messages). A band shows the same room; only its
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
    mutationFn: (who: string) => add({ data: { id, username: who } }),
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
          canManage ? (
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
          ) : undefined
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
        {invited ? (
          <section className="space-y-3 rounded-lg bg-subtle p-4">
            <p className="text-sm">
              {joinParts(
                myMembership?.role === "admin"
                  ? "You were asked in as an admin"
                  : "You were asked to join",
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
        </section>

        {myMembership?.status === "active" ? (
          <section className="space-y-2">
            <h2 className="text-sm">Talk</h2>
            <CollabThread id={id} />
          </section>
        ) : null}

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
  onClose,
}: {
  open: boolean;
  collab: Collab;
  types: { slug: string; label: string }[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(updateCollab);
  const [name, setName] = useState(collab.name);
  const [about, setAbout] = useState(collab.bio ?? "");
  const [city, setCity] = useState(collab.city ?? "");
  const [kind, setKind] = useState(collab.project_type ?? "");
  const [endsOn, setEndsOn] = useState(collab.ends_on ?? "");

  // Opening it again starts from what is saved, not from an earlier unsaved draft.
  useEffect(() => {
    if (!open) return;
    setName(collab.name);
    setAbout(collab.bio ?? "");
    setCity(collab.city ?? "");
    setKind(collab.project_type ?? "");
    setEndsOn(collab.ends_on ?? "");
  }, [open, collab]);

  const commit = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: collab.id,
          name: name.trim(),
          bio: about,
          city,
          projectType: kind,
          endsOn,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["collab", collab.id] });
      void queryClient.invalidateQueries({ queryKey: ["collabs", "mine"] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  const field =
    "mt-1.5 min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none";
  return (
    <Sheet open={open} onClose={onClose} title="Edit">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim().length >= 2 && !commit.isPending) commit.mutate();
        }}
      >
        <div>
          <label htmlFor="edit-collab-name" className="block text-1 font-semibold">
            Name
          </label>
          <input
            id="edit-collab-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className={field}
          />
        </div>

        {collab.type === "project" ? (
          <div>
            <p className="text-1 font-semibold">
              What kind <span className="font-normal text-muted-foreground">· optional</span>
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {types.map((t) => (
                <Chip
                  key={t.slug}
                  active={kind === t.slug}
                  onClick={() => setKind(kind === t.slug ? "" : t.slug)}
                >
                  {t.label}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <label htmlFor="edit-collab-about" className="block text-1 font-semibold">
            What it is
          </label>
          <textarea
            id="edit-collab-about"
            rows={3}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            maxLength={2000}
            className="mt-1.5 w-full resize-none rounded-lg border border-border bg-card p-4 text-sm outline-none"
          />
        </div>

        <div>
          <label htmlFor="edit-collab-city" className="block text-1 font-semibold">
            Where <span className="font-normal text-muted-foreground">· optional</span>
          </label>
          <input
            id="edit-collab-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            maxLength={80}
            className={field}
          />
        </div>

        {collab.type === "project" ? (
          <div>
            <label htmlFor="edit-collab-ends" className="block text-1 font-semibold">
              Wraps up <span className="font-normal text-muted-foreground">· optional</span>
            </label>
            <input
              id="edit-collab-ends"
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              className={field}
            />
          </div>
        ) : null}

        <Btn
          type="submit"
          className="w-full"
          disabled={name.trim().length < 2}
          loading={commit.isPending}
        >
          Save
        </Btn>
      </form>
    </Sheet>
  );
}

/** The room's own thread: what the people in it said, and a line to add to it. */
function CollabThread({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const read = useServerFn(listCollabMessages);
  const send = useServerFn(sendCollabMessage);
  const [draft, setDraft] = useState("");
  const end = useRef<HTMLDivElement>(null);

  const thread = useQuery({
    queryKey: ["collab-messages", id],
    queryFn: () => read({ data: { id } }),
    refetchInterval: 15_000,
  });
  const messages = thread.data?.messages ?? [];

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const post = useMutation({
    mutationFn: (body: string) => send({ data: { id, body } }),
    onSuccess: () => {
      setDraft("");
      void queryClient.invalidateQueries({ queryKey: ["collab-messages", id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't send. Try again."),
  });

  if (thread.isLoading) return <Loading rows={2} />;
  if (thread.data && !thread.data.ready) {
    return (
      <p className="rounded-lg bg-subtle p-4 text-1 text-muted-foreground">
        This thread is not open yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <p className="rounded-lg bg-subtle p-4 text-1 text-muted-foreground">
          Nothing said here yet. Everyone in the project sees what you write.
        </p>
      ) : (
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-lg bg-subtle p-4 no-scrollbar">
          {messages.map((m) => (
            <div key={m.id} className={m.mine ? "flex justify-end" : "flex justify-start"}>
              <div className="max-w-[80%]">
                {m.mine ? null : (
                  <p className="mb-1 px-1 text-1 text-muted-foreground">
                    {m.sender?.display_name ?? m.sender?.username ?? "Someone"}
                  </p>
                )}
                <p
                  className={`whitespace-pre-wrap rounded-3xl px-4 py-2.5 text-sm ${
                    m.mine ? "bg-ink text-background" : "bg-background text-foreground"
                  }`}
                >
                  {m.body}
                </p>
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const body = draft.trim();
          if (body && !post.isPending) post.mutate(body);
        }}
      >
        <label htmlFor="collab-message" className="sr-only">
          Message
        </label>
        <textarea
          id="collab-message"
          rows={1}
          value={draft}
          maxLength={4000}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write to everyone in it"
          className="min-h-control w-full resize-none rounded-3xl border border-border bg-card px-4 py-3 text-sm outline-none"
        />
        {/* A plain button, because this one submits the form. */}
        <button
          type="submit"
          aria-label="Send"
          disabled={post.isPending || !draft.trim()}
          className="state-layer flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-background transition-transform duration-200 ease-standard active:scale-97 disabled:opacity-50"
        >
          <SendHorizontal size={iconSize.md} aria-hidden />
        </button>
      </form>
    </div>
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
