import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Screen, TopBar, Btn, BtnLink } from "@/components/ml/ui";
import { EmptyState } from "@/components/ml/kit";
import {
  forgetVisits,
  readVisits,
  sinceThen,
  syncRecentlyViewed,
  type Visit,
} from "@/lib/device-history";
import { useAuth } from "@/hooks/use-auth";

/*
 * The pages this person opened (src/lib/device-history.ts). Signed in, the list follows the
 * account across devices; signed out, it is this device's own.
 */
export const Route = createFileRoute("/recently-viewed")({
  head: () => ({
    meta: [
      { title: "Recently viewed | MusicLinkd" },
      {
        name: "description",
        content: "The profiles and studios you opened, so you can get back to them.",
      },
      { property: "og:title", content: "Recently viewed | MusicLinkd" },
      { property: "og:description", content: "Profiles and studios you opened recently." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecentlyViewed,
});

function RecentlyViewed() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const { user } = useAuth();
  // Shown straight from the device, then again once the account's list is merged in.
  useEffect(() => {
    setVisits(readVisits());
    if (user) void syncRecentlyViewed().then(() => setVisits(readVisits()));
  }, [user]);

  return (
    <Screen>
      <TopBar
        title="Recently viewed"
        subtitle={user ? "On all your devices" : "Kept on this device"}
        back="/discover"
      />

      <div className="space-y-5 px-5 pt-4 pb-8">
        {!visits.length ? (
          <EmptyState
            title="Nothing here yet"
            body={
              user
                ? "Profiles and studios you open are listed here, on every device you sign in on."
                : "Profiles and studios you open are listed here, on this device only."
            }
          >
            <BtnLink to="/discover">Start Discovering</BtnLink>
          </EmptyState>
        ) : (
          <>
            <ul className="divide-y divide-border overflow-hidden rounded-lg bg-subtle">
              {visits.map((v) => (
                <li key={`${v.kind}-${v.handle}`}>
                  <Link
                    to="/profile/$username"
                    params={{ username: v.handle }}
                    className="state-layer flex items-center gap-3 px-4 py-3.5"
                  >
                    {v.avatarUrl ? (
                      <img
                        src={v.avatarUrl}
                        alt=""
                        loading="lazy"
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="h-11 w-11 shrink-0 rounded-full bg-background" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{v.name}</span>
                      <span className="block truncate text-1 text-muted-foreground">
                        {[v.detail, sinceThen(v.at)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <Btn
              variant="ghost"
              className="w-full"
              onClick={() => {
                forgetVisits();
                setVisits([]);
              }}
            >
              Clear this list
            </Btn>
          </>
        )}
      </div>
    </Screen>
  );
}
