import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Laptop, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Loading } from "@/components/ml/kit";
import { securityRows } from "@/data/settings";
import { supabase } from "@/integrations/supabase/client";
import { listMySessions, revokeMySession } from "@/lib/security.functions";
import { iconSize } from "@/lib/tokens";

/** A short, honest label from a user-agent string — not a device model, just browser/OS words. */
function deviceLabel(ua: string | null) {
  if (!ua) return "Unknown device";
  const os = /android/i.test(ua)
    ? "Android"
    : /iphone|ipad/i.test(ua)
      ? "iOS"
      : /mac os/i.test(ua)
        ? "Mac"
        : /windows/i.test(ua)
          ? "Windows"
          : "Device";
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome/i.test(ua)
      ? "Chrome"
      : /firefox/i.test(ua)
        ? "Firefox"
        : /safari/i.test(ua)
          ? "Safari"
          : "Browser";
  return `${browser} on ${os}`;
}

export const Route = createFileRoute("/settings/security/")({
  head: () => ({
    meta: [
      { title: "Security | MusicLinkd" },
      {
        name: "description",
        content: "Password and the devices signed in to your account.",
      },
      { property: "og:title", content: "Security | MusicLinkd" },
      { property: "og:description", content: "Keep your MusicLinkd account safe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SecurityScreen,
});

function SecurityScreen() {
  const queryClient = useQueryClient();
  const load = useServerFn(listMySessions);
  const revoke = useServerFn(revokeMySession);
  const sessions = useQuery({ queryKey: ["security", "sessions"], queryFn: () => load() });

  const [endingAll, setEndingAll] = useState(false);
  async function logOutEverywhere() {
    setEndingAll(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      window.location.assign("/welcome");
    } catch {
      toast.error("Couldn't log out everywhere. Try again.");
      setEndingAll(false);
    }
  }

  async function signOutOne(id: string) {
    try {
      await revoke({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["security", "sessions"] });
      toast.success("Signed out of that session");
    } catch {
      toast.error("Couldn't sign that out — try again");
    }
  }

  return (
    <Screen>
      <TopBar title="Security" back="/settings" />
      <div className="min-h-[calc(100dvh-4rem)] space-y-4 px-5 pt-2 pb-6">
        <div className="divide-y divide-border">
          {securityRows.map((r) => (
            <Link
              key={r.key}
              to={r.to}
              className="state-layer flex min-h-touch items-center gap-4 py-5"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-2 font-medium">{r.label}</span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {r.hint}
                </span>
              </span>
              <ChevronRight size={iconSize.sm} className="shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-2 font-medium">Signed in on</p>
          {sessions.isLoading ? (
            <Loading rows={2} />
          ) : sessions.isError || !sessions.data?.length ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-10 w-7 shrink-0 items-center justify-center">
                <ShieldCheck size={iconSize.lg} aria-hidden />
              </span>
              <p className="min-w-0 flex-1 text-1 text-muted-foreground">
                {sessions.isError ? "Couldn't load your sessions." : "No active sessions found."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.data.map((s) => (
                <div key={s.id} className="flex items-center gap-3 py-2">
                  <Laptop
                    size={iconSize.lg}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-1 font-semibold">{deviceLabel(s.user_agent)}</p>
                    <p className="text-1 text-muted-foreground">
                      Last active {new Date(s.updated_at).toLocaleString("en-IN")}
                      {s.ip ? ` · ${s.ip}` : ""}
                    </p>
                  </div>
                  <Btn
                    variant="ghost"
                    className="px-3 text-1"
                    onClick={() => void signOutOne(s.id)}
                  >
                    Sign out
                  </Btn>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Log out everywhere (ref img 6; also queue item 2): the action on the right. */}
        <div className="flex items-center gap-4 border-t border-border py-5">
          <div className="min-w-0 flex-1">
            <p className="text-2 font-medium">Log out everywhere</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              End your sessions on all devices and browsers, including this one.
            </p>
          </div>
          <Btn
            variant="outline"
            className="!min-h-9 !h-9 shrink-0 !rounded-sm !px-4 !text-sm"
            loading={endingAll}
            onClick={() => void logOutEverywhere()}
          >
            Log out
          </Btn>
        </div>
      </div>
    </Screen>
  );
}
