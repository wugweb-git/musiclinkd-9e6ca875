/**
 * FLOW 06 — Collaboration. Design-time mock data only (no backend).
 * Types mirror the canonical MusicLinkd collaboration schema shape.
 */

export type CollabStatus =
  "draft" | "proposed" | "active" | "onHold" | "completed" | "cancelled" | "archived";

export type CollabType =
  | "Song"
  | "Album"
  | "EP"
  | "Live Performance"
  | "Recording Session"
  | "Production"
  | "Composition"
  | "Songwriting"
  | "Mixing"
  | "Mastering"
  | "Film / Media"
  | "Commercial"
  | "Podcast"
  | "Event"
  | "Band Project"
  | "Session Work";

export const collabTypes: CollabType[] = [
  "Song",
  "Album",
  "EP",
  "Live Performance",
  "Recording Session",
  "Production",
  "Composition",
  "Songwriting",
  "Mixing",
  "Mastering",
  "Film / Media",
  "Commercial",
  "Podcast",
  "Event",
  "Band Project",
  "Session Work",
];

export type CollabRole =
  | "Artist"
  | "Singer"
  | "Composer"
  | "Producer"
  | "Lyricist"
  | "Musician"
  | "Engineer"
  | "DJ"
  | "Studio"
  | "Manager"
  | "Other";

export const collabRoles: CollabRole[] = [
  "Artist",
  "Singer",
  "Composer",
  "Producer",
  "Lyricist",
  "Musician",
  "Engineer",
  "DJ",
  "Studio",
  "Manager",
  "Other",
];

export type Visibility = "private" | "participants" | "public";

export type ParticipantStatus = "owner" | "active" | "invited" | "declined" | "left";

export type Participant = {
  id: string;
  name: string;
  username: string;
  role: CollabRole;
  responsibility: string;
  verified: boolean;
  photo: string;
  status: ParticipantStatus;
  contribution: string;
};

export type CollabFileKind =
  "audio" | "video" | "image" | "document" | "lyrics" | "contract" | "reference";

export type AudioVersion = {
  id: string;
  label: string;
  createdBy: string;
  date: string;
  notes: string;
  duration: string;
};

export type CollabFile = {
  id: string;
  name: string;
  kind: CollabFileKind;
  size: string;
  uploadedBy: string;
  date: string;
  cover?: string;
  duration?: string;
  versions?: AudioVersion[];
  access: "All participants" | "Selected participants";
  available: boolean;
};

export type MilestoneStatus = "todo" | "inProgress" | "done" | "overdue";

export type Milestone = {
  id: string;
  name: string;
  description: string;
  owner: string;
  due: string;
  status: MilestoneStatus;
  notes: string;
};

export type Task = {
  id: string;
  name: string;
  owner: string;
  due: string;
  done: boolean;
};

export type DiscussionEntry = {
  id: string;
  author: string;
  photo: string;
  time: string;
  body: string;
  pinned?: boolean;
  decision?: boolean;
  attachment?: string;
  replies?: { author: string; body: string; time: string }[];
};

export type NoteEntry = {
  id: string;
  title: string;
  body: string;
  updated: string;
  author: string;
  pinned: boolean;
};

export type ActivityEntry = {
  id: string;
  kind: "joined" | "file" | "milestone" | "proposal" | "comment" | "status";
  text: string;
  actor: string;
  time: string;
};

export type Agreement = {
  scope: string;
  deliverables: string[];
  timeline: string;
  compensation: string;
  ownership: string;
  credit: string;
};

export type Project = {
  id: string;
  name: string;
  type: CollabType;
  status: CollabStatus;
  artwork: string;
  description: string;
  myRole: CollabRole;
  owner: string;
  location: string;
  mode: "Remote" | "In person" | "Hybrid";
  timeline: string;
  startDate: string;
  targetDate: string;
  budget?: string;
  visibility: Visibility;
  progress: number;
  lastActivity: string;
  updatedAt: number;
  createdAt: number;
  holdReason?: string;
  completedOn?: string;
  cancelledReason?: string;
  participants: Participant[];
  files: CollabFile[];
  milestones: Milestone[];
  tasks: Task[];
  discussion: DiscussionEntry[];
  notes: NoteEntry[];
  activity: ActivityEntry[];
  agreement?: Agreement;
};

export type Invitation = {
  id: string;
  projectId: string;
  projectName: string;
  type: CollabType;
  artwork: string;
  inviter: string;
  inviterRole: string;
  inviterPhoto: string;
  proposedRole: CollabRole;
  description: string;
  timeline: string;
  budget?: string;
  sentAt: string;
};

export type Proposal = {
  id: string;
  projectId: string;
  projectName: string;
  from: string;
  fromRole: string;
  fromPhoto: string;
  role: CollabRole;
  scope: string;
  deliverables: string[];
  timeline: string;
  compensation: string;
  notes: string;
  status: "sent" | "received" | "accepted" | "declined" | "countered";
  sentAt: string;
};

/* ------------------------------------------------------------------ */
/* Meta                                                                */
/* ------------------------------------------------------------------ */

export const statusMeta: Record<
  CollabStatus,
  { label: string; tone: "ok" | "warn" | "info" | "off" | "bad" }
> = {
  draft: { label: "Draft", tone: "off" },
  proposed: { label: "Proposed", tone: "info" },
  active: { label: "Active", tone: "ok" },
  onHold: { label: "On hold", tone: "warn" },
  completed: { label: "Completed", tone: "info" },
  cancelled: { label: "Cancelled", tone: "bad" },
  archived: { label: "Archived", tone: "off" },
};

export const milestoneMeta: Record<
  MilestoneStatus,
  { label: string; tone: "ok" | "warn" | "info" | "off" | "bad" }
> = {
  todo: { label: "To do", tone: "off" },
  inProgress: { label: "In progress", tone: "info" },
  done: { label: "Done", tone: "ok" },
  overdue: { label: "Overdue", tone: "bad" },
};

export const fileKindMeta: Record<CollabFileKind, { label: string; icon: string }> = {
  audio: { label: "Audio", icon: "♪" },
  video: { label: "Video", icon: "▶" },
  image: { label: "Image", icon: "▣" },
  document: { label: "Document", icon: "▤" },
  lyrics: { label: "Lyrics", icon: "✎" },
  contract: { label: "Contract", icon: "§" },
  reference: { label: "Reference", icon: "↗" },
};

export const sortOptions = [
  "Recently updated",
  "Recently created",
  "Deadline",
  "Status",
  "Alphabetical",
] as const;
export type SortOption = (typeof sortOptions)[number];

const u = (id: string, w = 640) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const p = (id: string) => u(id, 240);

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

export const me = {
  id: "vedanshu",
  name: "Vedanshu Srivastava",
  username: "vedanshu",
  photo: p("photo-1500648767791-00dcc994a43e"),
};

const ananya: Participant = {
  id: "ananya-sharma",
  name: "Ananya Sharma",
  username: "ananya.sharma",
  role: "Singer",
  responsibility: "Lead & harmony vocals",
  verified: true,
  photo: p("photo-1534528741775-53994a69daeb"),
  status: "active",
  contribution: "3 vocal takes uploaded",
};

const rahul: Participant = {
  id: "rahul-iyer",
  name: "Rahul Iyer",
  username: "rahul.iyer",
  role: "Producer",
  responsibility: "Production & mix",
  verified: true,
  photo: p("photo-1507003211169-0a1dd7228f2d"),
  status: "owner",
  contribution: "Arrangement, rough mix v3",
};

const meher: Participant = {
  id: "meher-kaur",
  name: "Meher Kaur",
  username: "meher.kaur",
  role: "Musician",
  responsibility: "Guitars",
  verified: false,
  photo: p("photo-1529626455594-4ff0802cfb7e"),
  status: "invited",
  contribution: "Awaiting response",
};

const kabir: Participant = {
  id: "kabir-nair",
  name: "Kabir Nair",
  username: "kabir.nair",
  role: "Engineer",
  responsibility: "Mix & master",
  verified: true,
  photo: p("photo-1519085360753-af0119f7cbe7"),
  status: "active",
  contribution: "Master v1 delivered",
};

const octave: Participant = {
  id: "octave-sound-labs",
  name: "Octave Sound Labs",
  username: "octave.sound.labs",
  role: "Studio",
  responsibility: "Tracking room & engineer",
  verified: true,
  photo: p("photo-1598488035139-bdbb2231ce04"),
  status: "active",
  contribution: "2 sessions hosted",
};

export const projects: Project[] = [
  {
    id: "raat-ki-rani",
    name: "Raat Ki Rani",
    type: "Song",
    status: "active",
    artwork: u("photo-1470225620780-dba8ba36b745"),
    description:
      "Hindi indie single blending Sufi vocal phrasing with a modern low-end. Target release before the monsoon tour.",
    myRole: "Composer",
    owner: "Rahul Iyer",
    location: "Mumbai",
    mode: "Hybrid",
    timeline: "12 Aug – 30 Sep 2026",
    startDate: "12 Aug 2026",
    targetDate: "30 Sep 2026",
    budget: "₹1,80,000",
    visibility: "participants",
    progress: 62,
    lastActivity: "Rahul uploaded Mix v3 · 2h ago",
    updatedAt: 6,
    createdAt: 3,
    participants: [rahul, ananya, { ...kabir, status: "active" }, meher],
    files: [
      {
        id: "mix-v3",
        name: "Raat Ki Rani — Mix",
        kind: "audio",
        size: "48.2 MB",
        uploadedBy: "Rahul Iyer",
        date: "Today, 11:40",
        cover: u("photo-1470225620780-dba8ba36b745", 400),
        duration: "3:58",
        access: "All participants",
        available: true,
        versions: [
          {
            id: "v3",
            label: "Mix v3",
            createdBy: "Rahul Iyer",
            date: "Today, 11:40",
            notes: "Vocal ride redone, bass -1.5dB, wider chorus.",
            duration: "3:58",
          },
          {
            id: "v2",
            label: "Mix v2",
            createdBy: "Rahul Iyer",
            date: "28 Aug",
            notes: "Added tabla layer in the second verse.",
            duration: "3:56",
          },
          {
            id: "v1",
            label: "Mix v1",
            createdBy: "Rahul Iyer",
            date: "21 Aug",
            notes: "First rough balance from tracking session.",
            duration: "4:02",
          },
        ],
      },
      {
        id: "vox-comp",
        name: "Lead vocal comp — Ananya",
        kind: "audio",
        size: "62.9 MB",
        uploadedBy: "Ananya Sharma",
        date: "27 Aug",
        duration: "4:04",
        access: "All participants",
        available: true,
        versions: [
          {
            id: "final",
            label: "Comp final",
            createdBy: "Ananya Sharma",
            date: "27 Aug",
            notes: "Chosen takes 2, 5 and 7.",
            duration: "4:04",
          },
        ],
      },
      {
        id: "lyrics-sheet",
        name: "Raat Ki Rani — lyric sheet",
        kind: "lyrics",
        size: "42 KB",
        uploadedBy: "Vedanshu Srivastava",
        date: "18 Aug",
        access: "All participants",
        available: true,
      },
      {
        id: "split-sheet",
        name: "Split sheet (draft)",
        kind: "contract",
        size: "180 KB",
        uploadedBy: "Rahul Iyer",
        date: "16 Aug",
        access: "Selected participants",
        available: true,
      },
      {
        id: "ref-board",
        name: "Reference board",
        kind: "image",
        size: "3.1 MB",
        uploadedBy: "Ananya Sharma",
        date: "14 Aug",
        cover: u("photo-1493225457124-a3eb161ffa5f", 400),
        access: "All participants",
        available: true,
      },
      {
        id: "old-stem",
        name: "Stems (expired share)",
        kind: "document",
        size: "—",
        uploadedBy: "Kabir Nair",
        date: "10 Aug",
        access: "Selected participants",
        available: false,
      },
    ],
    milestones: [
      {
        id: "m1",
        name: "Lyrics approved",
        description: "Final lyric locked with all three writers signed off.",
        owner: "Vedanshu Srivastava",
        due: "18 Aug 2026",
        status: "done",
        notes: "Second verse rewritten before approval.",
      },
      {
        id: "m2",
        name: "Recording complete",
        description: "Lead vocals, guitars and percussion tracked at Octave.",
        owner: "Ananya Sharma",
        due: "27 Aug 2026",
        status: "done",
        notes: "Guitar overdubs pending Meher joining.",
      },
      {
        id: "m3",
        name: "Mix delivered",
        description: "Final mix approved by all participants.",
        owner: "Rahul Iyer",
        due: "12 Sep 2026",
        status: "inProgress",
        notes: "v3 out for feedback.",
      },
      {
        id: "m4",
        name: "Master approved",
        description: "Master delivered in streaming and DDP formats.",
        owner: "Kabir Nair",
        due: "24 Sep 2026",
        status: "todo",
        notes: "Blocked on mix sign-off.",
      },
    ],
    tasks: [
      { id: "t1", name: "Send Mix v3 notes", owner: "Ananya Sharma", due: "2 Sep", done: false },
      {
        id: "t2",
        name: "Book guitar overdub slot",
        owner: "Vedanshu Srivastava",
        due: "4 Sep",
        done: false,
      },
      { id: "t3", name: "Upload artwork draft", owner: "Rahul Iyer", due: "29 Aug", done: true },
    ],
    discussion: [
      {
        id: "d1",
        author: "Rahul Iyer",
        photo: rahul.photo,
        time: "2h ago",
        body: "Mix v3 is up. Rode the lead vocal manually through the chorus — tell me if it sits right now.",
        attachment: "Mix v3 · 3:58",
        replies: [
          {
            author: "Ananya Sharma",
            body: "Way better. Second chorus still a touch shy.",
            time: "1h ago",
          },
        ],
      },
      {
        id: "d2",
        author: "Ananya Sharma",
        photo: ananya.photo,
        time: "Yesterday",
        body: "Decision: we keep the tabla layer but drop it out of the first verse entirely.",
        decision: true,
        pinned: true,
      },
      {
        id: "d3",
        author: "Vedanshu Srivastava",
        photo: me.photo,
        time: "28 Aug",
        body: "@Kabir Nair can you hold a master slot for the week of the 22nd?",
      },
    ],
    notes: [
      {
        id: "n1",
        title: "Credits & splits",
        body: "Composition 40 / 30 / 30 — Vedanshu, Rahul, Ananya. Lyrics credited to Vedanshu alone.",
        updated: "26 Aug",
        author: "Rahul Iyer",
        pinned: true,
      },
      {
        id: "n2",
        title: "Release references",
        body: "Loudness target -9 LUFS. Reference tracks shared in the media tab.",
        updated: "22 Aug",
        author: "Kabir Nair",
        pinned: false,
      },
    ],
    activity: [
      { id: "a1", kind: "file", text: "uploaded Mix v3", actor: "Rahul Iyer", time: "2h ago" },
      {
        id: "a2",
        kind: "comment",
        text: "commented on Mix v3",
        actor: "Ananya Sharma",
        time: "1h ago",
      },
      {
        id: "a3",
        kind: "milestone",
        text: "completed Recording complete",
        actor: "Ananya Sharma",
        time: "27 Aug",
      },
      { id: "a4", kind: "joined", text: "joined as Engineer", actor: "Kabir Nair", time: "20 Aug" },
      {
        id: "a5",
        kind: "status",
        text: "moved the project to Active",
        actor: "Rahul Iyer",
        time: "14 Aug",
      },
      {
        id: "a6",
        kind: "proposal",
        text: "accepted the collaboration proposal",
        actor: "Ananya Sharma",
        time: "13 Aug",
      },
    ],
    agreement: {
      scope: "One original Hindi single: composition, vocal recording, production, mix and master.",
      deliverables: [
        "Approved lyric sheet",
        "Final mix (WAV 24/48)",
        "Master for streaming + DDP",
        "Stems",
      ],
      timeline: "12 Aug – 30 Sep 2026",
      compensation: "₹1,80,000 total, split 40/30/30 on delivery milestones.",
      ownership:
        "Master owned jointly by the three writers; label licence to be negotiated separately.",
      credit: "Composed by Vedanshu Srivastava · Produced by Rahul Iyer · Vocals by Ananya Sharma",
    },
  },
  {
    id: "monsoon-sessions",
    name: "Monsoon Sessions — Live EP",
    type: "EP",
    status: "active",
    artwork: u("photo-1501386761578-eac5c94b800a"),
    description:
      "Four-track live EP recorded across two nights at Octave Sound Labs with a seven-piece band.",
    myRole: "Producer",
    owner: "Vedanshu Srivastava",
    location: "Mumbai",
    mode: "In person",
    timeline: "1 Sep – 15 Nov 2026",
    startDate: "1 Sep 2026",
    targetDate: "15 Nov 2026",
    budget: "₹4,20,000",
    visibility: "participants",
    progress: 24,
    lastActivity: "Octave confirmed the tracking dates · yesterday",
    updatedAt: 5,
    createdAt: 5,
    participants: [
      { ...rahul, status: "active", role: "Engineer", responsibility: "Front of house capture" },
      octave,
      { ...ananya, status: "invited", contribution: "Invitation sent 30 Aug" },
    ],
    files: [
      {
        id: "runsheet",
        name: "Night 1 run sheet",
        kind: "document",
        size: "96 KB",
        uploadedBy: "Vedanshu Srivastava",
        date: "30 Aug",
        access: "All participants",
        available: true,
      },
      {
        id: "stage-plot",
        name: "Stage plot",
        kind: "image",
        size: "1.4 MB",
        uploadedBy: "Octave Sound Labs",
        date: "29 Aug",
        cover: u("photo-1511671782779-c97d3d27a1d4", 400),
        access: "All participants",
        available: true,
      },
    ],
    milestones: [
      {
        id: "m1",
        name: "Band confirmed",
        description: "All seven players locked with fees agreed.",
        owner: "Vedanshu Srivastava",
        due: "10 Sep 2026",
        status: "inProgress",
        notes: "Five of seven confirmed.",
      },
      {
        id: "m2",
        name: "Live tracking",
        description: "Two nights recorded and backed up.",
        owner: "Octave Sound Labs",
        due: "8 Oct 2026",
        status: "todo",
        notes: "",
      },
      {
        id: "m3",
        name: "EP delivered",
        description: "Four mixed and mastered tracks.",
        owner: "Rahul Iyer",
        due: "15 Nov 2026",
        status: "todo",
        notes: "",
      },
    ],
    tasks: [
      {
        id: "t1",
        name: "Confirm horn section fees",
        owner: "Vedanshu Srivastava",
        due: "6 Sep",
        done: false,
      },
    ],
    discussion: [
      {
        id: "d1",
        author: "Octave Sound Labs",
        photo: octave.photo,
        time: "Yesterday",
        body: "Both nights are held for you — 7 and 8 October, load-in from 4pm.",
        pinned: true,
      },
    ],
    notes: [
      {
        id: "n1",
        title: "Capture spec",
        body: "32 channels, 24/96, redundant recorder on the second night.",
        updated: "29 Aug",
        author: "Rahul Iyer",
        pinned: true,
      },
    ],
    activity: [
      {
        id: "a1",
        kind: "status",
        text: "confirmed tracking dates",
        actor: "Octave Sound Labs",
        time: "Yesterday",
      },
      {
        id: "a2",
        kind: "joined",
        text: "joined as Studio",
        actor: "Octave Sound Labs",
        time: "28 Aug",
      },
    ],
  },
  {
    id: "aftertaste-score",
    name: "Aftertaste — Original Score",
    type: "Film / Media",
    status: "onHold",
    artwork: u("photo-1489599849927-2ee91cede3ba"),
    description:
      "38 minutes of original score for an independent feature. Paused while the edit is re-locked.",
    myRole: "Composer",
    owner: "Vedanshu Srivastava",
    location: "Remote",
    mode: "Remote",
    timeline: "5 Jul – TBD",
    startDate: "5 Jul 2026",
    targetDate: "TBD",
    budget: "₹6,50,000",
    visibility: "private",
    progress: 41,
    lastActivity: "Paused by the production house · 12 Aug",
    updatedAt: 2,
    createdAt: 1,
    holdReason: "Picture lock delayed — the director is re-cutting the second act.",
    participants: [
      { ...kabir, status: "active", role: "Engineer", responsibility: "Stem prep & delivery" },
      {
        id: "sanya-rao",
        name: "Sanya Rao",
        username: "sanya.rao",
        role: "Manager",
        responsibility: "Production liaison",
        verified: true,
        photo: p("photo-1487412720507-e7ab37603c6f"),
        status: "active",
        contribution: "Handles all delivery dates",
      },
    ],
    files: [
      {
        id: "cue-sheet",
        name: "Cue sheet v4",
        kind: "document",
        size: "220 KB",
        uploadedBy: "Sanya Rao",
        date: "10 Aug",
        access: "Selected participants",
        available: true,
      },
    ],
    milestones: [
      {
        id: "m1",
        name: "Theme approved",
        description: "Main title theme signed off by the director.",
        owner: "Vedanshu Srivastava",
        due: "22 Jul 2026",
        status: "done",
        notes: "",
      },
      {
        id: "m2",
        name: "Act two cues",
        description: "Nine cues written to the new edit.",
        owner: "Vedanshu Srivastava",
        due: "30 Aug 2026",
        status: "overdue",
        notes: "Blocked by the picture lock delay.",
      },
    ],
    tasks: [],
    discussion: [
      {
        id: "d1",
        author: "Sanya Rao",
        photo: p("photo-1487412720507-e7ab37603c6f"),
        time: "12 Aug",
        body: "Putting us on hold for now — I'll confirm new dates once the edit is locked.",
        decision: true,
        pinned: true,
      },
    ],
    notes: [],
    activity: [
      {
        id: "a1",
        kind: "status",
        text: "put the project on hold",
        actor: "Sanya Rao",
        time: "12 Aug",
      },
    ],
  },
  {
    id: "sunday-drive",
    name: "Sunday Drive (single)",
    type: "Song",
    status: "completed",
    artwork: u("photo-1459749411175-04bf5292ceea"),
    description: "Feel-good bilingual single released in June. All deliverables signed off.",
    myRole: "Lyricist",
    owner: "Ananya Sharma",
    location: "Bengaluru",
    mode: "Hybrid",
    timeline: "3 Mar – 12 Jun 2026",
    startDate: "3 Mar 2026",
    targetDate: "12 Jun 2026",
    budget: "₹95,000",
    visibility: "public",
    progress: 100,
    lastActivity: "Marked complete · 12 Jun",
    updatedAt: 1,
    createdAt: 0,
    completedOn: "12 Jun 2026",
    participants: [
      { ...ananya, status: "owner", contribution: "Vocals, topline" },
      { ...rahul, status: "active", contribution: "Production, mix" },
    ],
    files: [
      {
        id: "final-master",
        name: "Sunday Drive — Master",
        kind: "audio",
        size: "51 MB",
        uploadedBy: "Rahul Iyer",
        date: "10 Jun",
        cover: u("photo-1459749411175-04bf5292ceea", 400),
        duration: "3:22",
        access: "All participants",
        available: true,
        versions: [
          {
            id: "final",
            label: "Master final",
            createdBy: "Rahul Iyer",
            date: "10 Jun",
            notes: "Delivered to distribution.",
            duration: "3:22",
          },
        ],
      },
    ],
    milestones: [
      {
        id: "m1",
        name: "Master approved",
        description: "Final master approved and delivered.",
        owner: "Rahul Iyer",
        due: "10 Jun 2026",
        status: "done",
        notes: "",
      },
    ],
    tasks: [],
    discussion: [],
    notes: [],
    activity: [
      {
        id: "a1",
        kind: "status",
        text: "marked the project complete",
        actor: "Ananya Sharma",
        time: "12 Jun",
      },
    ],
  },
  {
    id: "untitled-collab",
    name: "Untitled collaboration",
    type: "Composition",
    status: "draft",
    artwork: u("photo-1507838153414-b4b713384a76"),
    description: "",
    myRole: "Composer",
    owner: "Vedanshu Srivastava",
    location: "",
    mode: "Remote",
    timeline: "Not set",
    startDate: "",
    targetDate: "",
    visibility: "private",
    progress: 8,
    lastActivity: "Draft saved · 3 days ago",
    updatedAt: 3,
    createdAt: 4,
    participants: [],
    files: [],
    milestones: [],
    tasks: [],
    discussion: [],
    notes: [],
    activity: [],
  },
  {
    id: "neon-bazaar",
    name: "Neon Bazaar — brand film",
    type: "Commercial",
    status: "cancelled",
    artwork: u("photo-1514320291840-2e0a9bf2a9ae"),
    description: "45-second brand film score. Cancelled when the campaign was pulled.",
    myRole: "Composer",
    owner: "Vedanshu Srivastava",
    location: "Remote",
    mode: "Remote",
    timeline: "2 Feb – 20 Feb 2026",
    startDate: "2 Feb 2026",
    targetDate: "20 Feb 2026",
    visibility: "private",
    progress: 30,
    lastActivity: "Cancelled · 18 Feb",
    updatedAt: 0,
    createdAt: 0,
    cancelledReason: "Client pulled the campaign before the first cut.",
    participants: [{ ...kabir, status: "left", contribution: "No deliverables" }],
    files: [],
    milestones: [],
    tasks: [],
    discussion: [],
    notes: [],
    activity: [
      {
        id: "a1",
        kind: "status",
        text: "cancelled the project",
        actor: "Vedanshu Srivastava",
        time: "18 Feb",
      },
    ],
  },
  {
    id: "chai-tapes",
    name: "Chai Tapes vol. 1",
    type: "Album",
    status: "archived",
    artwork: u("photo-1483412033650-1015ddeb83d1"),
    description: "Lo-fi compilation from 2025, archived after release.",
    myRole: "Producer",
    owner: "Vedanshu Srivastava",
    location: "Mumbai",
    mode: "Hybrid",
    timeline: "2025",
    startDate: "4 Apr 2025",
    targetDate: "19 Dec 2025",
    visibility: "participants",
    progress: 100,
    lastActivity: "Archived · Jan 2026",
    updatedAt: 0,
    createdAt: 0,
    completedOn: "19 Dec 2025",
    participants: [{ ...meher, status: "active", contribution: "Guitars on 4 tracks" }],
    files: [],
    milestones: [],
    tasks: [],
    discussion: [],
    notes: [],
    activity: [],
  },
];

export const invitations: Invitation[] = [
  {
    id: "inv-kalank",
    projectId: "kalank-remix",
    projectName: "Kalank — club remix",
    type: "Production",
    artwork: u("photo-1516280440614-37939bbacd81"),
    inviter: "Rahul Iyer",
    inviterRole: "Music Producer · Mumbai",
    inviterPhoto: rahul.photo,
    proposedRole: "Composer",
    description:
      "Reworking a film cut into a 124bpm club edit for a label compilation. Looking for a new chord bed and a bridge idea.",
    timeline: "8 Sep – 10 Oct 2026",
    budget: "₹75,000",
    sentAt: "2 days ago",
  },
  {
    id: "inv-podcast",
    projectId: "sound-of-city",
    projectName: "Sound of the City — podcast theme",
    type: "Podcast",
    artwork: u("photo-1478737270239-2f02b77fc618"),
    inviter: "Sanya Rao",
    inviterRole: "Producer · Independent",
    inviterPhoto: p("photo-1487412720507-e7ab37603c6f"),
    proposedRole: "Composer",
    description:
      "A 25-second theme plus three stingers for a documentary podcast about Mumbai's live circuit.",
    timeline: "15 Sep – 30 Sep 2026",
    sentAt: "5 days ago",
  },
];

export const proposals: Proposal[] = [
  {
    id: "prop-mix",
    projectId: "raat-ki-rani",
    projectName: "Raat Ki Rani",
    from: "Kabir Nair",
    fromRole: "Mix & Mastering Engineer",
    fromPhoto: kabir.photo,
    role: "Engineer",
    scope: "Mix and master the finished single, including two rounds of revisions.",
    deliverables: [
      "Final mix (WAV 24/48)",
      "Streaming master",
      "DDP for CD",
      "Instrumental + TV mix",
    ],
    timeline: "12 Sep – 24 Sep 2026",
    compensation: "₹55,000 on delivery",
    notes: "Happy to hold the week of the 22nd if you confirm by the 5th.",
    status: "received",
    sentAt: "Yesterday",
  },
  {
    id: "prop-vocal",
    projectId: "monsoon-sessions",
    projectName: "Monsoon Sessions — Live EP",
    from: "Vedanshu Srivastava",
    fromRole: "Composer · Producer",
    fromPhoto: me.photo,
    role: "Singer",
    scope: "Guest vocals on two of the four live tracks, plus one soundcheck rehearsal.",
    deliverables: ["Two live vocal performances", "One rehearsal", "Promo credit"],
    timeline: "7 – 8 Oct 2026",
    compensation: "₹40,000 per night",
    notes: "Travel and stay covered by production.",
    status: "sent",
    sentAt: "30 Aug",
  },
];

/* ------------------------------------------------------------------ */
/* People search (Add collaborators)                                   */
/* ------------------------------------------------------------------ */

export type Candidate = {
  id: string;
  name: string;
  username: string;
  role: string;
  instrument: string;
  location: string;
  verified: boolean;
  business: boolean;
  photo: string;
};

export const candidates: Candidate[] = [
  {
    id: "ananya-sharma",
    name: "Ananya Sharma",
    username: "@ananya",
    role: "Playback Vocalist",
    instrument: "Voice",
    location: "Mumbai",
    verified: true,
    business: false,
    photo: ananya.photo,
  },
  {
    id: "rahul-iyer",
    name: "Rahul Iyer",
    username: "@rahuliyer",
    role: "Producer · Mix Engineer",
    instrument: "Keys",
    location: "Bengaluru",
    verified: true,
    business: false,
    photo: rahul.photo,
  },
  {
    id: "meher-kaur",
    name: "Meher Kaur",
    username: "@meherk",
    role: "Session Guitarist",
    instrument: "Guitar",
    location: "New Delhi",
    verified: false,
    business: false,
    photo: meher.photo,
  },
  {
    id: "kabir-nair",
    name: "Kabir Nair",
    username: "@kabirnair",
    role: "Mastering Engineer",
    instrument: "Console",
    location: "Kochi",
    verified: true,
    business: false,
    photo: kabir.photo,
  },
  {
    id: "octave-sound-labs",
    name: "Octave Sound Labs",
    username: "@octave",
    role: "Recording Studio",
    instrument: "Studio",
    location: "Mumbai",
    verified: true,
    business: true,
    photo: octave.photo,
  },
  {
    id: "sanya-rao",
    name: "Sanya Rao",
    username: "@sanyarao",
    role: "Artist Manager",
    instrument: "—",
    location: "Mumbai",
    verified: true,
    business: false,
    photo: p("photo-1487412720507-e7ab37603c6f"),
  },
  {
    id: "tabla-collective",
    name: "The Tabla Collective",
    username: "@tablacollective",
    role: "Percussion Ensemble",
    instrument: "Tabla",
    location: "Pune",
    verified: false,
    business: true,
    photo: p("photo-1516280440614-37939bbacd81"),
  },
];

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

export function getProject(id: string): Project | undefined {
  return projects.find((x) => x.id === id);
}

export function getInvitation(id: string): Invitation | undefined {
  return invitations.find((x) => x.id === id);
}

export function getProposal(id: string): Proposal | undefined {
  return proposals.find((x) => x.id === id);
}

export function getFile(projectId: string, fileId: string): CollabFile | undefined {
  return getProject(projectId)?.files.find((f) => f.id === fileId);
}

export const tabFilter: Record<string, CollabStatus[]> = {
  active: ["active", "onHold"],
  pending: ["proposed"],
  completed: ["completed", "archived"],
  drafts: ["draft"],
};

export function sortProjects(list: Project[], sort: SortOption): Project[] {
  const copy = [...list];
  switch (sort) {
    case "Recently created":
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case "Deadline":
      return copy.sort((a, b) => a.targetDate.localeCompare(b.targetDate));
    case "Status":
      return copy.sort((a, b) => a.status.localeCompare(b.status));
    case "Alphabetical":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return copy.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
