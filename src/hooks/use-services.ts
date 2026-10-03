import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import {
  getMyService,
  getPublicService,
  getServiceOptions,
  listMyServices,
  type ServiceDetail,
  type ServiceOption,
  type ServiceOptions,
} from "@/lib/services.functions";
import {
  Building2,
  Disc3,
  Guitar,
  Mic,
  Music2,
  PenLine,
  Piano,
  SlidersHorizontal,
  Ticket,
  type LucideIcon,
} from "lucide-react";

/** The signed-in profile's services. Empty without a session. */
export function useMyServices() {
  const { user, signedIn, loading } = useAuth();
  const load = useServerFn(listMyServices);
  const q = useQuery({
    queryKey: ["services", "mine", user?.id ?? null],
    queryFn: () => load(),
    enabled: signedIn,
  });
  return {
    items: signedIn ? (q.data ?? []) : [],
    pending: loading || (signedIn && q.isPending),
    error: signedIn && q.isError,
    retry: () => void q.refetch(),
  };
}

/** Service categories, pricing models and work modes from the taxonomy. */
export function useServiceOptions() {
  const load = useServerFn(getServiceOptions);
  const q = useQuery({
    queryKey: ["services", "options"],
    queryFn: () => load(),
    staleTime: 5 * 60 * 1000,
  });
  return { options: q.data ?? null, pending: q.isPending, error: q.isError };
}

/**
 * One service: the signed-in owner's own (drafts included), otherwise the public read. `owner` is
 * true when the viewer owns it.
 */
export function useService(id: string) {
  const { user, signedIn, loading } = useAuth();
  const loadMine = useServerFn(getMyService);
  const loadPublic = useServerFn(getPublicService);
  const q = useQuery({
    queryKey: ["services", "one", id, user?.id ?? null],
    queryFn: async (): Promise<ServiceDetail | null> => {
      const mine = signedIn ? await loadMine({ data: { id } }).catch(() => null) : null;
      return mine ?? loadPublic({ data: { id } });
    },
    enabled: !loading && /^[0-9a-f-]{36}$/i.test(id),
  });
  return {
    service: q.data ?? null,
    owner: Boolean(user && q.data && q.data.profile_id === user.id),
    pending: loading || q.isLoading,
    error: q.isError,
    retry: () => void q.refetch(),
  };
}

/** Refetches every services query after a write. */
export function useRefreshServices() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ["services"] });
}

/** A slug's label from an option list; the slug itself when the list has no such option. */
export function optionLabel(list: ServiceOption[] | undefined, slug: string | null | undefined) {
  if (!slug) return "";
  return list?.find((o) => o.slug === slug)?.label ?? slug;
}

const categoryIcons: Record<string, LucideIcon> = {
  vocals: Mic,
  mixing: SlidersHorizontal,
  mastering: Disc3,
  production: Piano,
  instrument: Guitar,
  songwriting: PenLine,
  live: Ticket,
  studio: Building2,
};

/**
 * A category's line icon (Lucide, never an emoji — brief §3.5, 29 Sep). It follows from the
 * category and is not stored; a category without one gets the generic music note.
 */
export function categoryIcon(slug: string | null | undefined): LucideIcon {
  return (slug && categoryIcons[slug]) || Music2;
}

/** Work mode labels joined for one line. */
export function workModesText(options: ServiceOptions | null, slugs: string[]) {
  return slugs.map((s) => optionLabel(options?.workModes, s)).join(" · ");
}
