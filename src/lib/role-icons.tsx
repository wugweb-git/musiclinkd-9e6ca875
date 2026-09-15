import {
  AudioLines,
  AudioWaveform,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Clapperboard,
  Disc3,
  Drum,
  GraduationCap,
  Guitar,
  Handshake,
  Headphones,
  KeyRound,
  Mic,
  MicVocal,
  Music,
  PenLine,
  Piano,
  Podcast,
  Radio,
  SlidersHorizontal,
  SlidersVertical,
  Sparkles,
  Star,
  Store,
  Ticket,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { TaxonomyOption } from "@/lib/taxonomy";

// Icons for person types (taxonomy_options, category person_types): by slug where a role has an
// object of its own, otherwise by taxonomy group. Used by the role picker and the Welcome ticker.
const bySlug: Record<string, LucideIcon> = {
  voice_artist: MicVocal,
  keyboardist: Piano,
  drummer: Drum,
  wind_player: Wind,
  lyricist: PenLine,
  music_director: Clapperboard,
  producer: SlidersHorizontal,
  beatmaker: SlidersHorizontal,
  mastering_engineer: AudioWaveform,
  dj: Headphones,
  rj: Radio,
  podcaster: Podcast,
  studio: SlidersVertical,
  music_label: Disc3,
  venue: Ticket,
  event_organizer: CalendarDays,
  booking_agency: Handshake,
  artist_manager: BriefcaseBusiness,
  production_house: Clapperboard,
  music_school: GraduationCap,
  dealer: Store,
  rental_provider: KeyRound,
  music_publisher: BookOpen,
  a_and_r: Star,
};

const byGroup: Record<string, LucideIcon> = {
  vocal: Mic,
  instrumentalist: Guitar,
  creator: Music,
  technical: AudioLines,
  media: Radio,
  education: GraduationCap,
  business: BriefcaseBusiness,
  other: Sparkles,
};

export function roleIcon(o: Pick<TaxonomyOption, "slug" | "metadata">): LucideIcon {
  return bySlug[o.slug] ?? byGroup[o.metadata?.group ?? ""] ?? Sparkles;
}
