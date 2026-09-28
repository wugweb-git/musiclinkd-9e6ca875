/*
 * A stand-in for @supabase/realtime-js.
 *
 * The app does not use realtime — `grep -rn "\.channel(\|postgres_changes" src` finds nothing, and
 * the 280 server functions do the data work server-side — but `createClient` constructs a
 * RealtimeClient unconditionally, so the whole websocket stack shipped on the critical path:
 * 55 KB gzip in `use-auth-*.js`, parsed before first paint, on a connection that is also fetching
 * the server-rendered page. `vite.config.ts` aliases the package here instead.
 *
 * supabase-js talks to this object on its own — it calls `setAuth` whenever the session changes,
 * and `removeAllChannels`/`disconnect` on teardown — so those are real no-ops. Anything that would
 * actually open a socket throws, so if realtime is ever genuinely wanted the alias fails loudly
 * here rather than going quiet in production.
 */
const unsupported = (name: string) => () => {
  throw new Error(
    `Supabase realtime is not bundled (${name}). Remove the @supabase/realtime-js alias in ` +
      `vite.config.ts to use it, and expect ~55 KB gzip back on the critical path.`,
  );
};

export class RealtimeClient {
  // supabase-js reads these; it never inspects them beyond truthiness.
  accessToken: string | null = null;
  channels: never[] = [];

  /** Called by supabase-js on every auth state change. */
  setAuth(token?: string | null) {
    this.accessToken = token ?? null;
    return Promise.resolve();
  }

  getChannels() {
    return [];
  }

  removeAllChannels() {
    return Promise.resolve([]);
  }

  removeChannel() {
    return Promise.resolve("ok" as const);
  }

  disconnect() {}

  connect() {}

  channel = unsupported("channel()");
}

export class RealtimeChannel {
  constructor() {
    unsupported("RealtimeChannel")();
  }
}

export class RealtimePresence {
  constructor() {
    unsupported("RealtimePresence")();
  }
}

export const REALTIME_LISTEN_TYPES = {
  BROADCAST: "broadcast",
  PRESENCE: "presence",
  POSTGRES_CHANGES: "postgres_changes",
} as const;

export const REALTIME_SUBSCRIBE_STATES = {
  SUBSCRIBED: "SUBSCRIBED",
  TIMED_OUT: "TIMED_OUT",
  CLOSED: "CLOSED",
  CHANNEL_ERROR: "CHANNEL_ERROR",
} as const;

export const REALTIME_POSTGRES_CHANGES_LISTEN_EVENT = {
  ALL: "*",
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;

export const REALTIME_CHANNEL_STATES = {
  closed: "closed",
  errored: "errored",
  joined: "joined",
  joining: "joining",
  leaving: "leaving",
} as const;

export default RealtimeClient;
