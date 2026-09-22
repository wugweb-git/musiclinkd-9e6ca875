/**
 * Token values JavaScript needs as numbers, mirroring src/styles.css. lucide's `size` prop takes a
 * number, so icons read these rather than repeating 16 and 20 across the app.
 */
export const iconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
} as const;

/** Radius tokens matching Gestalt 4-step scale in src/styles.css */
export const radius = {
  sm: 8,
  lg: 16,
  "3xl": 32,
  full: 9999,
} as const;

/** Standard touch targets and control heights */
export const controlHeight = {
  sm: 40,
  touch: 44,
  default: 48,
  lg: 56,
} as const;

/** Avatar dimensions */
export const avatarSize = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 136,
} as const;

/** Sanctioned spacing steps */
export const space = {
  1: 4,
  2: 8,
  3: 16,
  4: 32,
} as const;

/** Motion durations */
export const duration = {
  fast: 125,
  normal: 200,
  slow: 320,
  enter: 480,
} as const;

