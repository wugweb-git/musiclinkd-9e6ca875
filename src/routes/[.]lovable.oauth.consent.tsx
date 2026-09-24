import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { AuthNotice } from "@/components/ml/auth";
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
      throw redirect({ to: "/auth/phone" });
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
  errorComponent: ({ error }) => (
    <Screen>
      <TopBar title="Connect an app" />
      <div className="px-5 pt-4">
        <AuthNotice title="This request couldn't be loaded">
          {String((error as Error)?.message ?? error)} Start the connection again from the app.
        </AuthNotice>
      </div>
    </Screen>
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
      setError(err?.message ?? "No redirect came back. Try again.");
      return;
    }
    window.location.href = target;
  }

  return (
    <Screen>
      <TopBar title="Connect an app" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <h1 className="text-3 font-semibold">{name} wants to use MusicLinkd as you</h1>
        <p className="text-sm text-muted-foreground">
          It will be able to read your profile and portfolio. You can remove access any time by
          signing out of the connection in that app.
        </p>
        {error ? <AuthNotice title="That didn't go through">{error}</AuthNotice> : null}
        <Btn
          className="w-full"
          loading={busy === "approve"}
          disabled={busy !== null}
          onClick={() => void decide(true)}
        >
          Approve
        </Btn>
        <Btn
          className="w-full"
          variant="outline"
          loading={busy === "deny"}
          disabled={busy !== null}
          onClick={() => void decide(false)}
        >
          Deny
        </Btn>
      </div>
    </Screen>
  );
}
