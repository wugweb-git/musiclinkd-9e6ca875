import { createFileRoute } from "@tanstack/react-router";
import { SitePageScreen } from "@/components/ml/help";
import { deleteAccountPage } from "@/data/delete-account";

/*
 * Public, no sign-in: Google Play links here for account deletion and, with #some-data, partial
 * deletion (queue item 1b). Same screen as the About and legal pages.
 */
export const Route = createFileRoute("/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete Your Account & Data — MusicLinkd" },
      { name: "description", content: deleteAccountPage.seoDescription },
      {
        name: "keywords",
        content:
          "musiclinkd delete account, musiclinkd data deletion, right to erasure, creator privacy rights",
      },
      { name: "focus-keyphrase", content: "delete musiclinkd account" },
      { property: "og:title", content: "Delete your account — MusicLinkd" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <SitePageScreen page={deleteAccountPage} fallbackTitle="Delete your account" back="/help" />
  ),
});
