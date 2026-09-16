import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";

import {
  AuthLink,
  AuthNotice,
  AuthScreen,
  Brand,
  GoogleIcon,
  LegalNote,
} from "@/components/ml/auth";
import { Btn } from "@/components/ml/ui";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { showDemoControls } from "@/lib/dev";
import { beat, useArrival } from "@/lib/flow-motion";
import { roleIcon } from "@/lib/role-icons";
import { useTaxonomy } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

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

/**
 * What is on the platform, not how much of it.
 *
 * The comp carried "12,000+ Musicians / 3,500+ Studios / 800+ Labels & Agencies".
 * Those figures were transcribed from a design mockup and nothing in the database
 * supports them, so they are not shipped: they would be an unsubstantiated claim
 * made to real users on the first screen they see.
 *
 * If real counts land, this is where they go — add a `value` and the render can
 * put it back in a bold span ahead of the label.
 */
const audience = [
  "Singers, session musicians and producers",
  "Recording studios and rehearsal rooms",
  "Labels, agencies and venues",
];

/**
 * Who is on MusicLinkd, as it moves: every published role from the taxonomy as a pill with its
 * icon, in three rows (performers, makers, businesses) drifting at different speeds; the edges fade. The roles come from the
 * database, so the ticker is never a claim the product can't back. Until they load, the two rows
 * hold their height; if they fail to load, the rows stay empty and the headline carries the screen.
 */
function RoleTicker({ className, style }: { className?: string; style?: CSSProperties }) {
  const { options } = useTaxonomy();
  const roles = (options?.person_types ?? []).filter((o) => o.slug !== "other");
  const inGroups = (groups: string[]) =>
    roles.filter((o) => groups.includes(o.metadata?.group ?? ""));
  // Three rows at slightly different speeds and alternating directions, so they never move in step.
  const rows = [
    { key: "performers", items: inGroups(["vocal", "instrumentalist"]), reverse: false, secs: 64 },
    {
      key: "makers",
      items: inGroups(["creator", "technical", "media", "education"]),
      reverse: true,
      secs: 76,
    },
    { key: "business", items: inGroups(["business"]), reverse: false, secs: 58 },
  ];
  return (
    <div
      aria-hidden
      className={cn(
        "space-y-2.5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
        className,
      )}
      style={style}
    >
      {rows.map((row) => (
        // On short phones the middle row steps out, so the buttons stay above the fold.
        <div
          key={row.key}
          className={cn(
            "h-10 overflow-hidden",
            row.key === "makers" && "[@media(max-height:780px)]:hidden",
          )}
        >
          {row.items.length ? (
            <div
              className={cn(
                "flex w-max animate-marquee gap-2",
                row.reverse && "[animation-direction:reverse]",
              )}
              // computed: each row's own loop length
              style={{ animationDuration: `${row.secs}s` }}
            >
              {/* Two copies, so the loop joins without a seam. */}
              {[...row.items, ...row.items].map((o, i) => {
                const Icon = roleIcon(o);
                return (
                  <span
                    key={`${o.slug}-${i}`}
                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-subtle pl-3 pr-4 text-sm font-medium text-foreground"
                  >
                    <Icon size={16} strokeWidth={1.75} className="text-muted-foreground" />
                    {o.label}
                  </span>
                );
              })}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function WelcomeScreen() {
  const { signedIn, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(false);
  const arrive = useArrival("welcome");
  const rise = arrive ? "animate-rise" : "";

  useEffect(() => {
    if (!loading && signedIn) void navigate({ to: "/", replace: true });
  }, [loading, signedIn, navigate]);

  async function google() {
    // Local dev server: Google can't return to localhost, so continue as a new test account
    // (/dev/new-user), which lands where a Google sign-up would. Production builds use Google.
    if (showDemoControls) {
      void navigate({ to: "/dev/new-user" });
      return;
    }
    setBusy(true);
    setGoogleFailed(false);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      setGoogleFailed(true);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/", replace: true });
  }

  return (
    <AuthScreen brand={false} className="bg-card">
      <div className="flex min-h-[calc(100dvh-72px)] flex-col">
        {/* The splash mark glides here (view transition "brand"), so it does not play again. */}
        <Brand compact className="vt-brand pt-2" />

        {/* The hero sits centred between the mark and the buttons on any phone height. */}
        <div className="flex flex-1 flex-col justify-center py-6">
          <p className={cn("text-sm font-semibold text-pink-strong", rise)} style={beat(1)}>
            Professional network for music
          </p>

          {/* The headline lands a word per beat. */}
          <h1 className="mt-3 text-4 font-bold">
            {["Connect.", "Collaborate.", "Create."].map((word, i) => (
              <span key={word} className={cn("block", rise)} style={beat(2 + i)}>
                {word}
              </span>
            ))}
          </h1>

          <p
            className={cn("mt-5 text-2 leading-relaxed text-muted-foreground", rise)}
            style={beat(5)}
          >
            Build your profile, discover opportunities, connect with the music industry.
          </p>

          {/* Screen readers get the three lines; the ticker below is the visual version. */}
          <ul className="sr-only">
            {audience.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          <RoleTicker className={cn("-mx-5 mt-9", rise)} style={beat(6)} />
        </div>

        {/*
         * Welcome is the sign-in screen: Google, or Sign in (mobile with a code, email on the next
         * screen). New and returning people take the same way in; a new account is made on sign-in.
         */}
        <div className={cn("space-y-3", rise)} style={beat(7.5)}>
          {googleFailed ? (
            <AuthNotice title="Google sign-in didn't finish">
              Try again, or sign in with your mobile number.
            </AuthNotice>
          ) : null}
          <Btn
            variant="outline"
            className="w-full"
            icon={<GoogleIcon />}
            loading={busy}
            onClick={() => void google()}
          >
            Continue with Google
          </Btn>
          <Btn className="w-full" onClick={() => void navigate({ to: "/auth/phone" })}>
            Sign In
          </Btn>

          <LegalNote />

          {showDemoControls ? (
            <p className="text-center text-1">
              <AuthLink to="/dev/new-user" className="text-muted-foreground">
                Dev: Test as a new user
              </AuthLink>
            </p>
          ) : null}
        </div>
      </div>
    </AuthScreen>
  );
}
