import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthScreen, TrustNote } from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";
import { forgetAccount } from "@/lib/saved-accounts";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/auth/signout")({
  head: () => ({
    meta: [
      { title: "Sign out — MusicLinkd" },
      { name: "description", content: "Sign out of MusicLinkd on this device." },
      { property: "og:title", content: "Sign out — MusicLinkd" },
      { property: "og:description", content: "End your MusicLinkd session on this device." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignOutScreen,
});

function SignOutScreen() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    // Signed out means gone from this device's account list too.
    const { data } = await supabase.auth.getSession();
    if (data.session) forgetAccount(data.session.user.id);
    await supabase.auth.signOut();
    setBusy(false);
    void navigate({ to: "/welcome" });
  }

  return (
    <AuthScreen back={{ to: "/profile" }}>
      <div className="flex flex-1 min-h-0 flex-col justify-between overflow-hidden">
        <div className="my-auto py-1">
          <div className="rounded-lg bg-card p-4 sm:p-5 border border-border/80 shadow-xs">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-sm bg-subtle">
              <LogOut size={iconSize.md} className="text-ink" />
            </div>
            <AuthHeading
              title="Sign out of MusicLinkd?"
              sub="Your profile, portfolio and bookings stay exactly as they are. You'll just need to sign in again on this device."
            />
            <div className="space-y-2.5">
              <Btn className="w-full h-12 text-2 font-medium" onClick={() => void signOut()} disabled={busy}>
                {busy ? "Signing out…" : "Yes, sign out"}
              </Btn>
              <Btn
                variant="outline"
                className="w-full h-12 text-2 font-medium"
                onClick={() => void navigate({ to: "/profile" })}
              >
                Stay signed in
              </Btn>
            </div>
            <TrustNote>
              Using a shared device? Signing out also clears saved drafts on this browser.
            </TrustNote>
          </div>
        </div>
      </div>
    </AuthScreen>
  );
}
