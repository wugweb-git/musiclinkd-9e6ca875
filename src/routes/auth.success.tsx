import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PartyPopper } from "lucide-react";
import { Btn } from "@/components/ml/ui";
import { AuthHeading, AuthScreen, AuthTextButton, TrustNote } from "@/components/ml/auth";

export const Route = createFileRoute("/auth/success")({
  head: () => ({
    meta: [
      { title: "Account created — MusicLinkd" },
      {
        name: "description",
        content: "Your MusicLinkd account is ready. Set up your professional profile next.",
      },
      { property: "og:title", content: "Account created — MusicLinkd" },
      { property: "og:description", content: "Welcome to MusicLinkd. Let's build your profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthSuccess,
});

function AuthSuccess() {
  const navigate = useNavigate();
  return (
    <AuthScreen>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-md bg-subtle">
        <PartyPopper size={24} className="animate-pop text-primary" />
      </div>
      <AuthHeading
        title="You're in"
        sub="Next: tell us what you do so the right people, gigs and studios can find you. Takes about 3 minutes."
      />

      <div className="mb-7 rounded-lg border border-border bg-card p-4">
        <p className="text-1 font-semibold">What happens next</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-1 leading-relaxed text-muted-foreground">
          <li>Choose your roles and city</li>
          <li>Add a photo, headline and skills</li>
          <li>Upload one piece of work — that's what gets you hired</li>
        </ol>
      </div>

      <div className="space-y-3">
        <Btn className="w-full" onClick={() => void navigate({ to: "/onboarding" })}>
          Set up my profile
        </Btn>
        <p className="flex justify-center pt-1 text-sm">
          <AuthTextButton
            className="text-muted-foreground"
            onClick={() => void navigate({ to: "/feed" })}
          >
            Skip for now
          </AuthTextButton>
        </p>
      </div>

      <TrustNote>You can change every answer later from your profile.</TrustNote>
    </AuthScreen>
  );
}
