import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { Screen, TopBar } from "@/components/ml/ui";
import { Loading } from "@/components/ml/kit";
import { finishSpotifyConnect } from "@/lib/spotify.functions";

// Spotify's OAuth redirect lands here with ?code&state, or ?error when the person cancels.
export const Route = createFileRoute("/settings/spotify")({
  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
    error: z.string().optional(),
  }),
  head: () => ({ meta: [{ title: "Connecting Spotify | MusicLinkd" }] }),
  component: SpotifyCallback,
});

function SpotifyCallback() {
  const { code, state, error } = Route.useSearch();
  const finish = useServerFn(finishSpotifyConnect);
  const navigate = useNavigate();
  const ran = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (error || !code || !state) {
      void navigate({ to: "/settings", replace: true });
      return;
    }
    finish({ data: { code, state } })
      .then(() => {
        toast.success("Spotify connected");
        void navigate({ to: "/settings", replace: true });
      })
      .catch(() => setFailed(true));
  }, [code, state, error, finish, navigate]);

  return (
    <Screen>
      <TopBar title="Spotify" back="/settings" />
      <div className="px-5 pt-10">
        {failed ? (
          <p className="text-center text-sm text-muted-foreground">
            Could not connect Spotify. Go back and try again.
          </p>
        ) : (
          <Loading />
        )}
      </div>
    </Screen>
  );
}
