import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Btn, Screen, TopBar } from "@/components/ml/ui";
import { AuthNotice } from "@/components/ml/auth";

export const Route = createFileRoute("/settings/delete-account")({
  head: () => ({
    meta: [
      { title: "Delete your account — MusicLinkd" },
      { name: "description", content: "Understand what happens to your profile, work and bookings before you delete your MusicLinkd account." },
      { property: "og:title", content: "Delete your account — MusicLinkd" },
      { property: "og:description", content: "What deletion removes, and what we must keep." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DeleteAccount,
});

const removed = [
  "Your public profile and username",
  "Portfolio tracks, credits and media",
  "Services, availability and listings",
  "Messages and connection history",
];

const kept = [
  "Records of completed bookings, for dispute and tax reasons",
  "Reviews you left, shown as “Former member”",
];

function DeleteAccount() {
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState("");

  return (
    <Screen bottomNav={false}>
      <TopBar title="Delete account" subtitle="This cannot be undone" back="/me" />
      <main className="px-5 pb-12 pt-4">
        <AuthNotice tone="warn" title="Consider deactivating instead">
          Hiding your profile keeps your work safe and you can come back any time.
        </AuthNotice>

        <section className="rounded-3xl border border-border bg-card p-4">
          <h2 className="text-[14px] font-semibold">Deleted permanently</h2>
          <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-text2">
            {removed.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-3xl border border-border bg-card p-4">
          <h2 className="text-[14px] font-semibold">Kept for legal reasons</h2>
          <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-text2">
            {kept.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </section>

        <label className="mt-6 block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            Type DELETE to confirm
          </span>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="DELETE"
            className="h-13 w-full rounded-2xl border border-border bg-card px-4 text-[15px] outline-none focus:border-primary"
          />
        </label>

        <div className="mt-6 space-y-3">
          <Btn
            className="w-full"
            variant="outline"
            disabled={confirm.trim().toUpperCase() !== "DELETE"}
            onClick={() =>
              toast.error("Account deletion is handled by support on this build. Contact us from Help.")
            }
          >
            Delete my account
          </Btn>
          <Btn className="w-full" onClick={() => void navigate({ to: "/me" })}>
            Keep my account
          </Btn>
        </div>
      </main>
    </Screen>
  );
}
