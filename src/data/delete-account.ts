import type { SitePage } from "@/lib/help.functions";

/*
 * The public account-deletion page (/delete-account), for Google Play's account deletion and
 * partial deletion fields (queue item 1b, 4 Oct 2026). DRAFT copy for the owner to edit. Every
 * path named here was checked against the app on 4 Oct: deleteMyAccount (account + files),
 * portfolio, gallery, profile photos, services, Market listings. Posts can't be deleted in the
 * app yet, so they are not listed under "some of your data".
 */
export const deleteAccountPage: SitePage = {
  slug: "delete-account",
  title: "Delete your account",
  summary:
    "You can delete your MusicLinkd account and its data at any time, from the app or the web.",
  seoDescription:
    "How to delete your MusicLinkd account or some of your data, what is deleted and what is kept.",
  updated: "Last updated 4 October 2026",
  blocks: [
    { type: "heading", text: "How to delete your account" },
    {
      type: "list",
      items: [
        "In the app: open Settings, then Delete account.",
        "On the web: sign in at app.musiclinkd.com, then open Settings, then Delete account.",
        "An account with upcoming bookings can't be deleted until those bookings are resolved.",
      ],
    },
    { type: "cta", label: "Delete my account", link: { to: "/settings/delete-account" } },
    { type: "heading", text: "What is deleted" },
    {
      type: "list",
      items: [
        "Your profile, portfolio and services",
        "Messages you sent, your posts, follows and connections",
        "Your Market listings and saved items",
        "Your notifications and the devices registered for them",
        "Your verification requests",
        "Every file you uploaded: profile photo, cover, gallery and listing photos, and verification documents",
      ],
    },
    { type: "para", text: "Deleting your account is immediate and can't be undone." },
    { type: "heading", text: "What is kept, without your name" },
    {
      type: "list",
      items: [
        "Past booking requests, so the other person keeps their record",
        "Reviews you wrote",
        "Conversations and collaborations you started",
      ],
    },
    {
      type: "heading",
      id: "some-data",
      text: "Delete some of your data and keep your account",
    },
    {
      type: "list",
      items: [
        "A piece of work: open it in Portfolio and delete it.",
        "Gallery photos: on your profile's Portfolio tab, remove the photo.",
        "Profile photo or cover: Edit profile.",
        "A service: Services, open the service, Manage, Delete.",
        "A Market listing: Market, My listings, delete it.",
      ],
    },
    { type: "heading", text: "Can't sign in?" },
    {
      type: "para",
      text: "Contact us with the email or phone number on your account and we will delete it for you.",
    },
    { type: "cta", label: "Contact support", link: { to: "/contact" } },
  ],
};
