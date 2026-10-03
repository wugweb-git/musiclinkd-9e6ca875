import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { LogoMark } from "@/components/ml/logo";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile, syncIdentityFromProvider } from "@/lib/portfolio.functions";
import { postAuthTarget } from "@/lib/post-auth";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

// App start. The session lives in the browser, so the server renders the splash and the client
// routes: a saved sign-in with a profile row goes straight to Discover (an unfinished profile is
// resumed from inside the app, not forced here); a brand-new sign-in with no row yet goes to
// onboarding; everyone else goes to Welcome. Every sign-in path (password, Google, email link,
// phone) returns here. On Android the native splash covers this screen.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MusicLinkd" },
      {
        name: "description",
        content: "India's professional network for the music industry.",
      },
      { property: "og:title", content: "MusicLinkd — Music industry network" },
      {
        property: "og:description",
        content: "Connect with music people and discover work across India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SessionCheck,
});

/** The longest the splash stays, counted from when the app opened. */
const PROFILE_WAIT_MS = 5000;
/** An account this new, with no profile answer, is treated as a signup. */
const NEW_ACCOUNT_MS = 10 * 60_000;

function SessionCheck() {
  const { signedIn, loading, user } = useAuth();
  const navigate = useNavigate();
  const loadProfile = useServerFn(getMyProfile);
  const syncIdentity = useServerFn(syncIdentityFromProvider);
  const mountedAt = useRef(Date.now());
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (loading) return;
    let active = true;
    // Hold for the mark's entrance, never past 2 seconds (owner, 16 Sep); a slow session read is
    // not held further.
    const hold = reducedMotion
      ? 0
      : Math.min(2000, Math.max(0, 900 - (Date.now() - mountedAt.current)));
    const go = (to: "/welcome" | "/discover" | ReturnType<typeof postAuthTarget>) =>
      window.setTimeout(() => {
        if (active) void navigate({ to, replace: true });
      }, hold);
    if (!signedIn) {
      go("/welcome");
      return () => {
        active = false;
      };
    }
    // Google gives a name and photo; the signup trigger only captures them for a brand-new user,
    // so every sign-in fills whichever of the two is still empty before the profile is read.
    // The profile read decides between onboarding and Discover, but it never holds the splash
    // past PROFILE_WAIT_MS from the moment the app opened, the session read included.
    const left = Math.max(0, PROFILE_WAIT_MS - (Date.now() - mountedAt.current));
    const timeout = new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error("Profile read timed out")), left),
    );
    // Unanswered, a sign-in made in the last few minutes is a signup and goes to onboarding, which
    // the saved session can tell without the network; anyone else goes to Discover.
    const createdAt = user?.created_at ? new Date(user.created_at).getTime() : 0;
    const fallback = Date.now() - createdAt < NEW_ACCOUNT_MS ? "/onboarding" : "/discover";
    Promise.race([
      syncIdentity()
        .catch(() => null)
        .then(() => loadProfile()),
      timeout,
    ])
      // A row-less read routes to onboarding, so it has to be trusted — but a returning user's
      // row always exists; a null here on the first try is as likely to be the auth session still
      // settling as it is a genuinely new signup. One retry tells them apart without a real user
      // ever seeing the onboarding chooser they'd already finished.
      .then((profile) => (profile ? profile : Promise.race([loadProfile(), timeout])))
      .then((profile) => go(postAuthTarget(profile)))
      // Offline, slow or a failed read.
      .catch(() => go(fallback));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `user` is read once, when routing
  }, [loading, signedIn, navigate, loadProfile, syncIdentity, reducedMotion]);

  return (
    /*
     * The splash, on ink rather than the pink ground (owner mockup, 29 Sep 2026).
     *
     * A wall of stage lights behind the mark, each column breathing on its own offset, so the
     * screen reads as a room being lit rather than a progress spinner. All CSS — no photograph,
     * nothing to download — which matters here more than anywhere else, because this screen is
     * showing *while* the app waits on the network.
     */
    <div
      className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-ink px-8"
      role="status"
      aria-label="Checking your session"
    >
      {/* One soft pool of stage light behind the mark: calm, nothing to download. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[38%] h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-3xl animate-breathe" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="relative flex items-center justify-center">
          <LogoMark className="vt-brand relative z-10 w-24 overflow-hidden rounded-3xl animate-splash-mark shadow-2xl" />
        </div>

        <h1 className="mt-5 text-3 font-semibold text-ink-foreground">MusicLinkd</h1>

        <p className="mt-2 text-sm text-ink-foreground/70">
          Connect. Collaborate. <span className="text-brand">Create.</span>
        </p>
      </div>

      {/* The session check, as a bar that travels rather than a spinner. */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <span aria-hidden className="h-1 w-32 overflow-hidden rounded-full bg-ink-foreground/15">
          <span className="block h-full w-1/3 rounded-full bg-brand animate-loadbar" />
        </span>
        {/* The one tracking exception (token decision 2): an all-caps label, letter-spaced so the
            capitals stay legible at this size. Everything else sets at normal tracking. */}
        <p className="text-1 font-semibold uppercase tracking-[0.22em] text-ink-foreground/45">
          A network for music people
        </p>
      </div>
    </div>
  );
}
