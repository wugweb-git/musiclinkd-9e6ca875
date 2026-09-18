import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Chip, Screen, TopBar } from "@/components/ml/ui";
import { EmptyState, Loading } from "@/components/ml/kit";
import {
  listMySaved,
  unsaveTarget,
  type SavedCard,
  type SavedTargetType,
} from "@/lib/saved.functions";
import { iconSize } from "@/lib/tokens";

export const Route = createFileRoute("/saved")({
  head: () => ({
    meta: [
      { title: "Saved Profiles | MusicLinkd" },
      {
        name: "description",
        content:
          "Your shortlist of talent, bands, studios, businesses and events with notes and tags.",
      },
      { property: "og:title", content: "Saved Profiles | MusicLinkd" },
      {
        property: "og:description",
        content: "Shortlist talent and studios with private notes and tags.",
      },
    ],
  }),
  component: Saved,
});

const tabs: { label: string; type: SavedTargetType }[] = [
  { label: "Talent", type: "talent" },
  { label: "Bands", type: "band" },
  { label: "Studios", type: "studio" },
  { label: "Businesses", type: "business" },
  { label: "Events", type: "event" },
  { label: "Listings", type: "listing" },
  { label: "Works", type: "portfolio" },
];

function Saved() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SavedTargetType>("talent");
  const load = useServerFn(listMySaved);
  const remove = useServerFn(unsaveTarget);
  const q = useQuery({ queryKey: ["saved", "mine"], queryFn: () => load() });

  async function onRemove(card: SavedCard) {
    try {
      await remove({ data: { targetType: card.targetType, targetId: card.targetId } });
      await queryClient.invalidateQueries({ queryKey: ["saved", "mine"] });
      toast.success("Removed");
    } catch {
      toast.error("Couldn't remove that — try again");
    }
  }

  const cards = q.data?.[tab] ?? [];

  return (
    <Screen>
      <TopBar title="Saved profiles" back="/discover" />
      <div className="rail flex gap-2 overflow-x-auto px-5 py-4 no-scrollbar">
        {tabs.map((t) => (
          <Chip key={t.type} active={tab === t.type} onClick={() => setTab(t.type)}>
            {t.label}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 px-5 pb-8">
        {q.isLoading ? (
          <Loading />
        ) : q.isError ? (
          <EmptyState
            title="We couldn't load your saved items"
            body="Check your connection, then try again."
          />
        ) : !cards.length ? (
          <EmptyState
            title="Nothing saved here yet"
            body="Save talent, bands, studios, businesses or events to find them again here."
          />
        ) : (
          cards.map((c) => (
            <article key={c.id} className="rounded-lg bg-subtle p-4">
              <div className="flex items-center gap-3">
                {c.photo ? (
                  <img src={c.photo} alt={c.name} className="h-14 w-14 rounded-sm object-cover" />
                ) : (
                  <span className="h-14 w-14 shrink-0 rounded-sm bg-background" aria-hidden />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm">{c.name}</h3>
                  {c.subtitle ? (
                    <p className="truncate text-1 text-muted-foreground">{c.subtitle}</p>
                  ) : null}
                </div>
              </div>
              <Actions onRemove={() => void onRemove(c)} />
            </article>
          ))
        )}
      </div>
    </Screen>
  );
}

/*
 * Removing is wired to the real saved_items table. Messaging and sharing still have no real
 * backend to open, so they stay disabled with the reason in the accessible name rather than
 * taking the tap and doing nothing.
 */
function Actions({ onRemove }: { onRemove: () => void }) {
  return (
    <div className="mt-3 flex gap-2">
      <button
        type="button"
        disabled
        aria-label="Messaging isn't open yet"
        className="hit-area min-h-touch flex-1 rounded-full bg-ink text-1 font-semibold text-background disabled:opacity-40"
      >
        Message
      </button>
      <button
        type="button"
        disabled
        aria-label="Sharing isn't open yet"
        className="hit-area min-h-touch flex-1 rounded-full border border-border text-1 font-semibold disabled:opacity-40"
      >
        Share
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove from saved"
        className="hit-area flex min-h-touch w-11 items-center justify-center rounded-full border border-border"
      >
        <X size={iconSize.sm} aria-hidden />
      </button>
    </div>
  );
}
