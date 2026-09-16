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
