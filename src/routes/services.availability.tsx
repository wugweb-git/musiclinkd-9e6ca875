/**
 * A service is bookable exactly when its owner's profile is available (owner's rule, 18 Sep 2026:
 * "service is available only when profile is available — an available profile shall deliver
 * service"). There is no separate booking-capacity status: profiles.availability already answers
 * this, edited on /profile/edit and shown as a badge on the public profile. This screen reflects
 * that real value rather than duplicating its own editor.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { Screen, TopBar, BtnLink } from "@/components/ml/ui";
import { Card, Loading } from "@/components/ml/kit";
import { getMyProfile } from "@/lib/portfolio.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/services/availability")({
  head: () => ({
    meta: [
      { title: "Availability | MusicLinkd" },
      {
        name: "description",
        content: "Your services are bookable exactly when your profile says you're available.",
      },
      { property: "og:title", content: "Availability | MusicLinkd" },
      { property: "og:description", content: "Control when people can book you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Availability,
});

function Availability() {
  const load = useServerFn(getMyProfile);
  const q = useQuery({ queryKey: ["profile", "me"], queryFn: () => load() });
  const availability = (q.data as { availability?: string | null } | null | undefined)?.availability ?? null;

  return (
    <Screen>
      <TopBar title="Availability" subtitle="Used by every booking request" back="/services" />

      <div className="space-y-4 px-5 pt-4 pb-6">
        {q.isLoading ? (
          <Loading />
        ) : (
          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              {availability ? (
                <CheckCircle2 size={iconSize.md} className="shrink-0 text-success" />
              ) : (
                <CircleDashed size={iconSize.md} className="shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {availability ? `Available — ${availability}` : "Not marked available"}
                </p>
                <p className="text-1 text-muted-foreground">
                  {availability
                    ? "Your services can be booked while this is set."
                    : "Your services can't be booked until you set this."}
                </p>
              </div>
            </div>
            <BtnLink to="/profile/edit" variant="outline" className="w-full">
              Edit availability on your profile
            </BtnLink>
          </Card>
        )}

        <p className="px-1 text-1 text-muted-foreground">
          There's one availability setting for your whole profile — it's what people see on your
          profile, and it's what gates whether your services accept new requests. Per-service hours,
          notice periods and time off aren't supported yet.
        </p>
      </div>
    </Screen>
  );
}
