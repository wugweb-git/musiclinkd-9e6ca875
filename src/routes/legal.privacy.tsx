import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — MusicLinkd" },
      {
        name: "description",
        content: "What MusicLinkd collects, why, and the controls you have over your data.",
      },
      { property: "og:title", content: "Privacy Policy — MusicLinkd" },
      { property: "og:description", content: "Clear answers about your data on MusicLinkd." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  {
    title: "What we collect",
    body: "Account details (email or phone), the profile and portfolio you publish, and activity needed to run bookings, messages and search.",
  },
  {
    title: "What stays private by default",
    body: "Your email, phone number, exact address, verification documents and draft work. Nothing here appears on your public profile.",
  },
  {
    title: "Why we use it",
    body: "To show your work to the right people, run discovery and recommendations, keep bookings accurate, and prevent impersonation.",
  },
  {
    title: "Verification documents",
    body: "Documents you submit for verification are used only to confirm identity or business status. They are never shown on your profile and are removed once a decision is made.",
  },
  {
    title: "Your controls",
    body: "Edit or unpublish anything at any time, control profile visibility, turn off recommendation signals, export your data, or delete your account entirely.",
  },
];

function PrivacyPage() {
  return (
    <Screen bottomNav={false}>
      <TopBar title="Privacy Policy" subtitle="Last updated 2 September 2026" back="/welcome" />
      <main className="px-5 pb-12 pt-4">
        <p className="text-[13px] leading-relaxed text-text2">
          Short version: your public profile is public, everything else is not, and you can leave
          with your data at any time.
        </p>
        <div className="mt-6 space-y-4">
          {sections.map((s) => (
            <section key={s.title} className="rounded-3xl border border-border bg-card p-4">
              <h2 className="text-[14px] font-semibold">{s.title}</h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-text2">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
    </Screen>
  );
}
