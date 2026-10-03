import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronRight, Laptop, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Screen, TopBar, Btn } from "@/components/ml/ui";
import { Card, Loading } from "@/components/ml/kit";
import { securityRows } from "@/data/settings";
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
      <TopBar title="Security" subtitle="Password and devices" back="/settings" />
      <div className="space-y-4 px-5 pt-4 pb-6">
        <Card className="p-0">
          {securityRows.map((r) => (
            <Link
              key={r.key}
              to={r.to}
              className="flex items-center gap-3 border-b border-border p-4 last:border-0"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-1 font-semibold">{r.label}</span>
                <span className="block truncate text-1 text-muted-foreground">{r.hint}</span>
              </span>
              <ChevronRight size={iconSize.sm} className="shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </Card>

        <div>
          <p className="pill mb-2 px-1 text-muted-foreground">Signed in on</p>
          {sessions.isLoading ? (
            <Loading rows={2} />
          ) : sessions.isError || !sessions.data?.length ? (
            <Card className="flex items-center gap-3">
              <span className="flex h-10 w-7 shrink-0 items-center justify-center">
                <ShieldCheck size={iconSize.lg} aria-hidden />
              </span>
              <p className="min-w-0 flex-1 text-1 text-muted-foreground">
                {sessions.isError ? "Couldn't load your sessions." : "No active sessions found."}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessions.data.map((s) => (
                <Card key={s.id} className="flex items-center gap-3">
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
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Screen>
  );
}
