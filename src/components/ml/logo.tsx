import suppliedLogo from "@/assets/musiclinkd-logo.svg.asset.json";

// The owner-supplied logo is the source of truth. Keeping it as an image avoids
// redrawing or subtly changing its proportions in different pieces of chrome.

export function LogoMark({ className }: { className?: string | undefined }) {
  return (
    <img src={suppliedLogo.url} className={className} alt="MusicLinkd" width={641} height={550} />
  );
}
