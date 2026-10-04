import { supabase } from "@/integrations/supabase/client";

/*
 * Remember me, on the login screen only (owner, 4 Oct 2026). Checked — the default — keeps today's
 * behaviour: the session persists and the account joins "Continue as". Unchecked, the sign-in lasts
 * until the browser or app is closed.
 *
 * The Supabase client (src/integrations/supabase/client.ts) is generated and always persists the
 * session, so an unchecked sign-in is marked instead: a flag in localStorage, and a marker in
 * sessionStorage, which the browser clears when it closes. Opening the app with the flag but no
 * marker means it was closed since, and the session is signed out on this device before anything
 * reads it.
 */
const FORGET_KEY = "ml:forget-on-close";
const ALIVE_KEY = "ml:session-alive";
// Tabs opened on their own (typed URL, bookmark) have a fresh sessionStorage. Every open tab with
// the marker refreshes this shared timestamp, so a new tab can tell "another tab is open" apart
// from "the browser was closed".
const BEAT_KEY = "ml:session-beat";
const BEAT_MS = 5_000;
let beating = false;

/*
 * Background tabs run timers about once a minute after a few minutes hidden, so the heartbeat can
 * look stale while a tab is still open. A new tab therefore also asks: every tab holding the marker
 * answers on this channel (messages still reach throttled tabs), and only silence means closed.
 */
const CHANNEL = "ml-session";
const ASK_MS = 300;
let answering = false;

function startAnswering() {
  if (answering || typeof BroadcastChannel === "undefined") return;
  answering = true;
  const channel = new BroadcastChannel(CHANNEL);
  channel.onmessage = (e: MessageEvent) => {
    if (e.data === "alive?" && sessionStorage.getItem(ALIVE_KEY) === "1") {
      channel.postMessage("alive");
    }
  };
}

function anotherTabAnswers(): Promise<boolean> {
  if (typeof BroadcastChannel === "undefined") return Promise.resolve(false);
  return new Promise((resolve) => {
    const channel = new BroadcastChannel(CHANNEL);
    const done = (alive: boolean) => {
      channel.close();
      resolve(alive);
    };
    const timer = window.setTimeout(() => done(false), ASK_MS);
    channel.onmessage = (e: MessageEvent) => {
      if (e.data === "alive") {
        window.clearTimeout(timer);
        done(true);
      }
    };
    channel.postMessage("alive?");
  });
}

function startHeartbeat() {
  startAnswering();
  if (beating || typeof window === "undefined") return;
  beating = true;
  const beat = () => {
    try {
      if (sessionStorage.getItem(ALIVE_KEY) === "1")
        localStorage.setItem(BEAT_KEY, String(Date.now()));
    } catch {
      // Storage blocked: nothing to keep alive.
    }
  };
  beat();
  window.setInterval(beat, BEAT_MS);
}

export function setRememberMe(remember: boolean) {
  try {
    if (remember) {
      localStorage.removeItem(FORGET_KEY);
      sessionStorage.removeItem(ALIVE_KEY);
    } else {
      localStorage.setItem(FORGET_KEY, "1");
      sessionStorage.setItem(ALIVE_KEY, "1");
      startHeartbeat();
    }
  } catch {
    // Storage blocked: the sign-in simply persists, as it did before this option existed.
  }
}

/** This sign-in should not be kept: no "Continue as" entry for it. */
export function forgetsOnClose(): boolean {
  try {
    return localStorage.getItem(FORGET_KEY) === "1";
  } catch {
    return false;
  }
}

/** Signs out a "don't remember me" session left from before the browser or app was closed. */
export async function endSessionIfClosed(): Promise<void> {
  try {
    if (!forgetsOnClose()) return;
    const beat = Number(localStorage.getItem(BEAT_KEY) ?? 0);
    if (sessionStorage.getItem(ALIVE_KEY) !== "1" && Date.now() - beat < BEAT_MS * 3) {
      sessionStorage.setItem(ALIVE_KEY, "1"); // another tab is still open: join it
    }
    if (sessionStorage.getItem(ALIVE_KEY) !== "1" && (await anotherTabAnswers())) {
      sessionStorage.setItem(ALIVE_KEY, "1"); // a background tab answered: join it
    }
    if (sessionStorage.getItem(ALIVE_KEY) === "1") {
      startHeartbeat();
      return;
    }
    localStorage.removeItem(FORGET_KEY);
    localStorage.removeItem(BEAT_KEY);
  } catch {
    return;
  }
  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
}
