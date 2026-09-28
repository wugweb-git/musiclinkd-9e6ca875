import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { AppNav } from "@/components/ml/ui";
import { startAnalytics, trackPageview } from "@/lib/analytics";
import { listenForAuthReturn } from "@/lib/native-auth";
import { startBackButton } from "@/lib/dismiss-stack";
import { useAuth } from "@/hooks/use-auth";
import { syncRecentlyViewed } from "@/lib/device-history";
import { useRememberAccounts } from "@/hooks/use-remember-accounts";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { toast } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4 font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-3 font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3 font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      // viewport-fit=cover: without it every env(safe-area-inset-*) in the app resolves to 0,
      // so the bottom nav and sticky headers sit under the notch and home indicator.
      // interactive-widget=resizes-content: when the Android keyboard opens, the layout viewport
      // shrinks, so fixed footers (Continue, Send code) ride above the keyboard instead of under it.
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content",
      },
      { title: "MusicLinkd — Discover Music Talent in India" },
      {
        name: "description",
        content:
          "India's professional network for the music industry. Discover singers, bands, studios, labels and venues.",
      },
      { name: "author", content: "MusicLinkd" },
      { name: "theme-color", content: "#ECECF1" },
      { property: "og:title", content: "MusicLinkd — Discover Music Talent in India" },
      {
        property: "og:description",
        content: "Discover singers, bands, studios, labels and venues across India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      // ICO first with an explicit size, so Chrome still prefers the SVG below.
      { rel: "icon", href: "/favicon.ico", sizes: "32x32" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { user } = useAuth();
  const userId = user?.id;
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  // Recently viewed follows the account: merge this device's list once a session is known.
  useEffect(() => {
    if (userId) void syncRecentlyViewed();
  }, [userId]);
  useRememberAccounts(userId);

  // Analytics only starts if this build has a measurement id and this device has said yes; both
  // checks live in startAnalytics, so nothing here decides anything. Every client route change
  // reports one page view, with the path stripped of anything naming a person.
  useEffect(() => {
    void startAnalytics().then(() => trackPageview(path));
  }, [path]);

  // The Android wrap signs in through a Chrome Custom Tab, so the session arrives as a deep link
  // rather than a page load. A no-op in a browser.
  useEffect(
    () =>
      listenForAuthReturn((ok, message) => {
        if (ok) void router.navigate({ to: "/", replace: true });
        else toast.error(message ?? "Sign-in didn't finish. Try again.");
      }),
    [router],
  );

  // Android's hardware back: close the top overlay, else go back, else exit. A no-op in a browser.
  useEffect(() => startBackButton(), []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <AppNav />
      <Toaster />
    </QueryClientProvider>
  );
}
