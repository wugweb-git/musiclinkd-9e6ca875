import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Screen, TopBar, Btn, BtnLink, Sheet } from "@/components/ml/ui";
import { Card, StatusPill, EmptyState, Dialog, Loading, Price } from "@/components/ml/kit";
import { StateCard } from "@/components/ml/portfolio";
import { serviceStatusTone } from "@/data/services";
import {
  categoryEmoji,
  optionLabel,
  useRefreshServices,
  useService,
  useServiceOptions,
  workModesText,
} from "@/hooks/use-services";
import { priceParts } from "@/lib/price";
import { deleteService, setServiceStatus } from "@/lib/services.functions";
import { joinParts } from "@/lib/utils";

export const Route = createFileRoute("/services/$id/")({
  head: () => ({
    meta: [
      { title: "Service details | MusicLinkd" },
      {
        name: "description",
        content: "Pricing, packages, deliverables and availability for this service.",
      },
      { property: "og:title", content: "Service details | MusicLinkd" },
      {
        property: "og:description",
        content: "What is included, what it costs and how long it takes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServiceDetail,
});

function ServiceDetail() {
  const { id } = Route.useParams();
  const { service: s, owner, pending, error, retry } = useService(id);
  const { options } = useServiceOptions();
  const refresh = useRefreshServices();
  const updateStatus = useServerFn(setServiceStatus);
  const remove = useServerFn(deleteService);
  const [manage, setManage] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (pending || error || (!s && !removed)) {
    return (
      <Screen>
        <TopBar title="Service" back="/services" />
        <div className="px-5 pt-6">
          {pending ? (
            <Loading />
          ) : error ? (
            <StateCard
              tone="error"
              title="We couldn't load this service"
              body="Check your connection and try again."
              action={<Btn onClick={retry}>Retry</Btn>}
            />
          ) : (
            <EmptyState title="Service not found" body="It may have been removed." />
          )}
        </div>
      </Screen>
    );
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update this service");
    } finally {
      setBusy(false);
      setManage(false);
    }
  }

  const paused = s?.status !== "active";

  return (
    <Screen>
      <TopBar
        title={optionLabel(options?.categories, s?.category) || "Service"}
        back="/services"
        right={
          owner ? (
            <button
              type="button"
              onClick={() => setManage(true)}
              className="text-1 font-semibold text-foreground"
            >
              Manage
            </button>
          ) : null
        }
      />

      {s ? (
        <div className="space-y-4 px-5 pt-4 pb-6">
          <Card className="space-y-3">
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-subtle text-3"
              >
                {categoryEmoji(s.category)}
              </span>
              <div className="min-w-0 flex-1">
                <h1 className="text-2 font-bold leading-snug">{s.name}</h1>
                <p className="mt-1 text-1 text-muted-foreground">
                  {joinParts(
                    optionLabel(options?.pricingModels, s.pricing_model),
                    workModesText(options, s.work_modes) || s.mode,
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-start justify-between gap-2">
              <Price
                price={priceParts(s.price_paise, s.price_unit, s.price_note)}
                amountClassName="text-2 font-bold"
              />
              {owner ? <StatusPill label={s.status} tone={serviceStatusTone[s.status]} /> : null}
            </div>
            {s.description ? (
              <p className="text-1 leading-relaxed text-muted-foreground">{s.description}</p>
            ) : null}
          </Card>

          {s.deliverables.length || s.turnaround ? (
            <Card className="space-y-2">
              <h2 className="text-sm">What you get</h2>
              <ul className="space-y-1.5">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex gap-2 text-1">
                    <span
                      aria-hidden
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                    />
                    {d}
                  </li>
                ))}
              </ul>
              {s.turnaround ? (
                <p className="pt-1 text-1 text-muted-foreground">Turnaround {s.turnaround}</p>
              ) : null}
            </Card>
          ) : null}

          {s.packages.length ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Packages</h2>
              {s.packages.map((p) => (
                <Card key={p.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{p.name}</p>
                    {p.is_popular ? <StatusPill label="popular" tone="brand" /> : null}
                  </div>
                  <Price
                    price={priceParts(p.price_paise, p.price_unit)}
                    amountClassName="text-2 font-bold"
                  />
                  <ul className="space-y-1">
                    {p.includes.map((i) => (
                      <li key={i} className="text-1 text-muted-foreground">
                        · {i}
                      </li>
                    ))}
                  </ul>
                  {p.turnaround || p.revisions ? (
                    <p className="text-1 text-muted-foreground">
                      {joinParts(p.turnaround, p.revisions)}
                    </p>
                  ) : null}
                </Card>
              ))}
            </section>
          ) : null}

          {s.addons.length ? (
            <Card className="space-y-2">
              <h2 className="text-sm">Add-ons</h2>
              {s.addons.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between gap-3 border-b border-border py-2 last:border-0"
                >
                  <span className="min-w-0 flex-1 truncate text-1">{a.label}</span>
                  <Price
                    price={priceParts(a.price_paise, a.price_unit)}
                    align="end"
                    className="shrink-0"
                    amountClassName="text-1 font-semibold"
                  />
                </div>
              ))}
            </Card>
          ) : null}

          {s.requirements.length ? (
            <Card className="space-y-2">
              <h2 className="text-sm">What the client should send</h2>
              {s.requirements.map((r) => (
                <p key={r} className="text-1 text-muted-foreground">
                  · {r}
                </p>
              ))}
            </Card>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <BtnLink to="/services/availability" variant="outline" className="w-full">
              Availability
            </BtnLink>
            {s.ownerAvailability ? (
              <BtnLink to="/services/$id/enquiry" params={{ id: s.id }} className="w-full">
                Preview Booking
              </BtnLink>
            ) : (
              <Btn className="w-full" disabled>
                Not Bookable
              </Btn>
            )}
          </div>
        </div>
      ) : null}

      <Sheet open={manage && Boolean(s)} onClose={() => setManage(false)} title="Manage service">
        <div className="space-y-2">
          <BtnLink
            to="/services/new"
            search={{ step: "category" as const, id }}
            variant="outline"
            className="w-full"
          >
            Edit Details & Pricing
          </BtnLink>
          <Btn
            variant="outline"
            className="w-full"
            loading={busy}
            onClick={() =>
              void run(() => updateStatus({ data: { id, status: paused ? "active" : "paused" } }))
            }
          >
            {paused ? "Make bookable again" : "Pause bookings"}
          </Btn>
          <Btn
            variant="ghost"
            className="w-full"
            loading={busy}
            onClick={() => {
              setManage(false);
              setConfirmRemove(true);
            }}
          >
            Remove Service
          </Btn>
        </div>
      </Sheet>

      <Dialog
        open={confirmRemove && Boolean(s)}
        title={`Delete "${s?.name ?? ""}"?`}
        body="This cannot be undone. If you only want a break, pause it instead."
        onClose={() => setConfirmRemove(false)}
      >
        <Btn
          loading={busy}
          onClick={() =>
            void run(async () => {
              await remove({ data: { id } });
              setRemoved(true);
            }).then(() => setConfirmRemove(false))
          }
        >
          Delete Service
        </Btn>
        <Btn variant="ghost" onClick={() => setConfirmRemove(false)}>
          Keep It
        </Btn>
      </Dialog>

      <Dialog
        open={removed}
        title="Service removed"
        body="Existing bookings are unaffected."
        onClose={() => setRemoved(false)}
      >
        <BtnLink to="/services" className="w-full">
          Back to Services
        </BtnLink>
      </Dialog>
    </Screen>
  );
}
