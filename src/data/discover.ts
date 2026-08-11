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
  rate: string;
};

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
    rate: "₹18,000/song",
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
    rate: "₹25,000/track",
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
    rate: "₹9,500/day",
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
    rate: "₹65,000/night",
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
    rate: "On request",
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
    rate: "₹14,000/show",
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
    rate: "₹40,000/feature",
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
    rate: "₹12,000/song",
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
    rate: "₹55,000/show",
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
    rate: "₹22,000/song",
  },
];

export const quickCategories = [
  { label: "Talent", emoji: "🎤" },
  { label: "Bands", emoji: "🥁" },
  { label: "Studios", emoji: "🏢" },
  { label: "Events", emoji: "🎪" },
  { label: "Marketplace", emoji: "🛒" },
  { label: "Rentals", emoji: "🎛" },
  { label: "Labels", emoji: "🏷" },
  { label: "Venues", emoji: "🏟" },
  { label: "Communities", emoji: "👥" },
];

export const categories = [
  { label: "Singers", emoji: "🎤", count: "18,420", slug: "singers" },
  { label: "Musicians", emoji: "🎸", count: "26,180", slug: "musicians" },
  { label: "DJs", emoji: "🎧", count: "7,940", slug: "djs" },
  { label: "Engineers", emoji: "🎚", count: "4,310", slug: "engineers" },
  { label: "Composers", emoji: "🎼", count: "3,760", slug: "composers" },
  { label: "Bands", emoji: "🥁", count: "5,205", slug: "bands" },
  { label: "Studios", emoji: "🏢", count: "2,118", slug: "studios" },
  { label: "Labels", emoji: "🏷", count: "860", slug: "labels" },
  { label: "Event Organizers", emoji: "🎪", count: "1,472", slug: "organizers" },
  { label: "Music Schools", emoji: "🎓", count: "1,038", slug: "schools" },
  { label: "Venues", emoji: "🏟", count: "3,644", slug: "venues" },
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
    name: "Yash Raj Sound Studios",
    location: "Andheri West, Mumbai",
    rating: 4.9,
    rate: "₹1,800/hr",
    photo: u("photo-1598488035139-bdbb2231ce04", 600),
    gear: ["SSL Duality", "Neumann U87", "Genelec 8351B"],
  },
  {
    name: "Krimson Avenue",
    location: "Koramangala, Bengaluru",
    rating: 4.7,
    rate: "₹1,200/hr",
    photo: u("photo-1519508234439-4f23643125c1", 600),
    gear: ["API 1608", "Focal Trio", "Rhodes Mk1"],
  },
];
