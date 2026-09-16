// The signed-in viewer's own identity, resolved from their profile record.
//
// This module exists because three surfaces used to render `talents[1]` — a seeded
// demo person — as the viewer themselves. Nothing here ever falls back to seed data:
// an unknown viewer renders as unknown, never as somebody else.

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getMyProfile } from "@/lib/portfolio.functions";
import type { ProfileRow } from "@/lib/profile-map";
import { cn } from "@/lib/utils";

export function initialsOf(name: string | null): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

/** First name only — for greetings. Null when we do not know who this is. */
export function firstNameOf(name: string | null): string | null {
  if (!name) return null;
  return name.trim().split(/\s+/).filter(Boolean)[0] ?? null;
}

export type Viewer = {
  signedIn: boolean;
  loading: boolean;
  photo: string | null;
  displayName: string | null;
  initials: string;
};

/**
 * Resolves the current viewer client-side. Server render and first client render
 * both produce the signed-out state, so there is no hydration mismatch — the real
 * identity lands a moment later. That is acceptable for an avatar and a greeting;
 * it is NOT acceptable for a redirect, which is why the entry gate needs a
 * server-readable session instead.
 */
export function useViewer(): Viewer {
  const { signedIn, loading } = useAuth();
  const load = useServerFn(getMyProfile);

  // Shared cache key: a screen with both a header avatar and a greeting fetches once.
  const { data: row } = useQuery({
    queryKey: ["viewer-profile"],
    queryFn: async () => ((await load()) ?? null) as ProfileRow | null,
    enabled: !loading && signedIn,
    staleTime: 60_000,
  });

  const displayName = row?.display_name ?? null;

  return {
    signedIn,
    loading,
    photo: row?.avatar_url ?? null,
    displayName,
    initials: initialsOf(displayName),
  };
}

/**
 * Header avatar. Signed in → the viewer's own photo, or their initials.
 * Signed out → a neutral mark linking to sign-in. Never another person's face.
 */
export function ViewerAvatar({ className }: { className?: string | undefined }) {
  const { signedIn, photo, displayName, initials } = useViewer();
  const shape = cn("h-11 w-11 border border-border", className);

  if (!signedIn) {
    return (
      <Link to="/welcome" aria-label="Sign in">
        <Avatar className={shape}>
          <AvatarFallback className="bg-card text-muted-foreground">
            <User size={18} aria-hidden />
          </AvatarFallback>
        </Avatar>
      </Link>
    );
  }

  return (
    <Link to="/profile" aria-label={displayName ? `Your profile — ${displayName}` : "Your profile"}>
      <Avatar className={shape}>
        {photo ? <AvatarImage src={photo} alt="" /> : null}
        <AvatarFallback className="bg-card text-1 font-semibold text-muted-foreground">
          {initials || <User size={18} aria-hidden />}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}
