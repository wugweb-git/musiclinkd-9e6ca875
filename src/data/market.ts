import type { PriceParts } from "@/lib/price";

export type ListingType = "product" | "service" | "rental" | "space";

export type Seller = {
  id: string;
  name: string;
  role: string;
  location: string;
  verified: boolean;
  rating: number;
  reviews: number;
  responseRate: string;
  responseTime: string;
  years: number;
  photo: string;
  bio: string;
};

export type Listing = {
  id: string;
  /** Database listings: the row's uuid, which saves are keyed by (`id` is the slug). */
  dbId?: string;
  type: ListingType;
  title: string;
  subtitle: string;
  /** Amount and unit ("day" for rentals); a sale price has no unit. */
  price: PriceParts;
  condition?: "New" | "Like New" | "Excellent" | "Good" | "Fair" | "Used";
  location: string;
  distance: string;
  category: string;
  subcategory: string;
  brand?: string;
  rating?: number;
  reviews?: number;
  availability?: string;
  delivery?: string;
  remote?: boolean;
  saves: number;
  postedAt: string;
  photos: string[];
  description: string;
  specs: { label: string; value: string }[];
  sellerId: string;
  /** Database listings: the seller's profile (username set) or only a seller name. */
  owner?: {
    id?: string | null;
    name: string;
    username: string | null;
    photo: string;
    verified: boolean;
    /** The seller's review average and count, when they have reviews; their follower count. */
    rating?: number;
    reviews?: number;
    followers?: number;
  };
  reason?: string;
  status?: "Draft" | "Pending Review" | "Published" | "Paused" | "Sold" | "Rented";
};

const img = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const sellers: Seller[] = [
  {
    id: "ravi-gear",
    name: "Ravi Deshmukh",
    role: "Session Guitarist · Gear Collector",
    location: "Dadar, Mumbai",
    verified: true,
    rating: 4.9,
    reviews: 128,
    responseRate: "98%",
    responseTime: "Under 2 hrs",
    years: 6,
    photo: img("photo-1507003211169-0a1dd7228f2d", 300),
    bio: "Touring guitarist for 12 years. I sell and rent gear I have personally used on records and tours across India.",
  },
  {
    id: "yash-raj-sound",
    name: "Yash Raj Sound",
    role: "Recording Studio · Verified Business",
    location: "Andheri West, Mumbai",
    verified: true,
    rating: 4.8,
    reviews: 341,
    responseRate: "95%",
    responseTime: "Under 4 hrs",
    years: 11,
    photo: img("photo-1598488035139-bdbb2231ce04", 300),
    bio: "Dolby Atmos certified room, Neve console, in-house engineers. Sessions, mixing, mastering and rehearsal packages.",
  },
  {
    id: "meher-kaur",
    name: "Meher Kaur",
    role: "Mix Engineer · Producer",
    location: "Hauz Khas, New Delhi",
    verified: true,
    rating: 5,
    reviews: 76,
    responseRate: "100%",
    responseTime: "Under 1 hr",
    years: 4,
    photo: img("photo-1516280440614-37939bbacd81", 300),
    bio: "Indie and film mixes. 200+ released songs. Remote delivery anywhere in India, revisions included.",
  },
  {
    id: "swaraj-instruments",
    name: "Swaraj Instruments",
    role: "Dealer · Indian Classical Instruments",
    location: "Girgaon, Mumbai",
    verified: true,
    rating: 4.7,
    reviews: 512,
    responseRate: "92%",
    responseTime: "Same day",
    years: 18,
    photo: img("photo-1511379938547-c1f69419868d", 300),
    bio: "Three generations of makers and restorers. Sitars, tanpuras, tablas and harmoniums, hand finished in Mumbai.",
  },
];

export const marketCategories = [
  { slug: "instruments", label: "Instruments", emoji: "🎸", count: "12,480" },
  { slug: "audio-gear", label: "Audio Gear", emoji: "🎙", count: "8,205" },
  { slug: "studio", label: "Studio", emoji: "🎛", count: "3,914" },
  { slug: "rentals", label: "Rentals", emoji: "📦", count: "2,760" },
  { slug: "spaces", label: "Spaces", emoji: "🏢", count: "1,208" },
];

export const subcategories: Record<string, string[]> = {
  instruments: [
    "Guitar",
    "Bass",
    "Keyboard",
    "Drums",
    "Sitar",
    "Tabla",
    "Harmonium",
    "Bansuri",
    "Veena",
    "Strings",
  ],
  "audio-gear": [
    "Microphones",
    "Interfaces",
    "Mixers",
    "Monitors",
    "Headphones",
    "Amplifiers",
    "PA Systems",
    "DJ Gear",
  ],
  studio: ["Outboard", "Acoustics", "Controllers", "Racks", "Cabling"],
  rentals: ["Backline", "PA & Lights", "Recording", "DJ Setup", "Instruments"],
  services: [
    "Mixing",
    "Mastering",
    "Production",
    "Session Musicians",
    "Songwriting",
    "Live Sound",
    "Teaching",
  ],
  spaces: ["Recording Studio", "Jam Room", "Rehearsal", "Podcast", "Live Venue"],
};

export const listings: Listing[] = [
  {
    id: "fender-strat-62",
    type: "product",
    title: "Fender American Vintage II '61 Stratocaster",
    subtitle: "Olympic White · with original hard case",
    price: { amount: "₹1,84,000" },
    condition: "Excellent",
    location: "Dadar, Mumbai",
    distance: "3.2 km away",
    category: "instruments",
    subcategory: "Guitar",
    brand: "Fender",
    saves: 214,
    postedAt: "2 days ago",
    photos: [
      img("photo-1516924962500-2b4b3b99ea02"),
      img("photo-1550985616-10810253b84d"),
      img("photo-1564186763535-ebb21ef5277f"),
    ],
    description:
      "Bought new from Furtados Mumbai in 2022, played only in studio. Frets at 95%, no buckle rash, all electronics stock. Comes with original moulded case, candy and certificate.",
    specs: [
      { label: "Brand", value: "Fender" },
      { label: "Model", value: "American Vintage II '61" },
      { label: "Year", value: "2022" },
      { label: "Condition", value: "Excellent" },
      { label: "Included", value: "Hard case, strap, cable" },
    ],
    sellerId: "ravi-gear",
    reason: "Because you follow session guitarists",
    status: "Published",
  },
  {
    id: "neumann-tlm103",
    type: "product",
    title: "Neumann TLM 103 Condenser Microphone",
    subtitle: "Large diaphragm · shockmount included",
    price: { amount: "₹78,500" },
    condition: "Like New",
    location: "Andheri, Mumbai",
    distance: "6.8 km away",
    category: "audio-gear",
    subcategory: "Microphones",
    brand: "Neumann",
    saves: 96,
    postedAt: "5 hours ago",
    photos: [img("photo-1590602847861-f357a9332bbc"), img("photo-1478737270239-2f02b77fc618")],
    description:
      "Studio owned, used on vocal sessions only. Includes EA 1 shockmount, original box and dust cover. Ideal for home vocal recording chains.",
    specs: [
      { label: "Brand", value: "Neumann" },
      { label: "Model", value: "TLM 103" },
      { label: "Pattern", value: "Cardioid" },
      { label: "Connectivity", value: "XLR, 48V phantom" },
      { label: "Condition", value: "Like New" },
    ],
    sellerId: "yash-raj-sound",
    reason: "Matches your search for vocal mics",
    status: "Published",
  },
  {
    id: "sitar-swaraj",
    type: "product",
    title: "Handcrafted Ravi Shankar Style Sitar",
    subtitle: "Seasoned tun wood · gourd resonator",
    price: { amount: "₹64,000" },
    condition: "New",
    location: "Girgaon, Mumbai",
    distance: "1.4 km away",
    category: "instruments",
    subcategory: "Sitar",
    brand: "Swaraj",
    saves: 143,
    postedAt: "1 day ago",
    photos: [img("photo-1621360841013-c7683c659ec6"), img("photo-1511379938547-c1f69419868d")],
    description:
      "Full size professional sitar with 7 main and 13 sympathetic strings. Hand carved gourd, deer bone jawari, fitted fibre case and tuning kit included.",
    specs: [
      { label: "Type", value: "Ravi Shankar style" },
      { label: "Wood", value: "Seasoned tun" },
      { label: "Strings", value: "7 main + 13 taraf" },
      { label: "Included", value: "Fibre case, mizrab, extra strings" },
      { label: "Warranty", value: "1 year workshop" },
    ],
    sellerId: "swaraj-instruments",
    reason: "Popular with Hindustani musicians near you",
    status: "Published",
  },
  {
    id: "mix-master-service",
    type: "service",
    title: "Mixing & Mastering for Indie Releases",
    subtitle: "Meher Kaur · 200+ released songs",
    price: { amount: "From ₹12,000", unit: "song" },
    location: "New Delhi · Remote",
    distance: "Remote available",
    category: "services",
    subcategory: "Mixing",
    rating: 5,
    reviews: 76,
    delivery: "5–7 days",
    remote: true,
    saves: 302,
    postedAt: "Active",
    photos: [img("photo-1598488035139-bdbb2231ce04"), img("photo-1493225457124-a3eb161ffa5f")],
    description:
      "Full mix and master for singles and EPs. Includes two revision rounds, stems delivery, and streaming-ready masters at -14 LUFS plus a club master.",
    specs: [
      { label: "Specialisation", value: "Indie, film, hip-hop" },
      { label: "Experience", value: "4 years · 200+ songs" },
      { label: "Languages", value: "Hindi, Punjabi, English" },
      { label: "Delivery time", value: "5–7 days" },
      { label: "Remote", value: "Yes, anywhere in India" },
    ],
    sellerId: "meher-kaur",
    reason: "Based on your recent projects",
    status: "Published",
  },
  {
    id: "backline-rental",
    type: "rental",
    title: "Full Backline Rental — Drums, Amps, DI",
    subtitle: "Gig ready kit with delivery in Mumbai",
    price: { amount: "₹6,500", unit: "day" },
    location: "Dadar, Mumbai",
    distance: "3.2 km away",
    category: "rentals",
    subcategory: "Backline",
    availability: "Available this weekend",
    saves: 58,
    postedAt: "3 days ago",
    photos: [img("photo-1571327073757-71d13c24de30"), img("photo-1519892300165-cb5542fb47c7")],
    description:
      "Pearl Export kit with Zildjian cymbals, two Fender guitar amps, Ampeg bass rig and DI boxes. Delivery and pickup within Mumbai available at extra cost.",
    specs: [
      { label: "Daily", value: "₹6,500" },
      { label: "Weekly", value: "₹32,000" },
      { label: "Monthly", value: "₹98,000" },
      { label: "Deposit", value: "₹20,000 refundable" },
      { label: "Delivery", value: "Self pickup or ₹1,800 delivery" },
    ],
    sellerId: "ravi-gear",
    status: "Published",
  },
  {
    id: "yrs-studio-a",
    type: "space",
    title: "Yash Raj Sound — Studio A",
    subtitle: "Neve console · Dolby Atmos certified",
    price: { amount: "₹9,500", unit: "shift" },
    location: "Andheri West, Mumbai",
    distance: "6.8 km away",
    category: "spaces",
    subcategory: "Recording Studio",
    rating: 4.8,
    reviews: 341,
    availability: "3 slots this week",
    saves: 411,
    postedAt: "Active",
    photos: [
      img("photo-1598653222000-6b7b7a552625"),
      img("photo-1470225620780-dba8ba36b745"),
      img("photo-1519508234439-4f23643125c1"),
    ],
    description:
      "Live room seats a 12 piece ensemble, isolated vocal booth, in-house engineer included in every shift. Overnight lockouts available at discounted rates.",
    specs: [
      { label: "Capacity", value: "12 musicians" },
      { label: "Console", value: "Neve 8424" },
      { label: "Monitoring", value: "ATC SCM45, Dolby Atmos 7.1.4" },
      { label: "Shift", value: "8 hours + engineer" },
      { label: "Facilities", value: "Parking, lounge, catering" },
    ],
    sellerId: "yash-raj-sound",
    status: "Published",
  },
  {
    id: "focusrite-18i20",
    type: "product",
    title: "Focusrite Scarlett 18i20 3rd Gen",
    subtitle: "18-in, 20-out USB interface",
    price: { amount: "₹32,000" },
    condition: "Good",
    location: "Bandra, Mumbai",
    distance: "8.1 km away",
    category: "audio-gear",
    subcategory: "Interfaces",
    brand: "Focusrite",
    saves: 41,
    postedAt: "6 days ago",
    photos: [img("photo-1520523839897-bd0b52f945a0"), img("photo-1558618666-fcd25c85cd64")],
    description:
      "Rack mounted since new, minor cosmetic marks on the rack ears. All preamps and ADAT ports tested and working. Includes power supply and USB cable.",
    specs: [
      { label: "Brand", value: "Focusrite" },
      { label: "Model", value: "Scarlett 18i20 3rd Gen" },
      { label: "Inputs", value: "8 mic pre + ADAT" },
      { label: "Condition", value: "Good" },
      { label: "Included", value: "PSU, USB cable" },
    ],
    sellerId: "ravi-gear",
    status: "Published",
  },
  {
    id: "jam-room-bandra",
    type: "space",
    title: "Bandra Jam Room — Hourly Rehearsal",
    subtitle: "Acoustically treated · backline included",
    price: { amount: "₹800", unit: "hour" },
    location: "Bandra East, Mumbai",
    distance: "7.4 km away",
    category: "spaces",
    subcategory: "Jam Room",
    rating: 4.6,
    reviews: 88,
    availability: "Open till 11 pm",
    saves: 67,
    postedAt: "Active",
    photos: [img("photo-1524230572899-a752b3835840"), img("photo-1503676260728-1c00da094a0b")],
    description:
      "Drum kit, two amps, PA with four mics and a fully treated room. Ideal for band rehearsals and pre-production before studio dates.",
    specs: [
      { label: "Capacity", value: "6 musicians" },
      { label: "Backline", value: "Drums, 2 amps, PA" },
      { label: "Minimum", value: "2 hours" },
      { label: "Hours", value: "9 am – 11 pm" },
      { label: "Facilities", value: "AC, water, parking" },
    ],
    sellerId: "yash-raj-sound",
    status: "Published",
  },
];

export const byId = (id: string) => listings.find((l) => l.id === id);
export const sellerById = (id: string) => sellers.find((s) => s.id === id);
export const bySeller = (id: string) => listings.filter((l) => l.sellerId === id);

export const recentSearches = [
  "condenser microphone",
  "tabla set Mumbai",
  "mixing engineer indie",
  "studio Andheri",
];

export const popularSearches = [
  "Shure SM7B",
  "Rehearsal room Bandra",
  "Session guitarist",
  "Harmonium",
  "Mastering under ₹8,000",
];

export const reviews = [
  {
    id: "r1",
    name: "Kabir Sen",
    role: "Producer · Kolkata",
    rating: 5,
    date: "Mar 2026",
    context: "Bought a microphone",
    body: "Gear arrived exactly as described, packed properly and shipped the same day. Ravi even sent a photo of the serial before dispatch.",
    response: "Thanks Kabir, glad it landed safely. Ping me for the shockmount anytime.",
  },
  {
    id: "r2",
    name: "Ira Fernandes",
    role: "Indie Vocalist · Goa",
    rating: 5,
    date: "Feb 2026",
    context: "Booked a mixing service",
    body: "Turnaround was quick and the notes were handled without any fuss. My release sounded competitive on streaming right away.",
  },
  {
    id: "r3",
    name: "Aman Gill",
    role: "Drummer · Chandigarh",
    rating: 4,
    date: "Jan 2026",
    context: "Rented backline",
    body: "Kit was in good shape. Delivery ran about an hour late but the crew set everything up before soundcheck.",
  },
];

export const offers = [
  { id: "o1", listing: "Fender American Vintage II '61", amount: "₹1,70,000", status: "Pending" },
  { id: "o2", listing: "Focusrite Scarlett 18i20", amount: "₹28,500", status: "Accepted" },
  { id: "o3", listing: "Neumann TLM 103", amount: "₹70,000", status: "Declined" },
];

export const sellerStats = [
  { label: "Listing views", value: "2,148", delta: "+18%" },
  { label: "Saves", value: "312", delta: "+9%" },
  { label: "Enquiries", value: "46", delta: "+12%" },
  { label: "Offers", value: "11", delta: "+3" },
];

export const notifications = [
  {
    id: "n1",
    title: "New offer on Fender Stratocaster",
    body: "₹1,70,000 from Kabir Sen",
    time: "12m",
    tone: "primary",
  },
  {
    id: "n2",
    title: "Listing approved",
    body: "Neumann TLM 103 is now live",
    time: "2h",
    tone: "success",
  },
  {
    id: "n3",
    title: "Rental request",
    body: "Backline kit for 14–16 Aug",
    time: "5h",
    tone: "warn",
  },
  {
    id: "n4",
    title: "Review received",
    body: "Ira Fernandes rated you 5 stars",
    time: "1d",
    tone: "purple",
  },
];
