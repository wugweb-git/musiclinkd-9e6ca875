import {
  AudioWaveform,
  Drum,
  Guitar,
  Piano,
  SlidersHorizontal,
  Wind,
  type LucideIcon,
} from "lucide-react";

/*
 * Icons for instruments (taxonomy_options, category instruments), by slug. Lucide has no icon for
 * most Indian instruments (sitar, tabla, veena, sarangi…), so each one takes the icon of the
 * family it plays like — plucked strings share Guitar, bowed strings share AudioWaveform, keys
 * share Piano, wind share Wind, percussion share Drum. Same idea as role-icons.tsx's byGroup
 * fallback, at instrument grain since the taxonomy carries no group for these yet.
 */
const bySlug: Record<string, LucideIcon> = {
  acoustic_guitar: Guitar,
  electric_guitar: Guitar,
  bass_guitar: Guitar,
  ukulele: Guitar,
  mandolin: Guitar,
  sitar: Guitar,
  veena: Guitar,
  sarod: Guitar,

  keyboard: Piano,
  piano: Piano,
  harmonium: Piano,

  drums: Drum,
  tabla: Drum,
  dholak: Drum,
  cajon: Drum,
  mridangam: Drum,
  ghatam: Drum,
  kanjira: Drum,
  drum_machine: Drum,

  flute_bansuri: Wind,
  bansuri: Wind,
  saxophone: Wind,
  trumpet: Wind,
  clarinet: Wind,
  shehnai: Wind,
  nadaswaram: Wind,
  harmonica: Wind,

  violin: AudioWaveform,
  viola: AudioWaveform,
  cello: AudioWaveform,
  double_bass: AudioWaveform,
  sarangi: AudioWaveform,
  santoor: AudioWaveform,
  tanpura: AudioWaveform,

  dj_controller: SlidersHorizontal,
  sampler: SlidersHorizontal,
};

export function instrumentIcon(slug: string): LucideIcon {
  return bySlug[slug] ?? Guitar;
}
