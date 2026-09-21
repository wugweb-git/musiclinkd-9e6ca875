import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, Sheet } from "@/components/ml/ui";
import { Card, EmptyState, Segmented, StatusPill } from "@/components/ml/kit";
import { businessView, loadBusiness } from "@/lib/business-view";
import {
  deletePortfolioItem,
  listMyPortfolio,
  savePortfolioItem,
  setPortfolioPublished,
} from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/business/$id/portfolio")({
  loader: ({ params }) => loadBusiness(params.id),
  head: () => ({
    meta: [
      { title: "Business portfolio | MusicLinkd" },
      {
        name: "description",
        content: "Manage the credits, gallery and featured work shown on your business page.",
      },
      { property: "og:title", content: "Business portfolio | MusicLinkd" },
      { property: "og:description", content: "Credits, gallery and featured work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessPortfolio,
});

const tabs = ["Credits", "Gallery"] as const;

/*
 * Credits are the account's portfolio_items. Visitors see the published ones from the loader; the
 * signed-in owner sees every item (hidden ones too) and adds, edits, hides or removes them through
 * the same portfolio functions the talent portfolio uses. RLS keeps writes to the owner's own rows.
 */
type OwnItem = Awaited<ReturnType<typeof listMyPortfolio>>[number];
type CreditDraft = { item?: OwnItem; title: string; role: string; year: string };
const MINE = ["portfolio", "mine"];

const inputCls =
  "min-h-control w-full rounded-lg border border-border bg-card px-4 text-sm outline-none focus:border-primary";

function BusinessPortfolio() {
  const b = businessView(Route.useLoaderData());
  const [tab, setTab] = useState<(typeof tabs)[number]>("Credits");
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const owner = Boolean(b && user && user.id === b.profileId);
  const [draft, setDraft] = useState<CreditDraft | null>(null);

  const fetchMine = useServerFn(listMyPortfolio);
  const save = useServerFn(savePortfolioItem);
  const setPublished = useServerFn(setPortfolioPublished);
  const remove = useServerFn(deletePortfolioItem);
  const mine = useQuery({ queryKey: MINE, queryFn: () => fetchMine(), enabled: owner });

  /** The owner's list and the public page both change, so both are refreshed. */
  const refresh = async () => {
    await Promise.all([queryClient.invalidateQueries({ queryKey: MINE }), router.invalidate()]);
  };
  /** Applies a change to the owner's list straight away and returns what to roll back to. */
  const optimistic = async (change: (items: OwnItem[]) => OwnItem[]) => {
    await queryClient.cancelQueries({ queryKey: MINE });
    const before = queryClient.getQueryData<OwnItem[]>(MINE);
    if (before) queryClient.setQueryData<OwnItem[]>(MINE, change(before));
    return { before };
  };
  const rollback = (ctx: { before: OwnItem[] | undefined } | undefined) => {
    if (ctx?.before) queryClient.setQueryData(MINE, ctx.before);
  };

  const saveCredit = useMutation({
    // An edit keeps every field this sheet doesn't show (description, links, kind, visibility).
    mutationFn: ({ item, title, role, year }: CreditDraft) =>
      save({
        data: {
          ...(item
            ? {
                id: item.id,
                kind: item.kind,
                description: item.description,
                collaborators: item.collaborators,
                cover_url: item.cover_url ?? "",
                media_url: item.media_url ?? "",
                published: item.published,
              }
            : { kind: "credit", published: true }),
          title: title.trim(),
          role: role.trim() || null,
          release_year: year ? Number(year) : null,
        },
      }),
    onSuccess: async (_r, d) => {
      setDraft(null);
      toast.success(d.item ? "Credit saved" : "Credit added");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "That didn't save. Try again."),
  });

  const toggleHidden = useMutation({
    mutationFn: (vars: { id: string; published: boolean }) => setPublished({ data: vars }),
    onMutate: (vars) =>
      optimistic((items) =>
        items.map((i) => (i.id === vars.id ? { ...i, published: vars.published } : i)),
      ),
    onError: (_e, _v, ctx) => {
      rollback(ctx);
      toast.error("That didn't save. Try again.");
    },
    onSettled: () => refresh(),
  });

  const removeCredit = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onMutate: (id) => {
      setDraft(null);
      return optimistic((items) => items.filter((i) => i.id !== id));
    },
    onError: (_e, _id, ctx) => {
      rollback(ctx);
      toast.error("Couldn't remove it. Try again.");
    },
    onSuccess: () => toast.success("Credit removed"),
    onSettled: () => refresh(),
  });

  const year = draft?.year ? Number(draft.year) : null;
  const valid =
    !!draft?.title.trim() &&
    (year === null || (Number.isInteger(year) && year >= 1900 && year <= 2100));

  // The owner's full list once it loads; the loader's published credits until then.
  const credits =
    owner && mine.data
      ? mine.data.map((i) => ({
          id: i.id,
          title: i.title,
          meta: joinParts(i.role, i.release_year ? String(i.release_year) : ""),
          item: i as OwnItem | undefined,
        }))
      : (b?.credits ?? []).map((c) => ({ ...c, item: undefined as OwnItem | undefined }));
  const addCredit = () => setDraft({ title: "", role: "", year: "" });

  if (!b) {
    return (
      <Screen>
        <TopBar title="Portfolio" back="/business" />
        <div className="px-5 pt-6">
          <EmptyState
            title="Business not found"
            body="This business may have been removed or you no longer have access to it."
          />
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <TopBar title="Portfolio" subtitle={b.name} back={`/business/${b.id}`} />

      <div className="space-y-4 px-5 pt-4 pb-8">
        <Segmented value={tab} options={tabs} onChange={setTab} />

        {tab === "Credits" ? (
          credits.length ? (
            <div className="space-y-3">
              {credits.map((c) => (
                <Card key={c.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{c.title}</p>
                      {c.meta ? (
                        <p className="mt-1 text-1 text-muted-foreground">{c.meta}</p>
                      ) : null}
                    </div>
                    {c.item && !c.item.published ? (
                      <StatusPill label="Hidden" tone="neutral" />
                    ) : (
                      <StatusPill label="Public" tone="good" />
                    )}
                  </div>
                  {c.item ? (
                    <div className="mt-3 flex gap-2">
                      <Btn
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          c.item &&
                          setDraft({
                            item: c.item,
                            title: c.item.title,
                            role: c.item.role ?? "",
                            year: c.item.release_year ? String(c.item.release_year) : "",
                          })
                        }
                      >
                        Edit
                      </Btn>
                      <Btn
                        variant="ghost"
                        className="flex-1"
                        onClick={() =>
                          c.item &&
                          toggleHidden.mutate({ id: c.item.id, published: !c.item.published })
                        }
                      >
                        {c.item.published ? "Hide" : "Show"}
                      </Btn>
                    </div>
                  ) : null}
                </Card>
              ))}
              {owner ? (
                <Btn variant="outline" className="w-full" onClick={addCredit}>
                  Add a credit
                </Btn>
              ) : null}
            </div>
          ) : (
            <EmptyState
              title="No credits yet"
              body="Add the records, films and sessions this space worked on."
            >
              {owner ? <Btn onClick={addCredit}>Add a credit</Btn> : null}
            </EmptyState>
          )
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {b.gallery.map((g) => (
                <div key={g} className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={g}
                    alt={`${b.name} space`}
                    className="h-28 w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
            <p className="text-1 text-muted-foreground">
              The first photo is used as the cover on Discover. Drag to reorder once you have more
              than three.
            </p>
            {/* No gallery upload yet (owner, 16 Sep), so there is no Add photos button to press. */}
          </div>
        )}
      </div>

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.item ? "Edit credit" : "Add a credit"}
      >
        {draft ? (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid && !saveCredit.isPending) saveCredit.mutate(draft);
            }}
          >
            <label className="block text-1 font-semibold" htmlFor="credit-title">
              Title
            </label>
            <input
              id="credit-title"
              required
              maxLength={120}
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className={inputCls}
            />
            <label className="block text-1 font-semibold" htmlFor="credit-role">
              Role
            </label>
            <input
              id="credit-role"
              maxLength={120}
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value })}
              className={inputCls}
            />
            <label className="block text-1 font-semibold" htmlFor="credit-year">
              Year
            </label>
            <input
              id="credit-year"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2100}
              step={1}
              value={draft.year}
              onChange={(e) => setDraft({ ...draft, year: e.target.value })}
              className={inputCls}
            />
            <Btn type="submit" className="w-full" disabled={!valid} loading={saveCredit.isPending}>
              {draft.item ? "Save" : "Add"}
            </Btn>
            {draft.item ? (
              <Btn
                variant="ghost"
                className="w-full"
                onClick={() => draft.item && removeCredit.mutate(draft.item.id)}
              >
                Remove
              </Btn>
            ) : null}
          </form>
        ) : null}
      </Sheet>
    </Screen>
  );
}
