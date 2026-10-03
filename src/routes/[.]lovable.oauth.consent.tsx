import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Btn } from "@/components/ml/ui";
import { AuthComposition, AuthFooter, AuthHeading, AuthNotice, AuthScreen, AuthSurface } from "@/components/ml/auth";
import { rememberOAuthReturn } from "@/lib/oauth-return";

/** What the authorization endpoints return, to the extent this screen reads it. */
type OAuthAuthorization = {
  client?: { name?: string } | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
} | null;

type OAuthResult = Promise<{ data: OAuthAuthorization; error: { message: string } | null }>;

type OAuthApi = {
  getAuthorizationDetails: (id: string) => OAuthResult;
  approveAuthorization: (id: string) => OAuthResult;
  denyAuthorization: (id: string) => OAuthResult;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Connect an app — MusicLinkd" },
      { name: "description", content: "Approve an AI assistant to use MusicLinkd as you." },
      { property: "og:title", content: "Connect an app — MusicLinkd" },
      { property: "og:description", content: "Approve an app to access your MusicLinkd account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id)
      throw new Error("This link is missing its authorization request.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      rememberOAuthReturn(location.pathname + location.searchStr);
      throw redirect({ to: "/welcome" });
    }
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data as { client?: { name?: string } } | null;
  },
  component: Consent,
  errorComponent: () => (
    <AuthScreen back={{ to: "/welcome" }}>
      <AuthComposition footer={<AuthFooter />}><AuthSurface>
        <AuthHeading title="Connection unavailable" sub="We could not verify this app's request." />
        <AuthNotice title="This request couldn't be loaded">
          Start the connection again from the requesting app, or try loading this request once more.
        </AuthNotice>
        <Btn className="w-full" onClick={() => window.location.reload()}>Try again</Btn>
      </AuthSurface></AuthComposition>
    </AuthScreen>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState<"approve" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? "An app";

  async function decide(approve: boolean) {
    setBusy(approve ? "approve" : "deny");
    setError(null);
    const { data, error: err } = approve
      ? await oauth().approveAuthorization(authorization_id)
      : await oauth().denyAuthorization(authorization_id);
    const target = data?.redirect_url ?? data?.redirect_to;
    if (err || !target) {
      setBusy(null);
      setError("The app connection could not be completed. Try again or deny access.");
      return;
    }
    window.location.href = target;
  }

  return (
    <AuthScreen back={{ to: "/profile" }}>
      <AuthComposition footer={<AuthFooter />}><AuthSurface>
        <p className="mb-2 text-1 font-semibold text-muted-foreground">App connection</p>
        <AuthHeading title={`${name} wants to connect`} sub="Review what this app can access before you continue." />
        <section className="mb-5 rounded-sm bg-subtle p-4"><p className="text-sm font-semibold">Requested access</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground"><li>Read your public profile</li><li>Read your portfolio</li></ul></section>
        {error ? <AuthNotice title="That didn't go through">{error}</AuthNotice> : null}
        <Btn
          className="w-full"
          loading={busy === "approve"}
          disabled={busy !== null}
          onClick={() => void decide(true)}
        >
          Allow access
        </Btn>
        <Btn
          className="w-full"
          variant="outline"
          loading={busy === "deny"}
          disabled={busy !== null}
          onClick={() => void decide(false)}
        >
          Deny access
        </Btn>
        <p className="mt-4 text-1 leading-relaxed text-muted-foreground">MusicLinkd will never share your password. You can remove this connection later.</p>
      </AuthSurface></AuthComposition>
    </AuthScreen>
  );
}
