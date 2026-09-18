import { useEffect, useState } from "react";
import type { UserIdentity } from "@supabase/supabase-js";
import { ChevronRight, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Btn, Sheet } from "@/components/ml/ui";
import { supabase } from "@/integrations/supabase/client";
import { iconSize } from "@/lib/tokens";

/*
 * Sign-in methods: what this account can sign in with, and — once there's more than one — a way
 * to remove one. Supabase refuses to unlink an account's last identity, so nothing here offers
 * that either; the account always keeps at least one way in.
 *
 * Google and LinkedIn are sign-in only right now (owner, 18 Sep 2026: they will need this too).
 * Adding a way to link a new provider from here is separate work — Google goes through Lovable's
 * own OAuth proxy (src/integrations/lovable/index.ts), not Supabase's own provider flow, and that
 * proxy has no linkIdentity equivalent yet.
 */

const providerLabel: Record<string, string> = {
  email: "Email & password",
  google: "Google",
  linkedin_oidc: "LinkedIn",
  apple: "Apple",
  phone: "Phone",
};

function labelFor(provider: string) {
  return providerLabel[provider] ?? provider;
}

export function SignInMethodsRow() {
  const [identities, setIdentities] = useState<UserIdentity[] | null>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth
      .getUserIdentities()
      .then(({ data }) => setIdentities(data?.identities ?? []))
      .catch(() => setIdentities([]));
  }, []);

  const count = identities?.length ?? 0;
  const hint =
    identities === null ? "Checking…" : identities.map((i) => labelFor(i.provider)).join(", ");

  async function remove(identity: UserIdentity) {
    setBusyId(identity.identity_id);
    try {
      const { error } = await supabase.auth.unlinkIdentity(identity);
      if (error) throw error;
      setIdentities((prev) => (prev ?? []).filter((i) => i.identity_id !== identity.identity_id));
      toast.success(`${labelFor(identity.provider)} removed`);
    } catch {
      toast.error("Couldn't remove that. Try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="state-layer flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex h-10 w-7 shrink-0 items-center justify-center">
          <KeyRound size={24} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2 font-semibold">Sign-in methods</span>
          <span className="block truncate text-1 text-muted-foreground">{hint}</span>
        </span>
        <ChevronRight size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Sign-in methods">
        <div className="space-y-2">
          {(identities ?? []).map((identity) => (
            <div
              key={identity.identity_id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{labelFor(identity.provider)}</span>
                {identity.identity_data?.["email"] ? (
                  <span className="block truncate text-1 text-muted-foreground">
                    {String(identity.identity_data["email"])}
                  </span>
                ) : null}
              </span>
              {count > 1 ? (
                <Btn
                  variant="outline"
                  className="shrink-0"
                  loading={busyId === identity.identity_id}
                  onClick={() => void remove(identity)}
                >
                  Remove
                </Btn>
              ) : null}
            </div>
          ))}
          {count <= 1 ? (
            <p className="pt-1 text-1 text-muted-foreground">
              This is your only way to sign in, so it can't be removed. Add another method first.
            </p>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
