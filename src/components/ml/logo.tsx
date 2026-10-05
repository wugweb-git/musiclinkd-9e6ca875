import suppliedLogo from "@/assets/musiclinkd-logo.svg.asset.json";

// The owner-supplied logo is the source of truth. Keeping it as an image avoids
// redrawing or subtly changing its proportions in different pieces of chrome.

export function LogoMark({ className }: { className?: string | undefined }) {
  return (
    <img
      src={suppliedLogo.url}
      className={className}
      alt="MusicLinkd"
      width={641}
      height={550}
      // The asset is served by Lovable's hosting (/__l5e/…); anywhere it can't load (a local dev
      // server) it hides instead of showing a broken image.
      onError={(e) => {
        e.currentTarget.style.visibility = "hidden";
      }}
    />
  );
}
