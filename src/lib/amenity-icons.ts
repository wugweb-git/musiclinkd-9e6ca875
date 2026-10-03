// A line icon for each amenity (taxonomy amenities), so a place's amenities read at a
// glance. Black line icons only; an amenity the map doesn't know gets the generic one.

import {
  AirVent,
  Armchair,
  BookOpen,
  CarFront,
  Coffee,
  DoorOpen,
  Drum,
  GlassWater,
  Guitar,
  KeyRound,
  Lock,
  Mic,
  Moon,
  ParkingCircle,
  Router,
  Sofa,
  Sparkles,
  Speaker,
  Utensils,
  UtensilsCrossed,
  Wifi,
  type LucideIcon,
} from "lucide-react";

const amenityIcons: Record<string, LucideIcon> = {
  vocal_booth: Mic,
  live_room: Drum,
  rehearsal_room: Guitar,
  green_room: DoorOpen,
  private_lounge: Armchair,
  chill_lounge: Sofa,
  instruments_support: Guitar,
  acoustics_optimized: Speaker,
  reference_library: BookOpen,
  parking_space: ParkingCircle,
  valet_parking: CarFront,
  access_24x7: KeyRound,
  open_till_2am: Moon,
  lockers: Lock,
  wifi: Wifi,
  fiber_internet: Router,
  air_conditioning: AirVent,
  drinking_water: GlassWater,
  cafe: Coffee,
  catering: UtensilsCrossed,
  bar_and_diner_access: Utensils,
};

/** The amenity's icon; Sparkles for one without its own. */
export function amenityIcon(slug: string): LucideIcon {
  return amenityIcons[slug] ?? Sparkles;
}
