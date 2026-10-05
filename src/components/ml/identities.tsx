import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Btn, Sheet, useConfirm } from "@/components/ml/ui";
import {
  listMySignInMethods,
  removeMySignInMethod,
  type SignInMethod,
} from "@/lib/identities.functions";
import { iconSize } from "@/lib/tokens";

/*
 * Sign-in methods: what this account can sign in with, and — once there's more than one — a way
 * to remove one, read and removed server-side (src/lib/identities.functions.ts). Supabase refuses to unlink an account's last identity, so nothing here offers
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
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const load = useServerFn(listMySignInMethods);
  const unlink = useServerFn(removeMySignInMethod);
  // A failed read is its own state: it never reads as "no methods" or "your only method".
  const q = useQuery({ queryKey: ["sign-in-methods"], queryFn: () => load() });
  const identities = q.data ?? null;
  const failed = q.isError;
  const remove = useMutation({
    mutationFn: (m: SignInMethod) => unlink({ data: { id: m.id } }),
    onSuccess: async (_r, m) => {
      toast.success(`${labelFor(m.provider)} removed`);
      await queryClient.invalidateQueries({ queryKey: ["sign-in-methods"] });
    },
    onError: () => toast.error("Couldn't remove that. Try again."),
  });

  const count = identities?.length ?? 0;
  // Primary = the oldest method, the one the account was made with (owner's ref img 5).
  const primaryId =
    count > 1
      ? [...(identities ?? [])].sort((a, b) =>
          (a.createdAt ?? "").localeCompare(b.createdAt ?? ""),
        )[0]?.id
      : identities?.[0]?.id;
  const hint = failed
    ? "Couldn't load"
    : identities === null
      ? "Checking…"
      : identities.map((i) => labelFor(i.provider)).join(", ");

  return (
    <>
      {confirm.dialog}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="state-layer flex min-h-touch w-full items-center gap-3 px-2 py-2.5 text-left"
      >
        <span className="flex h-10 w-7 shrink-0 items-center justify-center">
          <KeyRound size={24} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2 font-medium">Sign-in methods</span>
          <span className="block truncate text-1 text-muted-foreground">{hint}</span>
        </span>
        <ChevronRight size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Sign-in methods">
        {failed ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Your sign-in methods didn't load.</p>
            <Btn variant="outline" className="w-full" onClick={() => void q.refetch()}>
              Try Again
            </Btn>
          </div>
        ) : identities === null ? (
          <p className="text-sm text-muted-foreground">Checking…</p>
        ) : (
          <div className="divide-y divide-border">
            {(identities ?? []).map((identity) => (
              <div key={identity.id} className="flex items-center justify-between gap-3 py-4">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-2 font-medium">
                    {labelFor(identity.provider)}
                    {/* Primary: the method the account was made with (owner's ref img 5). */}
                    {identity.id === primaryId ? (
                      <span className="pill bg-ink/5 text-muted-foreground">Primary</span>
                    ) : null}
                  </span>
                  {identity.email ? (
                    <span className="block truncate text-1 text-muted-foreground">
                      {identity.email}
                    </span>
                  ) : null}
                </span>
                {count > 1 ? (
                  <Btn
                    variant="outline"
                    className="shrink-0"
                    loading={remove.isPending && remove.variables?.id === identity.id}
                    onClick={() =>
                      confirm.ask(
                        { title: `Remove ${labelFor(identity.provider)}?`, confirmLabel: "Remove" },
                        () => remove.mutate(identity),
                      )
                    }
                  >
                    Remove
                  </Btn>
                ) : null}
              </div>
            ))}
            {count === 0 ? (
              <p className="pt-1 text-1 text-muted-foreground">
                No sign-in methods found for this account.
              </p>
            ) : count === 1 ? (
              <p className="pt-1 text-1 text-muted-foreground">
                This is your only way to sign in, so it can't be removed. Add another method first.
              </p>
            ) : null}
          </div>
        )}
      </Sheet>
    </>
  );
}
