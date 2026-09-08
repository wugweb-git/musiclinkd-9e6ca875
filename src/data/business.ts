/**
 * FLOW 12 — BUSINESS PROFILES (design-only mock data).
 * Canonical names: business_profile, business_type, business_member, business_space.
 * A business is a separate entity owned by a person profile — never a duplicate person.
 */

export type BusinessType = "studio" | "label" | "production_house" | "venue" | "agency" | "rental";
export type BusinessRole = "owner" | "manager" | "engineer" | "staff";
export type MemberStatus = "active" | "invited" | "removed";

export const businessTypes: { key: BusinessType; label: string; emoji: string; blurb: string }[] = [
  { key: "studio", label: "Recording studio", emoji: "🎛️", blurb: "Rooms, engineers and hourly bookings." },
  { key: "label", label: "Label", emoji: "💿", blurb: "Releases, roster and A&R calls." },
  { key: "production_house", label: "Production house", emoji: "🎬", blurb: "Film, ad and content music teams." },
  { key: "venue", label: "Venue", emoji: "🎪", blurb: "Live rooms, capacity and event calendar." },
  { key: "agency", label: "Artist agency", emoji: "🤝", blurb: "Represent and book artists." },
  { key: "rental", label: "Rental house", emoji: "📦", blurb: "Backline and gear on rent." },
];

export const businessTypeLabel = (k: BusinessType) =>
  businessTypes.find((b) => b.key === k)?.label ?? "Business";

export type BusinessMember = {
  id: string;
  name: string;
  photo: string;
  role: BusinessRole;
  status: MemberStatus;
  since: string;
};

export type BusinessSpace = {
  id: string;
  name: string;
  kind: string;
  rate: string;
  capacity: string;
  gear: string[];
  photo: string;
};

export type BusinessProfile = {
  id: string;
  handle: string;
  name: string;
  type: BusinessType;
  verified: boolean;
  tagline: string;
  about: string;
  city: string;
  address: string;
  founded: string;
  logo: string;
  cover: string;
  gallery: string[];
  hours: { day: string; hours: string }[];
  services: { id: string; label: string; price: string }[];
  spaces: BusinessSpace[];
  members: BusinessMember[];
  credits: { title: string; meta: string }[];
  stats: { followers: string; bookings: number; rating: number; reviews: number };
  contact: { phone: string; email: string; website: string };
  ownerUsername: string;
};

const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const myBusinesses: BusinessProfile[] = [
  {
    id: "biz-1",
    handle: "soundhouse-bandra",
    name: "Soundhouse Bandra",
    type: "studio",
    verified: true,
    tagline: "Two rooms, one tape machine, no clock-watching.",
    about:
      "A Bandra-based recording studio built for bands and singer-songwriters. Live room fits an eight-piece, control room runs a hybrid analogue chain, and the house engineers know how to keep a take alive.",
    city: "Mumbai",
    address: "Off Carter Road, Bandra West, Mumbai 400050",
    founded: "2016",
    logo: img("photo-1598488035139-bdbb2231ce04", 200),
    cover: img("photo-1519508234439-4f23643125c1"),
    gallery: [
      img("photo-1519508234439-4f23643125c1", 400),
      img("photo-1590602847861-f357a9332bbc", 400),
      img("photo-1520523839897-bd0b52f945a0", 400),
    ],
    hours: [
      { day: "Mon–Fri", hours: "10:00 – 22:00" },
      { day: "Saturday", hours: "11:00 – 23:00" },
      { day: "Sunday", hours: "Closed" },
    ],
    services: [
      { id: "bsv-1", label: "Studio A — tracking", price: "₹2,500 per hour" },
      { id: "bsv-2", label: "Studio B — overdubs & vocals", price: "₹1,400 per hour" },
      { id: "bsv-3", label: "Mixing with house engineer", price: "₹14,000 per song" },
    ],
    spaces: [
      {
        id: "sp-1",
        name: "Studio A",
        kind: "Live room + control room",
        rate: "₹2,500 / hour",
        capacity: "8 musicians",
        gear: ["SSL console", "Neumann U87", "Yamaha C3 grand", "Vintage Ludwig kit"],
        photo: img("photo-1519508234439-4f23643125c1", 500),
      },
      {
        id: "sp-2",
        name: "Studio B",
        kind: "Vocal booth",
        rate: "₹1,400 / hour",
        capacity: "2 musicians",
        gear: ["Warm Audio WA-47", "UA Apollo x8", "Barefoot monitors"],
        photo: img("photo-1590602847861-f357a9332bbc", 500),
      },
    ],
    members: [
      { id: "bm-1", name: "Ananya Rao", photo: img("photo-1494790108377-be9c29b29330", 120), role: "owner", status: "active", since: "2016" },
      { id: "bm-2", name: "Kabir Menon", photo: img("photo-1500648767791-00dcc994a43e", 120), role: "engineer", status: "active", since: "2019" },
      { id: "bm-3", name: "Farah Sheikh", photo: img("photo-1534528741775-53994a69daeb", 120), role: "manager", status: "invited", since: "2026" },
    ],
    credits: [
      { title: "Neon Monsoon — LP", meta: "Tracked & mixed · 2025" },
      { title: "Aftertaste — single", meta: "Tracked · 2025" },
      { title: "Kolaba Sessions — live EP", meta: "Recorded live · 2024" },
    ],
    stats: { followers: "4.2k", bookings: 318, rating: 4.9, reviews: 64 },
    contact: { phone: "+91 98••• ••210", email: "book@soundhouse.in", website: "soundhouse.in" },
    ownerUsername: "ananya",
  },
];

export const getBusiness = (id: string) => myBusinesses.find((b) => b.id === id);

export const businessRoleLabel: Record<BusinessRole, string> = {
  owner: "Owner",
  manager: "Manager",
  engineer: "Engineer",
  staff: "Staff",
};

export const rolePermissions: { role: BusinessRole; can: string[] }[] = [
  { role: "owner", can: ["Everything, including deleting the business"] },
  { role: "manager", can: ["Edit the profile", "Accept bookings", "Invite staff"] },
  { role: "engineer", can: ["View bookings assigned to them", "Update session notes"] },
  { role: "staff", can: ["View the calendar"] },
];

export const businessDraftKey = "ml.business.draft";

export const businessSteps = ["Type", "Basics", "Location", "Spaces", "Team", "Review"] as const;
export type BusinessStep = (typeof businessSteps)[number];

/** Leads inbox — enquiries that arrived on the business page. */
export type BusinessLead = {
  id: string;
  name: string;
  photo: string;
  intent: string;
  message: string;
  at: string;
  status: "new" | "replied" | "booked" | "closed";
};

export const businessLeads: BusinessLead[] = [
  {
    id: "ld-1",
    name: "Meher Kapoor",
    photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80",
    intent: "Studio A · 6 hours",
    message: "Tracking a four-piece on the 18th, need a drum room and a house engineer.",
    at: "2 hours ago",
    status: "new",
  },
  {
    id: "ld-2",
    name: "Vikram Nair",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    intent: "Mixing · 3 songs",
    message: "Have stems ready from a home session. What's your turnaround in September?",
    at: "Yesterday",
    status: "replied",
  },
  {
    id: "ld-3",
    name: "Sana Qureshi",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    intent: "Studio B · vocals",
    message: "Two vocal days, flexible on dates. Do you have a Sunday slot?",
    at: "3 days ago",
    status: "booked",
  },
];

export const leadStatusTone: Record<BusinessLead["status"], "brand" | "warn" | "good" | "neutral"> = {
  new: "brand",
  replied: "warn",
  booked: "good",
  closed: "neutral",
};

export const businessAnalytics = {
  views: 2840,
  saves: 194,
  enquiries: 38,
  bookings: 21,
  responseRate: "94%",
  responseTime: "under 2 hours",
  viewToEnquiry: "1.3%",
  daily: [42, 58, 61, 39, 77, 88, 64],
  sources: [
    { label: "Discover", value: 46 },
    { label: "Search", value: 28 },
    { label: "Shared links", value: 16 },
    { label: "QR scans", value: 10 },
  ],
  topSpaces: [
    { label: "Studio A", value: 62 },
    { label: "Studio B", value: 38 },
  ],
};

export const businessReviews = [
  {
    id: "brv-1",
    author: "Neon Monsoon",
    photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=120&q=80",
    rating: 5,
    at: "2 weeks ago",
    body: "Booked five nights for the LP. The live room is genuinely quiet and Kabir kept the takes moving.",
    response: null as null | string,
  },
  {
    id: "brv-2",
    author: "Sana Qureshi",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    rating: 4,
    at: "1 month ago",
    body: "Great vocal chain. Parking is a nightmare on weekends — worth warning people.",
    response: "Fair point, we now hold two spots for evening sessions.",
  },
];

export const relatedBusinesses = [
  { id: "biz-2", name: "Island City Sound", type: "studio" as BusinessType, city: "Mumbai", note: "Similar rooms, Lower Parel" },
  { id: "biz-3", name: "Backline Bombay", type: "rental" as BusinessType, city: "Mumbai", note: "Backline rental nearby" },
  { id: "biz-4", name: "Antisocial", type: "venue" as BusinessType, city: "Mumbai", note: "Live room, 300 capacity" },
];

export const businessVerificationChecks = [
  { key: "registration", label: "Business registration", detail: "GST or shop licence in the business name", done: true },
  { key: "address", label: "Address proof", detail: "Utility bill or rent agreement", done: true },
  { key: "owner", label: "Owner identity", detail: "Government ID of the account owner", done: false },
  { key: "photos", label: "Premises photos", detail: "At least three photos of the actual space", done: false },
];
