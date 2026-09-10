import { createFileRoute } from "@tanstack/react-router";
import { Screen, TopBar } from "@/components/ml/ui";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — MusicLinkd" },
      {
        name: "description",
        content: "The rules for using MusicLinkd: your account, your work, bookings and conduct.",
      },
      { property: "og:title", content: "Terms of Use — MusicLinkd" },
      {
        property: "og:description",
        content: "Plain-language terms for the MusicLinkd network and marketplace.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

const sections = [
  {
    title: "Your account",
    body: "You must be 16 or older and give accurate details. You are responsible for what happens under your account, so keep your password private.",
  },
  {
    title: "Your work stays yours",
    body: "You keep ownership of every track, clip, image and credit you upload. You give MusicLinkd permission to display it on the surfaces you choose — profile, discovery, search and shared links.",
  },
  {
    title: "Professional conduct",
    body: "No impersonation, no claiming credits you did not earn, no harassment, no spam outreach. Verification exists to protect people who hire in good faith.",
  },
  {
    title: "Bookings and marketplace",
    body: "Agreements for sessions, studio time, rentals and services are between the people involved. MusicLinkd provides the tools, availability and records — not the contract itself.",
  },
  {
    title: "Ending your account",
    body: "You can delete your account at any time from settings. Public content disappears immediately; records tied to completed bookings may be retained for legal and dispute reasons.",
  },
];

function TermsPage() {
  return (
    <Screen bottomNav={false}>
      <TopBar title="Terms of Use" subtitle="Last updated 2 September 2026" back="/welcome" />
      <main className="px-5 pb-12 pt-4">
        <p className="text-[13px] leading-relaxed text-text2">
          Short version: be honest about your work, treat other professionals well, and you keep the
          rights to everything you create.
        </p>
        <div className="mt-6 space-y-4">
          {sections.map((s) => (
            <section key={s.title} className="rounded-3xl border border-border bg-card p-4">
              <h2 className="text-[14px] font-semibold">{s.title}</h2>
              <p className="mt-1.5 text-1 leading-relaxed text-text2">{s.body}</p>
            </section>
          ))}
        </div>
      </main>
    </Screen>
  );
}
