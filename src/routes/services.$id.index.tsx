import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  FolderKanban,
  Guitar,
  Headphones,
  Languages,
  Music,
  UserRound,
} from "lucide-react";
import { PhotoSheet, ProofPill } from "@/components/ml/booking";
import { ChipGroup, ChipGroupList } from "@/components/ml/profile";
import { labelFor, useTaxonomy } from "@/lib/taxonomy";
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
  const { options: taxonomy } = useTaxonomy();
  const { options } = useServiceOptions();
  const refresh = useRefreshServices();
  const updateStatus = useServerFn(setServiceStatus);
  const remove = useServerFn(deleteService);
  const [manage, setManage] = useState(false);
  const [viewing, setViewing] = useState<{ title: string; photos: string[] } | null>(null);
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
                from
                price={priceParts(s.price_paise, s.price_unit, s.price_note)}
                amountClassName="text-2 font-bold"
              />
              {owner ? <StatusPill label={s.status} tone={serviceStatusTone[s.status]} /> : null}
            </div>
            {s.description ? (
              <p className="text-1 leading-relaxed text-muted-foreground">{s.description}</p>
            ) : null}
          </Card>

          {s.examples.length ? (
            <Card className="space-y-2">
              <h2 className="text-sm">Examples</h2>
              <ul className="space-y-2">
                {s.examples.map((w) => (
                  <li key={w.id}>
                    <Link
                      to="/portfolio/$id"
                      params={{ id: w.id }}
                      className="state-layer flex items-center gap-3 rounded-lg p-1"
                    >
                      {w.cover_url ? (
                        <img
                          src={w.cover_url}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-sm object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-icon-chip text-primary-foreground">
                          <FolderKanban size={18} strokeWidth={1.75} aria-hidden />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{w.title}</span>
                        <span className="block text-1 capitalize text-foreground">{w.kind}</span>
                      </span>
                      <ChevronRight size={18} className="shrink-0" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* A studio's service: what it uses, each opening its photos. */}
          {s.uses.amenities.length || s.uses.equipment.length ? (
            <Card className="space-y-3">
              <h2 className="text-sm">What it uses</h2>
              {s.uses.amenities.length ? (
                <div className="flex flex-wrap gap-2">
                  {s.uses.amenities.map((a) => (
                    <ProofPill
                      key={a.slug}
                      label={a.label}
                      photos={a.photos}
                      onOpen={() => setViewing({ title: a.label, photos: a.photos })}
                      className="rounded-full bg-background text-1"
                    />
                  ))}
                </div>
              ) : null}
              {s.uses.equipment.length ? (
                <ul className="divide-y divide-border">
                  {s.uses.equipment.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        disabled={!e.photos.length}
                        onClick={() => setViewing({ title: e.name, photos: e.photos })}
                        className="state-layer flex w-full items-center gap-3 py-2.5 text-left disabled:cursor-default"
                      >
                        {e.photos[0] ? (
                          <img
                            src={e.photos[0]}
                            alt=""
                            className="h-12 w-12 shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-icon-chip text-primary-foreground">
                            <Headphones size={18} strokeWidth={1.75} aria-hidden />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {e.name}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ) : null}

          {s.provider ? (
            <Card className="space-y-3">
              <h2 className="text-sm">About {s.provider.name || "the provider"}</h2>
              <ChipGroupList>
                <ChipGroup
                  label="Type"
                  icon={UserRound}
                  items={s.provider.roles.map((r) => labelFor(taxonomy?.person_types, r))}
                />
                <ChipGroup
                  label="Genres"
                  icon={Music}
                  items={s.provider.genres.map((g) => labelFor(taxonomy?.genres, g))}
                />
                <ChipGroup
                  label="Instruments"
                  icon={Guitar}
                  items={s.provider.instruments.map((i) => labelFor(taxonomy?.instruments, i))}
                />
                <ChipGroup
                  label="Languages"
                  icon={Languages}
                  items={s.provider.languages.map((l) => labelFor(taxonomy?.languages, l))}
                />
              </ChipGroupList>
              {s.provider.username ? (
                <BtnLink
                  to="/profile/$username"
                  params={{ username: s.provider.username }}
                  variant="outline"
                  className="w-full"
                >
                  View Profile
                </BtnLink>
              ) : null}
            </Card>
          ) : null}

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
              <h2 className="text-sm">What they need from you</h2>
              {s.requirements.map((r) => (
                <p key={r} className="text-1 text-muted-foreground">
                  · {r}
                </p>
              ))}
            </Card>
          ) : null}

          {owner ? (
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
          ) : s.ownerAvailability ? (
            // A visitor books from here: the same enquiry the owner previews.
            <BtnLink to="/services/$id/enquiry" params={{ id: s.id }} className="w-full">
              Enquire
            </BtnLink>
          ) : (
            <Btn className="w-full" disabled>
              Not taking bookings right now
            </Btn>
          )}
        </div>
      ) : null}

      <Sheet open={manage && Boolean(s)} onClose={() => setManage(false)} title="Manage service">
        <div className="space-y-2">
          <BtnLink
            to="/services/new"
            search={{ step: "what" as const, id }}
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
          <BtnLink to="/services/$id/manage" params={{ id }} variant="outline" className="w-full">
            More Options
          </BtnLink>
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
      <PhotoSheet
        title={viewing?.title ?? ""}
        photos={viewing?.photos ?? []}
        onClose={() => setViewing(null)}
      />
    </Screen>
  );
}
