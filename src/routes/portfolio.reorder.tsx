import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, BtnLink, TopBar } from "@/components/ml/ui";
import { PortfolioSkeleton, ReorderList, StateCard } from "@/components/ml/portfolio";
import { demoPortfolio, FEATURED_LIMIT, type PortfolioItem } from "@/data/portfolio";
import { listMyPortfolio } from "@/lib/portfolio.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio/reorder")({
  head: () => ({
    meta: [
      { title: "Reorder portfolio — MusicLinkd" },
      {
        name: "description",
        content: "Set the order your work appears in, and choose what leads your profile.",
      },
      { property: "og:title", content: "Reorder portfolio — MusicLinkd" },
      {
        property: "og:description",
        content: "Move work up or down to change what people see first.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reorder,
});

function Reorder() {
  const { signedIn } = useAuth();
  const fetchItems = useServerFn(listMyPortfolio);
  const q = useQuery({
    queryKey: ["portfolio", "mine"],
    queryFn: () => fetchItems() as Promise<PortfolioItem[]>,
    enabled: signedIn,
  });

  const [order, setOrder] = useState<PortfolioItem[]>([]);
  useEffect(() => {
    setOrder(signedIn ? (q.data ?? []) : demoPortfolio);
  }, [q.data, signedIn]);

  const [featured, setFeatured] = useState<string[]>([]);

  function toggleFeatured(id: string) {
    setFeatured((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= FEATURED_LIMIT) {
        toast.error(`You can feature up to ${FEATURED_LIMIT} works`);
        return prev;
      }
      return [...prev, id];
    });
  }

  function move(index: number, delta: number) {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const a = next[index]!;
      const b = next[target]!;
      next[index] = b;
      next[target] = a;
      return next;
    });
  }

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] bg-background pb-32">
      <TopBar title="Reorder work" subtitle="What people see first" back="/portfolio" />
      <main className="px-5 pt-4">
        {signedIn && q.isLoading ? <PortfolioSkeleton /> : null}

        {!q.isLoading && order.length === 0 ? (
          <StateCard
            title="Nothing to reorder yet"
            body="Add your first work and it will show up here."
            action={<BtnLink to="/portfolio/new">Add Work</BtnLink>}
          />
        ) : null}

        <ReorderList
          items={order}
          onMove={(i, dir) => move(i, dir)}
          featured={featured}
          onFeature={toggleFeatured}
        />

        <p className="mt-4 text-[11px] text-muted-foreground">
          Featured work leads your profile — up to {FEATURED_LIMIT} items.
        </p>

        {order.length ? (
          <div className="sticky bottom-0 mt-6 border-t border-border bg-background/95 py-4 backdrop-blur">
            <Btn className="w-full" onClick={() => toast.success("Order saved for this session")}>
              Save Order
            </Btn>
          </div>
        ) : null}
      </main>
    </div>
  );
}
