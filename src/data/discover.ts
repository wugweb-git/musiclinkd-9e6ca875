import type { PriceParts } from "@/lib/price";

export type Talent = {
  id: string;
  name: string;
  role: string;
  location: string;
  genres: string[];
  languages: string[];
  verified: boolean;
  availability: "Available" | "Booked" | "Selective";
  followers: string;
  rating: number;
  credits: number;
  photo: string;
  rate: PriceParts;
};

/** Status-pill tone for a talent's availability. */
export function availabilityTone(a: Talent["availability"]): "good" | "warn" | "neutral" {
  if (a === "Available") return "good";
  if (a === "Selective") return "warn";
  return "neutral";
}

const u = (id: string, w = 400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const talents: Talent[] = [
  {
    id: "ananya-sharma",
    name: "Ananya Sharma",
    role: "Playback Vocalist",
    location: "Andheri West, Mumbai",
    genres: ["Hindi Film", "Pop Vocals", "Sufi"],
    languages: ["Hindi", "Marathi", "English"],
    verified: true,
    availability: "Available",
    followers: "12.4k",
    rating: 4.9,
    credits: 42,
    photo: u("photo-1534528741775-53994a69daeb"),
    rate: { amount: "₹18,000", unit: "song" },
  },
  {
    id: "rahul-iyer",
    name: "Rahul Iyer",
    role: "Music Producer · Mix Engineer",
    location: "Indiranagar, Bengaluru",
    genres: ["Indie", "Electronic", "R&B"],
    languages: ["English", "Tamil", "Kannada"],
    verified: true,
    availability: "Selective",
    followers: "8.1k",
    rating: 4.8,
    credits: 67,
    photo: u("photo-1507003211169-0a1dd7228f2d"),
    rate: { amount: "₹25,000", unit: "track" },
  },
  {
    id: "meher-kaur",
    name: "Meher Kaur",
    role: "Session Guitarist",
    location: "Hauz Khas, New Delhi",
    genres: ["Blues", "Rock", "Fusion"],
    languages: ["Punjabi", "Hindi", "English"],
    verified: false,
    availability: "Available",
    followers: "3.9k",
    rating: 4.7,
    credits: 28,
    photo: u("photo-1516280440614-37939bbacd81"),
    rate: { amount: "₹9,500", unit: "day" },
  },
  {
    id: "dj-noor",
    name: "DJ Noor",
    role: "Club DJ · Turntablist",
    location: "Bandra, Mumbai",
    genres: ["House", "Techno", "Desi Bass"],
    languages: ["Hindi", "English"],
    verified: true,
    availability: "Booked",
    followers: "24.6k",
    rating: 4.9,
    credits: 190,
    photo: u("photo-1571019613454-1cb2f99b2d8b"),
    rate: { amount: "₹65,000", unit: "night" },
  },
  {
    id: "arjun-menon",
    name: "Arjun Menon",
    role: "Film Composer",
    location: "Kochi, Kerala",
    genres: ["Orchestral", "Carnatic Fusion"],
    languages: ["Malayalam", "Tamil", "English"],
    verified: true,
    availability: "Selective",
    followers: "31.2k",
    rating: 5,
    credits: 84,
    photo: u("photo-1493225457124-a3eb161ffa5f"),
    rate: { amount: "On request" },
  },
  {
    id: "tanvi-rao",
    name: "Tanvi Rao",
    role: "Classical Vocalist",
    location: "Pune, Maharashtra",
    genres: ["Hindustani", "Bhajan", "Semi-Classical"],
    languages: ["Marathi", "Hindi", "Sanskrit"],
    verified: true,
    availability: "Available",
    followers: "6.7k",
    rating: 4.8,
    credits: 35,
    photo: u("photo-1524504388940-b1c1722653e1"),
    rate: { amount: "₹14,000", unit: "show" },
  },
];

export const singers: Talent[] = [
  talents[0]!,
  talents[5]!,

  {
    id: "zaid-qureshi",
    name: "Zaid Qureshi",
    role: "Rap Artist · Songwriter",
    location: "Dharavi, Mumbai",
    genres: ["Hip-Hop", "Gully Rap"],
    languages: ["Hindi", "Urdu"],
    verified: true,
    availability: "Available",
    followers: "48.9k",
    rating: 4.9,
    credits: 51,
    photo: u("photo-1499996860823-5214fcc65f8f"),
    rate: { amount: "₹40,000", unit: "feature" },
  },
  {
    id: "lisa-dsouza",
    name: "Lisa D'Souza",
    role: "Indie Vocalist",
    location: "Panjim, Goa",
    genres: ["Indie Pop", "Folk"],
    languages: ["English", "Konkani"],
    verified: false,
    availability: "Available",
    followers: "5.2k",
    rating: 4.6,
    credits: 19,
    photo: u("photo-1529626455594-4ff0802cfb7e"),
    rate: { amount: "₹12,000", unit: "song" },
  },
  {
    id: "harpreet-singh",
    name: "Harpreet Singh",
    role: "Folk & Sufi Singer",
    location: "Amritsar, Punjab",
    genres: ["Sufi", "Punjabi Folk"],
    languages: ["Punjabi", "Hindi"],
    verified: true,
    availability: "Selective",
    followers: "17.3k",
    rating: 4.9,
    credits: 62,
    photo: u("photo-1506794778202-cad84cf45f1d"),
    rate: { amount: "₹55,000", unit: "show" },
  },
  {
    id: "nithya-balan",
    name: "Nithya Balan",
    role: "Playback Vocalist",
    location: "T. Nagar, Chennai",
    genres: ["Tamil Film", "Carnatic"],
    languages: ["Tamil", "Telugu", "Malayalam"],
    verified: true,
    availability: "Booked",
    followers: "22.1k",
    rating: 4.8,
    credits: 73,
    photo: u("photo-1502823403499-6ccfcf4fb453"),
    rate: { amount: "₹22,000", unit: "song" },
  },
];

export const quickCategories: { label: string; to: QuickCategoryTo }[] = [
  { label: "Talent", to: "/categories" },
  { label: "Bands", to: "/bands" },
  { label: "Studios", to: "/discover/community" },
  { label: "Events", to: "/categories" },
  { label: "Marketplace", to: "/marketplace" },
  { label: "Rentals", to: "/marketplace/rent" },
  { label: "Labels", to: "/discover/community" },
  { label: "Venues", to: "/discover/community" },
  { label: "Communities", to: "/discover/community" },
];

type QuickCategoryTo =
  "/categories" | "/bands" | "/discover/community" | "/marketplace" | "/marketplace/rent";

/*
 * Browse categories. Each opens search for that kind of person; `role` is the taxonomy slug the
 * search filters on. Counts were invented figures and are gone (owner rule: never fabricate counts);
 * add them back only from a real query.
 */
export const categories = [
  { label: "Singers", role: "singer", slug: "singers" },
  { label: "Musicians", role: "musician", slug: "musicians" },
  { label: "DJs", role: "dj", slug: "djs" },
  { label: "Engineers", role: "sound_engineer", slug: "engineers" },
  { label: "Composers", role: "composer", slug: "composers" },
  { label: "Bands", role: "band", slug: "bands" },
  { label: "Studios", role: "studio", slug: "studios" },
  { label: "Labels", role: "music_label", slug: "labels" },
  { label: "Event Organizers", role: "event_organizer", slug: "organizers" },
  { label: "Music Schools", role: "music_school", slug: "schools" },
  { label: "Venues", role: "venue", slug: "venues" },
];

export const trending = [
  {
    name: "The Local Train",
    meta: "Indie Rock · Delhi NCR",
    photo: u("photo-1493225457124-a3eb161ffa5f", 600),
    tag: "Live Band",
  },
  {
    name: "Yash Raj Sound",
    meta: "Dolby Atmos · Mumbai",
    photo: u("photo-1598488035139-bdbb2231ce04", 600),
    tag: "Studio",
  },
  {
    name: "Kohra",
    meta: "Techno · New Delhi",
    photo: u("photo-1571266028243-e4733b0f0bb0", 600),
    tag: "DJ",
  },
];

export const studios = [
  {
    name: "Wugweb Studios",
    location: "Andheri West, Mumbai",
    rating: 4.9,
    rate: { amount: "₹1,800", unit: "hour" },
    photo: u("photo-1598488035139-bdbb2231ce04", 600),
    gear: ["SSL Duality", "Neumann U87", "Genelec 8351B"],
  },
  {
    name: "Krimson Avenue",
    location: "Koramangala, Bengaluru",
    rating: 4.7,
    rate: { amount: "₹1,200", unit: "hour" },
    photo: u("photo-1519508234439-4f23643125c1", 600),
    gear: ["API 1608", "Focal Trio", "Rhodes Mk1"],
  },
];
