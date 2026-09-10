import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthScreen, TrustNote } from "@/components/ml/auth";
import { supabase } from "@/integrations/supabase/client";

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
    await supabase.auth.signOut();
    setBusy(false);
    void navigate({ to: "/welcome" });
  }

  return (
    <AuthScreen>
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl"
        style={{ background: "var(--pink-container)" }}
      >
        <LogOut size={22} className="text-primary" />
      </div>
      <AuthHeading
        title="Sign out of MusicLinkd?"
        sub="Your profile, portfolio and bookings stay exactly as they are. You'll just need to sign in again on this device."
      />
      <div className="space-y-3">
        <Btn className="w-full" onClick={() => void signOut()} disabled={busy}>
          {busy ? "Signing out…" : "Yes, sign out"}
        </Btn>
        <Btn variant="outline" className="w-full" onClick={() => void navigate({ to: "/me" })}>
          Stay signed in
        </Btn>
      </div>
      <TrustNote>
        Using a shared device? Signing out also clears saved drafts on this browser.
      </TrustNote>
    </AuthScreen>
  );
}
