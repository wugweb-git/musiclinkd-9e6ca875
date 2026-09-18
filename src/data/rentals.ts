export type RentalCategory = "instruments" | "audio" | "studio" | "dj" | "live" | "other";

export type RentalStatus =
  "Requested" | "Offer sent" | "Confirmed" | "Active" | "Completed" | "Cancelled" | "Declined";

export type Provider = {
  id: string;
  name: string;
  role: string;
  business?: string;
  location: string;
  verified: boolean;
  badges: string[];
  rating: number;
  reviews: number;
  completedRentals: number;
  responseRate: string;
  responseTime: string;
  years: number;
  photo: string;
  bio: string;
};

export type Equipment = {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: RentalCategory;
  subcategory: string;
  condition: "New" | "Like New" | "Excellent" | "Good" | "Fair" | "Used";
  daily: number;
  weekly: number;
  monthly: number;
  deposit: number;
  quantity: number;
  location: string;
  distance: string;
  availability: string;
  availableFrom?: string;
  unavailableDates: string[];
  minDays: number;
  maxDays: number;
  noticePeriod: string;
  pickup: boolean;
  delivery: boolean;
  deliveryFee?: number;
  deliveryNote?: string;
  rating?: number;
  reviews?: number;
  rentals: number;
  saves: number;
  views: number;
  enquiries: number;
  photos: string[];
  video?: string;
  description: string;
  specs: { label: string; value: string }[];
  included: string[];
  providerId: string;
  reason?: string;
  listingStatus:
    | "Draft"
    | "Pending Review"
    | "Active"
    | "Reserved"
    | "Currently Rented"
    | "Unavailable"
    | "Completed"
    | "Archived";
};

/**
 * A rental as the browse rows, tiles and detail screen render it. Static equipment carries every
 * field; database rentals (src/lib/market-view.ts) carry only stored fields, so screens skip the
 * absent ones.
 */
export type RentalItem = Pick<Equipment, "id" | "name" | "photos"> &
  Partial<Omit<Equipment, "id" | "name" | "photos">> & {
    /** Price text stored beside the amount ("+ ₹5,000 deposit"). */
    priceNote?: string;
    /** Database rentals: the row's uuid, which saves are keyed by (`id` is the slug). */
    dbId?: string;
    /** Database rentals: the item taxonomy slug ("drums", "microphones"), when the row has one. */
    itemCategory?: string;
    /** Database rentals: the provider's profile (username set) or only a name. */
    owner?: {
      id?: string | null;
      name: string;
      username: string | null;
      photo: string;
      verified: boolean;
      /** The provider's review average and count, when they have reviews; their follower count. */
      rating?: number;
      reviews?: number;
      followers?: number;
    };
  };

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export const rentalCategories: {
  slug: RentalCategory;
  label: string;
  emoji: string;
  count: string;
  subs: string[];
}[] = [
  {
    slug: "instruments",
    label: "Instruments",
    emoji: "🎸",
    count: "1,840 items",
    subs: [
      "Guitar",
      "Bass",
      "Keyboard",
      "Piano",
      "Drums",
      "Tabla",
      "Harmonium",
      "Sitar",
      "Sarod",
      "Santoor",
      "Bansuri",
      "Veena",
      "Tanpura",
      "Dholak",
      "Other instruments",
    ],
  },
  {
    slug: "audio",
    label: "Audio",
    emoji: "🎙",
    count: "2,310 items",
    subs: [
      "Microphones",
      "Audio Interfaces",
      "Mixers",
      "Headphones",
      "Studio Monitors",
      "Speakers",
      "PA Systems",
      "Amplifiers",
      "Cables",
      "DI Boxes",
    ],
  },
  {
    slug: "studio",
    label: "Studio",
    emoji: "🎛",
    count: "960 items",
    subs: [
      "Recording Equipment",
      "Monitoring",
      "Microphones",
      "Controllers",
      "Outboard Gear",
      "Backline",
    ],
  },
  {
    slug: "dj",
    label: "DJ",
    emoji: "🎧",
    count: "540 items",
    subs: [
      "DJ Controllers",
      "Turntables",
      "Mixers",
      "Speakers",
      "Lighting",
      "Performance Equipment",
    ],
  },
  {
    slug: "live",
    label: "Live",
    emoji: "🔊",
    count: "1,120 items",
    subs: ["PA Systems", "Speakers", "Microphones", "Mixers", "Amplifiers", "Stage Equipment"],
  },
  {
    slug: "other",
    label: "Other",
    emoji: "📦",
    count: "280 items",
    subs: ["Cases & Stands", "Cables", "Accessories", "Transport"],
  },
];

export const providers: Provider[] = [
  {
    id: "soundhouse",
    name: "SoundHouse Studio",
    role: "Recording Studio · Rental Provider",
    business: "SoundHouse Audio LLP",
    location: "Andheri West, Mumbai",
    verified: true,
    badges: ["Verified Business", "Rental Provider"],
    rating: 4.9,
    reviews: 214,
    completedRentals: 386,
    responseRate: "98%",
    responseTime: "Under 1 hr",
    years: 9,
    photo: img("photo-1598488035139-bdbb2231ce04", 300),
    bio: "Studio-grade microphones, preamps and monitoring available for hire. Everything is serviced between rentals and delivered in flight cases.",
  },
  {
    id: "ravi-gear",
    name: "Ravi Deshmukh",
    role: "Session Guitarist · Backline Owner",
    location: "Dadar, Mumbai",
    verified: true,
    badges: ["Verified Identity", "Professional"],
    rating: 4.8,
    reviews: 128,
    completedRentals: 174,
    responseRate: "96%",
    responseTime: "Under 2 hrs",
    years: 6,
    photo: img("photo-1507003211169-0a1dd7228f2d", 300),
    bio: "Touring guitarist renting out the amps, pedals and backline I use on the road. Pickup from Dadar or delivery across Mumbai.",
  },
  {
    id: "swaraj-instruments",
    name: "Swaraj Instruments",
    role: "Dealer · Indian Classical Instruments",
    business: "Swaraj Instruments Pvt Ltd",
    location: "Girgaon, Mumbai",
    verified: true,
    badges: ["Verified Business", "Industry Verified"],
    rating: 4.7,
    reviews: 512,
    completedRentals: 640,
    responseRate: "92%",
    responseTime: "Same day",
    years: 18,
    photo: img("photo-1511379938547-c1f69419868d", 300),
    bio: "Three generations of makers. Concert-ready sitars, tanpuras, tablas and harmoniums for sessions, shoots and stage.",
  },
  {
    id: "pulse-live",
    name: "Pulse Live Systems",
    role: "Live Sound & Event Rentals",
    business: "Pulse Live Systems",
    location: "Lower Parel, Mumbai",
    verified: true,
    badges: ["Verified Business", "Rental Provider"],
    rating: 4.6,
    reviews: 189,
    completedRentals: 421,
    responseRate: "94%",
    responseTime: "Under 3 hrs",
    years: 12,
    photo: img("photo-1470225620780-dba8ba36b745", 300),
    bio: "PA systems, line arrays, monitors, DJ rigs and stage lighting with crew, delivery and on-site support anywhere in MMR.",
  },
];

export const equipment: Equipment[] = [
  {
    id: "shure-sm7b",
    name: "Shure SM7B",
    brand: "Shure",
    model: "SM7B",
    category: "audio",
    subcategory: "Microphones",
    condition: "Excellent",
    daily: 900,
    weekly: 4500,
    monthly: 14000,
    deposit: 15000,
    quantity: 3,
    location: "Andheri West, Mumbai",
    distance: "6.8 km away",
    availability: "Available Aug 18–22",
    availableFrom: "18 Aug",
    unavailableDates: ["2026-08-24", "2026-08-25", "2026-08-26"],
    minDays: 1,
    maxDays: 30,
    noticePeriod: "24 hours",
    pickup: true,
    delivery: true,
    deliveryFee: 600,
    deliveryNote: "Same-day delivery within Mumbai before 6 pm",
    rating: 4.9,
    reviews: 64,
    rentals: 128,
    saves: 214,
    views: 3120,
    enquiries: 46,
    photos: [
      img("photo-1590602847861-f357a9332bbc"),
      img("photo-1478737270239-2f02b77fc618"),
      img("photo-1520523839897-bd0b52f945a0"),
    ],
    description:
      "The broadcast standard for vocals, podcasts and loud sources. Serviced between every rental, supplied in a padded case with a fresh windscreen.",
    specs: [
      { label: "Brand", value: "Shure" },
      { label: "Model", value: "SM7B" },
      { label: "Type", value: "Dynamic, cardioid" },
      { label: "Connectivity", value: "XLR (needs 60dB gain)" },
      { label: "Power", value: "No phantom required" },
      { label: "Weight", value: "0.76 kg" },
      { label: "Condition", value: "Excellent" },
      { label: "Year", value: "2023" },
    ],
    included: ["Microphone", "Windscreen A7WS", "Yoke mount", "XLR cable 5 m", "Padded case"],
    providerId: "soundhouse",
    reason: "Because you record vocals at home",
    listingStatus: "Active",
  },
  {
    id: "fender-twin",
    name: "Fender Twin Reverb '65 Reissue",
    brand: "Fender",
    model: "Twin Reverb '65 RI",
    category: "instruments",
    subcategory: "Guitar",
    condition: "Good",
    daily: 1800,
    weekly: 9000,
    monthly: 28000,
    deposit: 25000,
    quantity: 1,
    location: "Dadar, Mumbai",
    distance: "3.2 km away",
    availability: "Available this weekend",
    availableFrom: "16 Aug",
    unavailableDates: ["2026-08-20", "2026-08-21"],
    minDays: 1,
    maxDays: 14,
    noticePeriod: "48 hours",
    pickup: true,
    delivery: true,
    deliveryFee: 1200,
    deliveryNote: "Delivery with a two-person crew inside Mumbai",
    rating: 4.8,
    reviews: 31,
    rentals: 74,
    saves: 96,
    views: 1840,
    enquiries: 22,
    photos: [img("photo-1550985616-10810253b84d"), img("photo-1564186763535-ebb21ef5277f")],
    description:
      "85W of clean headroom with the classic Fender spring reverb and tremolo. Retubed in March, footswitch and cover included.",
    specs: [
      { label: "Brand", value: "Fender" },
      { label: "Model", value: "'65 Twin Reverb Reissue" },
      { label: "Type", value: "Valve combo amplifier" },
      { label: "Power", value: "85W · 230V" },
      { label: "Speakers", value: '2 × 12" Jensen C-12K' },
      { label: "Weight", value: "29 kg" },
      { label: "Condition", value: "Good" },
      { label: "Year", value: "2019" },
    ],
    included: ["Amplifier", "2-button footswitch", "Padded cover", "Power cable"],
    providerId: "ravi-gear",
    reason: "Matches the amps you saved",
    listingStatus: "Currently Rented",
  },
  {
    id: "pearl-export-kit",
    name: "Pearl Export 5-Piece Drum Kit",
    brand: "Pearl",
    model: "Export EXX725",
    category: "instruments",
    subcategory: "Drums",
    condition: "Good",
    daily: 2400,
    weekly: 12000,
    monthly: 36000,
    deposit: 20000,
    quantity: 2,
    location: "Dadar, Mumbai",
    distance: "3.2 km away",
    availability: "Available from 17 Aug",
    availableFrom: "17 Aug",
    unavailableDates: ["2026-08-19"],
    minDays: 1,
    maxDays: 30,
    noticePeriod: "48 hours",
    pickup: true,
    delivery: true,
    deliveryFee: 1800,
    deliveryNote: "Delivery, setup and pickup within Mumbai",
    rating: 4.7,
    reviews: 42,
    rentals: 96,
    saves: 58,
    views: 1420,
    enquiries: 18,
    photos: [img("photo-1571327073757-71d13c24de30"), img("photo-1519892300165-cb5542fb47c7")],
    description:
      "Gig-ready kit with Zildjian cymbals, new heads and hardware. Ideal for rehearsals, showcases and small-venue shows.",
    specs: [
      { label: "Brand", value: "Pearl" },
      { label: "Model", value: "Export EXX725" },
      { label: "Type", value: "5-piece acoustic kit" },
      { label: "Cymbals", value: "Zildjian ZBT hats, crash, ride" },
      { label: "Hardware", value: "Full stands + throne" },
      { label: "Weight", value: "62 kg packed" },
      { label: "Condition", value: "Good" },
      { label: "Year", value: "2021" },
    ],
    included: ["Shells", "Cymbals", "Hardware", "Throne", "Kick pedal", "Transport cases"],
    providerId: "ravi-gear",
    listingStatus: "Active",
  },
  {
    id: "pioneer-xdj-rx3",
    name: "Pioneer XDJ-RX3 DJ System",
    brand: "Pioneer DJ",
    model: "XDJ-RX3",
    category: "dj",
    subcategory: "DJ Controllers",
    condition: "Like New",
    daily: 3500,
    weekly: 17500,
    monthly: 52000,
    deposit: 40000,
    quantity: 2,
    location: "Lower Parel, Mumbai",
    distance: "5.1 km away",
    availability: "Available Aug 15–30",
    availableFrom: "15 Aug",
    unavailableDates: ["2026-08-31"],
    minDays: 1,
    maxDays: 21,
    noticePeriod: "24 hours",
    pickup: true,
    delivery: true,
    deliveryFee: 1500,
    deliveryNote: "Delivered in flight case with a technician on request",
    rating: 4.9,
    reviews: 58,
    rentals: 143,
    saves: 176,
    views: 2680,
    enquiries: 39,
    photos: [img("photo-1571266028243-e4733b0f0bb0"), img("photo-1493225457124-a3eb161ffa5f")],
    description:
      'All-in-one rekordbox and Serato-ready system with 10.1" touchscreen. Standard for club nights, weddings and brand events across Mumbai.',
    specs: [
      { label: "Brand", value: "Pioneer DJ" },
      { label: "Model", value: "XDJ-RX3" },
      { label: "Type", value: "All-in-one DJ system" },
      { label: "Connectivity", value: "USB, XLR out, RCA, mic in" },
      { label: "Power", value: "230V AC" },
      { label: "Weight", value: "8.6 kg" },
      { label: "Condition", value: "Like New" },
      { label: "Year", value: "2024" },
    ],
    included: ["XDJ-RX3", "Flight case", "Power cable", "2 × XLR cables", "USB drive"],
    providerId: "pulse-live",
    reason: "Popular with event DJs near you",
    listingStatus: "Active",
  },
  {
    id: "jbl-pa-2k",
    name: "JBL EON 2000W PA System",
    brand: "JBL",
    model: "EON715 + EON718S",
    category: "live",
    subcategory: "PA Systems",
    condition: "Excellent",
    daily: 6500,
    weekly: 32000,
    monthly: 96000,
    deposit: 50000,
    quantity: 4,
    location: "Lower Parel, Mumbai",
    distance: "5.1 km away",
    availability: "3 sets available",
    availableFrom: "Today",
    unavailableDates: [],
    minDays: 1,
    maxDays: 60,
    noticePeriod: "24 hours",
    pickup: false,
    delivery: true,
    deliveryFee: 2500,
    deliveryNote: "Delivery, rigging and pickup included in MMR; crew billed separately",
    rating: 4.7,
    reviews: 77,
    rentals: 210,
    saves: 132,
    views: 3980,
    enquiries: 61,
    photos: [img("photo-1519508234439-4f23643125c1"), img("photo-1470225620780-dba8ba36b745")],
    description:
      "Two tops, two subs, stands and cabling — enough for a 300-person room. Includes a 12-channel mixer and four wired microphones.",
    specs: [
      { label: "Brand", value: "JBL" },
      { label: "Model", value: "EON715 tops + EON718S subs" },
      { label: "Type", value: "Powered PA system" },
      { label: "Coverage", value: "Up to 300 people" },
      { label: "Power", value: "2000W total · 230V" },
      { label: "Weight", value: "148 kg packed" },
      { label: "Condition", value: "Excellent" },
      { label: "Year", value: "2023" },
    ],
    included: ["2 tops", "2 subs", "Speaker stands", "12-ch mixer", "4 wired mics", "All cabling"],
    providerId: "pulse-live",
    listingStatus: "Reserved",
  },
  {
    id: "swaraj-tabla",
    name: "Concert Tabla Set with Tuning Kit",
    brand: "Swaraj",
    model: "Concert Series",
    category: "instruments",
    subcategory: "Tabla",
    condition: "Excellent",
    daily: 700,
    weekly: 3200,
    monthly: 9000,
    deposit: 8000,
    quantity: 5,
    location: "Girgaon, Mumbai",
    distance: "1.4 km away",
    availability: "Available today",
    availableFrom: "Today",
    unavailableDates: [],
    minDays: 1,
    maxDays: 90,
    noticePeriod: "Same day",
    pickup: true,
    delivery: false,
    rating: 4.8,
    reviews: 96,
    rentals: 260,
    saves: 88,
    views: 1760,
    enquiries: 27,
    photos: [img("photo-1621360841013-c7683c659ec6"), img("photo-1511379938547-c1f69419868d")],
    description:
      "Sheesham dayan and nickel bayan tuned to your session key before pickup. Cushions, covers and hammer included.",
    specs: [
      { label: "Brand", value: "Swaraj" },
      { label: "Model", value: "Concert Series" },
      { label: "Type", value: "Tabla pair" },
      { label: "Tuning", value: "Tuned to key on request" },
      { label: "Weight", value: "11 kg" },
      { label: "Condition", value: "Excellent" },
      { label: "Year", value: "2024" },
    ],
    included: ["Dayan", "Bayan", "Cushion rings", "Covers", "Tuning hammer"],
    providerId: "swaraj-instruments",
    reason: "Because you follow Hindustani artists",
    listingStatus: "Active",
  },
  {
    id: "focusrite-18i20-rent",
    name: "Focusrite Scarlett 18i20 Interface",
    brand: "Focusrite",
    model: "18i20 3rd Gen",
    category: "studio",
    subcategory: "Recording Equipment",
    condition: "Good",
    daily: 1100,
    weekly: 5200,
    monthly: 16000,
    deposit: 12000,
    quantity: 2,
    location: "Bandra, Mumbai",
    distance: "8.1 km away",
    availability: "Available from 19 Aug",
    availableFrom: "19 Aug",
    unavailableDates: ["2026-08-15", "2026-08-16", "2026-08-17", "2026-08-18"],
    minDays: 2,
    maxDays: 45,
    noticePeriod: "48 hours",
    pickup: true,
    delivery: true,
    deliveryFee: 500,
    deliveryNote: "Courier across Mumbai in 24 hours",
    rating: 4.6,
    reviews: 24,
    rentals: 52,
    saves: 41,
    views: 980,
    enquiries: 12,
    photos: [img("photo-1520523839897-bd0b52f945a0"), img("photo-1558618666-fcd25c85cd64")],
    description:
      "Eight preamps plus ADAT for tracking live bands on location. Rack ears fitted, all channels tested before dispatch.",
    specs: [
      { label: "Brand", value: "Focusrite" },
      { label: "Model", value: "Scarlett 18i20 3rd Gen" },
      { label: "Type", value: "USB audio interface" },
      { label: "Connectivity", value: "USB-C, 8 mic pre, ADAT" },
      { label: "Power", value: "External PSU" },
      { label: "Weight", value: "3.1 kg" },
      { label: "Condition", value: "Good" },
      { label: "Year", value: "2020" },
    ],
    included: ["Interface", "PSU", "USB-C cable", "Rack ears"],
    providerId: "soundhouse",
    listingStatus: "Active",
  },
  {
    id: "nord-stage-3",
    name: "Nord Stage 3 88-Key Stage Piano",
    brand: "Nord",
    model: "Stage 3 88",
    category: "instruments",
    subcategory: "Keyboard",
    condition: "Excellent",
    daily: 4200,
    weekly: 21000,
    monthly: 62000,
    deposit: 60000,
    quantity: 1,
    location: "Andheri West, Mumbai",
    distance: "6.8 km away",
    availability: "Booked till 18 Aug",
    availableFrom: "19 Aug",
    unavailableDates: ["2026-08-14", "2026-08-15", "2026-08-16", "2026-08-17", "2026-08-18"],
    minDays: 1,
    maxDays: 21,
    noticePeriod: "72 hours",
    pickup: true,
    delivery: true,
    deliveryFee: 1500,
    rating: 5,
    reviews: 19,
    rentals: 38,
    saves: 121,
    views: 2210,
    enquiries: 31,
    photos: [img("photo-1520166012956-add9ba0835cb"), img("photo-1552056776-9b5657ce7d61")],
    description:
      "Fully weighted hammer action with the Nord piano and sample libraries loaded. Flight case, stand and sustain pedal included.",
    specs: [
      { label: "Brand", value: "Nord" },
      { label: "Model", value: "Stage 3 88" },
      { label: "Type", value: "Stage piano" },
      { label: "Connectivity", value: "Stereo out, MIDI, USB" },
      { label: "Power", value: "230V AC" },
      { label: "Weight", value: "18.5 kg" },
      { label: "Condition", value: "Excellent" },
      { label: "Year", value: "2022" },
    ],
    included: ["Keyboard", "Flight case", "X-stand", "Sustain pedal", "Cables"],
    providerId: "soundhouse",
    listingStatus: "Active",
  },
];

export const equipmentById = (id: string) => equipment.find((e) => e.id === id);
export const providerById = (id: string) => providers.find((p) => p.id === id);
export const equipmentByProvider = (id: string) => equipment.filter((e) => e.providerId === id);
export const equipmentByCategory = (slug: string) => equipment.filter((e) => e.category === slug);

export type Booking = {
  id: string;
  ref: string;
  equipmentId: string;
  status: RentalStatus;
  bucket: "Upcoming" | "Active" | "Completed" | "Cancelled";
  start: string;
  end: string;
  days: number;
  quantity: number;
  fulfilment: "Pickup" | "Provider delivery" | "Courier";
  total: number;
  deposit: number;
  timeRemaining?: string;
  returnBy?: string;
  note?: string;
};

export const bookings: Booking[] = [
  {
    id: "b1",
    ref: "ML-RNT-48213",
    equipmentId: "pioneer-xdj-rx3",
    status: "Confirmed",
    bucket: "Upcoming",
    start: "22 Aug 2026",
    end: "24 Aug 2026",
    days: 3,
    quantity: 1,
    fulfilment: "Provider delivery",
    total: 12000,
    deposit: 40000,
    note: "Delivery at Famous Studios, Mahalaxmi by 10 am",
  },
  {
    id: "b2",
    ref: "ML-RNT-47990",
    equipmentId: "shure-sm7b",
    status: "Active",
    bucket: "Active",
    start: "12 Aug 2026",
    end: "18 Aug 2026",
    days: 7,
    quantity: 2,
    fulfilment: "Pickup",
    total: 9000,
    deposit: 30000,
    timeRemaining: "3 days left",
    returnBy: "18 Aug, 7 pm",
    note: "Return to SoundHouse reception with both cases",
  },
  {
    id: "b3",
    ref: "ML-RNT-47204",
    equipmentId: "pearl-export-kit",
    status: "Completed",
    bucket: "Completed",
    start: "28 Jul 2026",
    end: "30 Jul 2026",
    days: 3,
    quantity: 1,
    fulfilment: "Provider delivery",
    total: 9000,
    deposit: 20000,
  },
  {
    id: "b4",
    ref: "ML-RNT-46781",
    equipmentId: "jbl-pa-2k",
    status: "Cancelled",
    bucket: "Cancelled",
    start: "10 Jul 2026",
    end: "11 Jul 2026",
    days: 2,
    quantity: 1,
    fulfilment: "Provider delivery",
    total: 15500,
    deposit: 50000,
    note: "Cancelled by renter · event postponed",
  },
];

export const bookingById = (id: string) => bookings.find((b) => b.id === id);

export const rentalRequests = [
  {
    id: "rr1",
    equipmentId: "fender-twin",
    renter: "Kabir Sen",
    dates: "18–20 Aug",
    quantity: 1,
    offered: 4800,
    asking: 5400,
    status: "Pending" as const,
  },
  {
    id: "rr2",
    equipmentId: "swaraj-tabla",
    renter: "Ira Fernandes",
    dates: "21–28 Aug",
    quantity: 1,
    offered: 3200,
    asking: 3200,
    status: "Accepted" as const,
  },
  {
    id: "rr3",
    equipmentId: "focusrite-18i20-rent",
    renter: "Aman Gill",
    dates: "15–17 Aug",
    quantity: 1,
    offered: 2400,
    asking: 3300,
    status: "Declined" as const,
  },
];

export const rentalReviews = [
  {
    id: "rv1",
    name: "Kabir Sen",
    role: "Producer · Kolkata",
    rating: 5,
    date: "Aug 2026",
    context: "Rented SM7B · 5 days",
    tags: ["Condition as described", "Great communication", "Easy pickup"],
    body: "Mic was spotless, came with a fresh windscreen and a spare cable. Pickup took two minutes and the deposit was handled clearly.",
    response: "Thanks Kabir — the pair is yours whenever you need it again.",
  },
  {
    id: "rv2",
    name: "Ira Fernandes",
    role: "Indie Vocalist · Goa",
    rating: 5,
    date: "Jul 2026",
    context: "Rented tabla set · 7 days",
    tags: ["Accurate listing", "Value"],
    body: "Tuned to my session key before I collected it. Made the shoot far easier than sourcing locally.",
  },
  {
    id: "rv3",
    name: "Aman Gill",
    role: "Drummer · Chandigarh",
    rating: 4,
    date: "Jul 2026",
    context: "Rented backline · 3 days",
    tags: ["Delivery", "Condition as described"],
    body: "Kit was in good shape. Delivery ran about an hour late but the crew set everything up before soundcheck.",
  },
];

export const rentalNotifications = [
  {
    id: "rn1",
    title: "Rental request received",
    body: "Kabir Sen · Fender Twin Reverb · 18–20 Aug",
    time: "8m",
    tone: "primary",
  },
  {
    id: "rn2",
    title: "Request accepted",
    body: "Pioneer XDJ-RX3 confirmed for 22–24 Aug",
    time: "1h",
    tone: "success",
  },
  {
    id: "rn3",
    title: "Counter offer",
    body: "₹4,800 for 3 days on the Twin Reverb",
    time: "3h",
    tone: "warn",
  },
  {
    id: "rn4",
    title: "Return reminder",
    body: "2 × Shure SM7B due back 18 Aug, 7 pm",
    time: "6h",
    tone: "warn",
  },
  {
    id: "rn5",
    title: "Review request",
    body: "Rate Pearl Export kit and Ravi Deshmukh",
    time: "2d",
    tone: "purple",
  },
];

export const providerInsights = [
  { label: "Listing views", value: "8,420", delta: "+16%" },
  { label: "Saves", value: "486", delta: "+11%" },
  { label: "Enquiries", value: "132", delta: "+8%" },
  { label: "Rental requests", value: "54", delta: "+6" },
  { label: "Bookings", value: "38", delta: "+4" },
  { label: "Response rate", value: "98%", delta: "+2%" },
];

export const recentRentalSearches = [
  "Shure SM7B",
  "PA system 300 pax",
  "tabla set Girgaon",
  "stage piano weekend",
];

export const popularRentalSearches = [
  "Shure SM7B",
  "Pioneer XDJ",
  "Fender Twin Reverb",
  "Drum kit Mumbai",
  "Line array under ₹10k per day",
];

export const priceFor = (e: Equipment, days: number) => {
  const months = Math.floor(days / 30);
  const afterMonths = days - months * 30;
  const weeks = Math.floor(afterMonths / 7);
  const extraDays = afterMonths - weeks * 7;
  return months * e.monthly + weeks * e.weekly + extraDays * e.daily;
};
