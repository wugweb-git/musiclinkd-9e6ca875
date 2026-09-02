import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, TopBar } from "@/components/ml/ui";
import { PortfolioSkeleton, StateCard } from "@/components/ml/portfolio";
import { demoPortfolio, workType, type PortfolioItem } from "@/data/portfolio";
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
      { property: "og:description", content: "Move work up or down to change what people see first." },
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
            action={
              <Link to="/portfolio/new">
                <Btn>Add work</Btn>
              </Link>
            }
          />
        ) : null}

        <ul className="space-y-2">
          {order.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4"
            >
              <span className="text-xl" aria-hidden>
                {workType(item.kind).emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.title}</span>
                <span className="block text-xs text-muted-foreground">
                  Position {i + 1} of {order.length}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Move ${item.title} up`}
                onClick={() => move(i, -1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${item.title} down`}
                onClick={() => move(i, 1)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border"
              >
                ↓
              </button>
            </li>
          ))}
        </ul>

        {order.length ? (
          <div className="sticky bottom-0 mt-6 border-t border-border bg-background/95 py-4 backdrop-blur">
            <Btn
              className="w-full"
              onClick={() => toast.success("Order saved for this session")}
            >
              Save order
            </Btn>
          </div>
        ) : null}
      </main>
    </div>
  );
}
