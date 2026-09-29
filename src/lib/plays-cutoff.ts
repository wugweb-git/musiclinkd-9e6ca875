/*
 * When plays started meaning playback. Before this, a play was recorded when a player was opened,
 * whether or not anything played (fixed in ce93fe9), so earlier rows in portfolio_item_plays may
 * be too high and can't be told apart from real ones. Trending ignores plays before this moment,
 * and the owner's figures say plays are counted from this date. Set to the day the fix merged.
 */
export const PLAYS_COUNTED_FROM = "2026-09-30T00:00:00+05:30";

/** "30 Sep 2026", for the note beside the figures. */
export const playsCountedFromLabel = new Date(PLAYS_COUNTED_FROM).toLocaleDateString("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});
