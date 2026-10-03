import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Music, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Btn, Sheet, useConfirm } from "@/components/ml/ui";
import {
  disconnectSpotify,
  getSpotifyStatus,
  startSpotifyConnect,
  type SpotifySharing,
  type SpotifyStatus,
} from "@/lib/spotify.functions";
import { iconSize } from "@/lib/tokens";

const sharingOptions: { value: SpotifySharing; label: string }[] = [
  { value: "connections", label: "All connections" },
  { value: "approved", label: "Only people I approve" },
];

/** Settings row for the Spotify connection: status, the sharing sheet, then Spotify's consent. */
export function SpotifyRow() {
  const status = useServerFn(getSpotifyStatus);
  const start = useServerFn(startSpotifyConnect);
  const disconnect = useServerFn(disconnectSpotify);
  const [state, setState] = useState<SpotifyStatus | null>(null);
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();
  const [sharing, setSharing] = useState<SpotifySharing>("connections");
  const [busy, setBusy] = useState(false);
  // A failed status read is an error with a retry, never "Not available yet".
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setFailed(false);
    void status()
      .then(setState)
      .catch(() => setFailed(true));
  }, [status, attempt]);

  const unavailable = !failed && (!state || state.state === "unavailable");
  const hint = failed
    ? "Couldn't load · tap to retry"
    : !state
      ? "Checking…"
      : state.state === "unavailable"
        ? "Not available yet"
        : state.state === "disconnected"
          ? "Not connected"
          : state.state === "revoked"
            ? "Access ended · reconnect"
            : `Connected${state.displayName ? ` as ${state.displayName}` : ""}`;

  const allow = async () => {
    setBusy(true);
    try {
      const { url } = await start({ data: { sharing } });
      window.location.assign(url);
    } catch {
      toast.error("Could not reach Spotify. Try again.");
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await disconnect();
      setState({ state: "disconnected" });
      setOpen(false);
    } catch {
      toast.error("Could not disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const Icon = state?.state === "revoked" ? RefreshCw : Music;

  return (
    <>
      {confirm.dialog}
      <button
        type="button"
        disabled={unavailable}
        onClick={() => (failed ? setAttempt((n) => n + 1) : setOpen(true))}
        className="state-layer flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:opacity-60"
      >
        <span className="flex h-10 w-7 shrink-0 items-center justify-center">
          <Icon
            key={state?.state}
            size={24}
            strokeWidth={1.75}
            className="animate-pop"
            aria-hidden
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-2 font-semibold">Spotify</span>
          <span className="block truncate text-1 text-muted-foreground">{hint}</span>
        </span>
        <ChevronRight size={iconSize.md} className="shrink-0 text-muted-foreground" aria-hidden />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Spotify">
        {state?.state === "connected" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{hint}</p>
            <Btn
              variant="outline"
              className="w-full"
              loading={busy}
              onClick={() =>
                confirm.ask({ title: "Disconnect Spotify?", confirmLabel: "Disconnect" }, remove)
              }
            >
              Disconnect
            </Btn>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Who can see your listening activity</p>
            <div
              role="radiogroup"
              aria-label="Who can see your listening activity"
              className="space-y-2"
            >
              {sharingOptions.map((o) => (
                <label
                  key={o.value}
                  className="flex items-center gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <input
                    type="radio"
                    name="spotify-sharing"
                    checked={sharing === o.value}
                    onChange={() => setSharing(o.value)}
                    className="h-4 w-4 accent-ink"
                  />
                  <span className="text-sm font-semibold">{o.label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Btn variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Not now
              </Btn>
              <Btn className="flex-1" loading={busy} onClick={() => void allow()}>
                Allow
              </Btn>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}
