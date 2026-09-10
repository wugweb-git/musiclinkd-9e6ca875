import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Btn } from "@/components/ml/ui";
import { AuthScreen, Brand, LegalNote, TrustNote } from "@/components/ml/auth";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to MusicLinkd — India's music industry network" },
      {
        name: "description",
        content:
          "Join MusicLinkd to showcase your work, find collaborators, book studios and hire music professionals across India.",
      },
      { property: "og:title", content: "Welcome to MusicLinkd" },
      {
        property: "og:description",
        content: "The professional network and marketplace for India's music industry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WelcomeScreen,
});

const proofPoints = [
  {
    title: "Show the work, not a CV",
    body: "Tracks, credits and clips in one professional profile.",
  },
  { title: "Get found for real jobs", body: "Sessions, gigs, studio time and label briefs." },
  { title: "Book with confidence", body: "Verified people, clear rates, real availability." },
];

function WelcomeScreen() {
  const { signedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/feed" });
  }, [loading, signedIn, navigate]);

  return (
    <AuthScreen brand={false}>
      <div className="flex min-h-[calc(100dvh-72px)] flex-col">
        <Brand />

        <div className="flex-1">
          <h1 className="text-[32px] font-semibold leading-[1.12] tracking-tight">
            India's music industry,
            <br />
            in one place.
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-text2">
            Singers, producers, engineers, studios and labels — connect, collaborate and get booked.
          </p>

          <ul className="mt-7 space-y-3">
            {proofPoints.map((p, i) => (
              <li key={p.title} className="flex gap-3 rounded-3xl border border-border bg-card p-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-primary"
                  style={{ background: "var(--pink-container)" }}
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">{p.title}</span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-text2">
                    {p.body}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 space-y-3">
          <Btn
            className="w-full"
            onClick={() => void navigate({ to: "/auth", search: { mode: "signup" } })}
          >
            Create your account
          </Btn>
          <Btn
            variant="outline"
            className="w-full"
            onClick={() => void navigate({ to: "/auth", search: { mode: "signin" } })}
          >
            I already have an account
          </Btn>
          <Link
            to="/"
            className="block py-2 text-center text-[13px] font-semibold text-muted-foreground"
          >
            Look around first
          </Link>
          <TrustNote>Free to join. Your work stays yours — you choose what is public.</TrustNote>
          <LegalNote />
        </div>
      </div>
    </AuthScreen>
  );
}
