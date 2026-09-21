import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/*
 * The accounts signed in on this device, so one person can hold a talent account and a business
 * account and switch between them without signing out (owner, 21 Sep 2026: an account switcher
 * rather than two profiles on one sign-in). Each account keeps its own sign-in; switching hands
 * the app that account's saved session. Kept in this browser only, like the session itself.
 * Every read and write is guarded: a private window must not take a screen down with it.
 */

export type SavedAccount = {
  userId: string;
  email: string | null;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  kind: "talent" | "business" | null;
  accessToken: string;
  refreshToken: string;
  /** When this account was last the one in use. */
  usedAt: string;
};

const KEY = "ml.saved-accounts";
const CHANGED = "ml:saved-accounts";
const LIMIT = 5;

/** The saved accounts, kept current as sessions are remembered or accounts removed. */
export function useSavedAccounts(): SavedAccount[] {
  const [list, setList] = useState<SavedAccount[]>([]);
  useEffect(() => {
    const read = () => setList(readAccounts());
    read();
    window.addEventListener(CHANGED, read);
    return () => window.removeEventListener(CHANGED, read);
  }, []);
  return list;
}

export function readAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list)
      ? (list as SavedAccount[])
          .filter((a) => a && typeof a.userId === "string" && typeof a.refreshToken === "string")
          .sort((a, b) => (a.usedAt < b.usedAt ? 1 : -1))
      : [];
  } catch {
    return [];
  }
}

function write(list: SavedAccount[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, LIMIT)));
    window.dispatchEvent(new Event(CHANGED));
  } catch {
    // Switching just won't offer this account; signing in still works.
  }
}

/** Keep the current session's tokens (they change on every refresh) and what the list shows. */
export function rememberSession(
  session: Session,
  details?: Partial<Pick<SavedAccount, "username" | "name" | "avatarUrl" | "kind">>,
) {
  const list = readAccounts();
  const before = list.find((a) => a.userId === session.user.id);
  const next: SavedAccount = {
    userId: session.user.id,
    email: session.user.email ?? before?.email ?? null,
    username: details?.username ?? before?.username ?? null,
    name: details?.name ?? before?.name ?? null,
    avatarUrl: details?.avatarUrl ?? before?.avatarUrl ?? null,
    kind: details?.kind ?? before?.kind ?? null,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    usedAt: new Date().toISOString(),
  };
  write([next, ...list.filter((a) => a.userId !== next.userId)]);
}

export function forgetAccount(userId: string) {
  write(readAccounts().filter((a) => a.userId !== userId));
}

/**
 * Make a saved account the one in use. Its saved sign-in is exchanged for a fresh one; if it has
 * expired or was signed out elsewhere, the account is dropped from the list and this throws, so the
 * screen can send the person to sign in again.
 */
export async function switchTo(userId: string) {
  const target = readAccounts().find((a) => a.userId === userId);
  if (!target) throw new Error("That account isn't saved on this device.");
  const { data, error } = await supabase.auth.setSession({
    access_token: target.accessToken,
    refresh_token: target.refreshToken,
  });
  if (error || !data.session) {
    forgetAccount(userId);
    throw new Error("That account needs you to sign in again.");
  }
  rememberSession(data.session);
}

/**
 * Sign in to another account while keeping this one saved. The current session is set aside on
 * this device only (not signed out on the server, so its saved sign-in keeps working), then the
 * sign-in screen opens.
 */
export function addAnotherAccount() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (/^sb-.+-auth-token$/.test(key)) localStorage.removeItem(key);
    }
  } catch {
    // Nothing to clear.
  }
  window.location.assign("/welcome");
}
