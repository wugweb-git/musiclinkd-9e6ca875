import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Services a profile offers: profile_services with its packages and add-ons. Category, pricing
 * model and work modes are taxonomy slugs (service_categories, pricing_models, work_modes). Money is
 * integer paise with a bare unit. Drafts are readable by their owner only; RLS scopes every read.
 * There is no stored count of views, enquiries or bookings for a service.
 * Schema: supabase/migrations/20260915160000_services.sql.
 */

export type ServiceStatus = "active" | "paused" | "draft";

export type ServiceRow = {
  id: string;
  profile_id: string;
  name: string;
  description: string | null;
  category: string | null;
  /** Up to 3 service_categories slugs; `category` is the first. */
  categories: string[];
  pricing_model: string | null;
  price_paise: number | null;
  price_unit: string | null;
  price_note: string | null;
  min_hours: number | null;
  turnaround: string | null;
  notice: string | null;
  mode: string | null;
  work_modes: string[];
  deliverables: string[];
  requirements: string[];
  /** portfolio_items ids shown as examples, in order. */
  example_ids: string[];
  /** A studio's service: the amenities (amenities slugs) and equipment ids it uses. */
  amenity_slugs: string[];
  equipment_ids: string[];
  status: ServiceStatus;
  sort_order: number;
};

export type ServicePackageRow = {
  id: string;
  name: string;
  price_paise: number;
  price_unit: string | null;
  includes: string[];
  turnaround: string | null;
  revisions: string | null;
  is_popular: boolean;
  sort_order: number;
};

export type ServiceAddonRow = {
  id: string;
  label: string;
  price_paise: number;
  price_unit: string | null;
  sort_order: number;
};

export type ServiceDetail = ServiceRow & {
  packages: ServicePackageRow[];
  addons: ServiceAddonRow[];
  /** profiles.availability for the service's owner — null means not open for work right now. */
  ownerAvailability: string | null;
  /** The owner's published portfolio items picked as examples, in the chosen order. */
  examples: ServiceExample[];
  /** Who offers it: name and their music identity (taxonomy slugs), for the service page. */
  provider: ServiceProvider | null;
  /** A studio's service: what it uses, each with its photos — the business's "examples". */
  uses: {
    amenities: { slug: string; label: string; photos: string[] }[];
    equipment: { id: string; name: string; photos: string[] }[];
  };
};

export type ServiceProvider = {
  name: string;
  username: string | null;
  photo: string | null;
  roles: string[];
  genres: string[];
  instruments: string[];
  languages: string[];
};

function providerFrom(row: Record<string, unknown> | null): ServiceProvider | null {
  if (!row) return null;
  const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
  return {
    name: (row["display_name"] as string | null) ?? (row["username"] as string | null) ?? "",
    username: (row["username"] as string | null) ?? null,
    photo: (row["avatar_url"] as string | null) ?? null,
    roles: list(row["roles"]),
    genres: list(row["genres"]),
    instruments: list(row["instruments"]),
    languages: list(row["languages"]),
  };
}

export type ServiceExample = {
  id: string;
  title: string;
  kind: string;
  cover_url: string | null;
  media_url: string | null;
};

/** A taxonomy option; a specific service category names its broad one in `parent`. */
export type ServiceOption = { slug: string; label: string; parent?: string };

/** The option lists the service screens pick from, and which categories each person type offers. */
export type ServiceOptions = {
  categories: ServiceOption[];
  pricingModels: ServiceOption[];
  workModes: ServiceOption[];
  /** person_types slug → service_categories slugs. */
  categoriesByRole: Record<string, string[]>;
};

const SERVICE =
  "id, profile_id, name, description, category, categories, example_ids, amenity_slugs, equipment_ids, pricing_model, price_paise, price_unit, price_note, min_hours, turnaround, notice, mode, work_modes, deliverables, requirements, status, sort_order";
const PACKAGE =
  "id, name, price_paise, price_unit, includes, turnaround, revisions, is_popular, sort_order";
const ADDON = "id, label, price_paise, price_unit, sort_order";

/** bigint columns can arrive as strings; screens do arithmetic on paise. */
const num = (v: unknown) => (v == null ? null : Number(v));

function serviceFrom(row: Record<string, unknown>): ServiceRow {
  const r = row as ServiceRow;
  return {
    ...r,
    price_paise: num(r.price_paise),
    work_modes: r.work_modes ?? [],
    deliverables: r.deliverables ?? [],
    requirements: r.requirements ?? [],
    categories: r.categories?.length ? r.categories : r.category ? [r.category] : [],
    example_ids: r.example_ids ?? [],
    amenity_slugs: r.amenity_slugs ?? [],
    equipment_ids: r.equipment_ids ?? [],
  };
}

/** What a studio's service uses: its amenities and equipment, with their photos. */
async function serviceUses(
  client: SupabaseClient,
  ownerId: string,
  amenitySlugs: string[],
  equipmentIds: string[],
): Promise<ServiceDetail["uses"]> {
  const none = { amenities: [], equipment: [] };
  if (!amenitySlugs.length && !equipmentIds.length) return none;
  const { data: studio } = await client
    .from("bookables")
    .select("id")
    .eq("owner_profile_id", ownerId)
    .limit(1)
    .maybeSingle();
  const studioId = (studio as { id: string } | null)?.id;
  if (!studioId) return none;
  const [labels, equipment, photos] = await Promise.all([
    amenitySlugs.length
      ? client
          .from("taxonomy_options")
          .select("slug, label")
          .eq("category_key", "amenities")
          .in("slug", amenitySlugs)
      : { data: [] },
    equipmentIds.length
      ? client
          .from("bookable_equipment")
          .select("id, name")
          .eq("bookable_id", studioId)
          .in("id", equipmentIds)
      : { data: [] },
    client
      .from("bookable_photos")
      .select("subject_type, subject_id, url")
      .eq("bookable_id", studioId)
      .order("sort_order"),
  ]);
  const photoRows = (photos.data ?? []) as {
    subject_type: string;
    subject_id: string;
    url: string;
  }[];
  const photosOf = (type: string, id: string) =>
    photoRows.filter((p) => p.subject_type === type && p.subject_id === id).map((p) => p.url);
  const label = new Map(
    ((labels.data ?? []) as { slug: string; label: string }[]).map((l) => [l.slug, l.label]),
  );
  const items = new Map(
    ((equipment.data ?? []) as { id: string; name: string }[]).map((e) => [e.id, e.name]),
  );
  return {
    amenities: amenitySlugs
      .filter((a) => label.has(a))
      .map((a) => ({ slug: a, label: label.get(a)!, photos: photosOf("amenity", a) })),
    equipment: equipmentIds
      .filter((e) => items.has(e))
      .map((e) => ({ id: e, name: items.get(e)!, photos: photosOf("equipment", e) })),
  };
}

/** A service with its packages and add-ons, or null when RLS hides it or there is none. */
async function serviceDetail(
  client: SupabaseClient,
  id: string,
  ownerId?: string,
): Promise<ServiceDetail | null> {
  let query = client.from("profile_services").select(SERVICE).eq("id", id);
  if (ownerId) query = query.eq("profile_id", ownerId);
  const { data: row, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const serviceRow = row as { profile_id: string } & Record<string, unknown>;
  const [packages, addons, owner] = await Promise.all([
    client
      .from("profile_service_packages")
      .select(PACKAGE)
      .eq("service_id", id)
      .order("sort_order"),
    client.from("profile_service_addons").select(ADDON).eq("service_id", id).order("sort_order"),
    client
      .from("profiles")
      .select(
        "availability, display_name, username, avatar_url, roles, genres, instruments, languages",
      )
      .eq("id", serviceRow.profile_id)
      .maybeSingle(),
  ]);
  const exampleIds = ((serviceRow["example_ids"] as string[] | null) ?? []).filter(Boolean);
  const exampleRows = exampleIds.length
    ? await client
        .from("portfolio_items")
        .select("id, title, kind, cover_url, media_url")
        .in("id", exampleIds)
        .eq("user_id", serviceRow.profile_id)
        .eq("published", true)
    : { data: [], error: null };
  if (exampleRows.error) throw new Error(exampleRows.error.message);
  const byId = new Map(((exampleRows.data ?? []) as ServiceExample[]).map((e) => [e.id, e]));
  if (packages.error) throw new Error(packages.error.message);
  if (addons.error) throw new Error(addons.error.message);
  if (owner.error) throw new Error(owner.error.message);
  const service = serviceFrom(serviceRow);
  const uses = await serviceUses(
    client,
    serviceRow.profile_id,
    service.amenity_slugs,
    service.equipment_ids,
  );

  return {
    uses,
    ...service,
    packages: ((packages.data ?? []) as ServicePackageRow[]).map((p) => ({
      ...p,
      price_paise: Number(p.price_paise),
      includes: p.includes ?? [],
    })),
    addons: ((addons.data ?? []) as ServiceAddonRow[]).map((a) => ({
      ...a,
      price_paise: Number(a.price_paise),
    })),
    ownerAvailability: (owner.data as { availability: string | null } | null)?.availability ?? null,
    provider: providerFrom(owner.data as Record<string, unknown> | null),
    examples: exampleIds.map((i) => byId.get(i)).filter((e): e is ServiceExample => Boolean(e)),
  };
}

/** Published service categories, pricing models and work modes, and the role mapping. */
export const getServiceOptions = createServerFn({ method: "GET" }).handler(
  async (): Promise<ServiceOptions> => {
    const client = await anonClient();
    const [options, mapping] = await Promise.all([
      client
        .from("taxonomy_options" as never)
        .select("category_key, slug, label, sort_order, metadata")
        .in("category_key", ["service_categories", "pricing_models", "work_modes"])
        .order("sort_order"),
      client
        .from("person_type_service_categories" as never)
        .select("person_type_slug, service_category_slug"),
    ]);
    if (options.error) throw new Error(options.error.message);
    if (mapping.error) throw new Error(mapping.error.message);

    const rows = (options.data ?? []) as unknown as {
      category_key: string;
      slug: string;
      label: string;
      metadata: { parent?: string } | null;
    }[];
    const pick = (key: string) =>
      rows
        .filter((r) => r.category_key === key)
        .map(({ slug, label, metadata }) => ({
          slug,
          label,
          ...(metadata?.parent ? { parent: metadata.parent } : {}),
        }));
    const categoriesByRole: Record<string, string[]> = {};
    for (const m of (mapping.data ?? []) as unknown as {
      person_type_slug: string;
      service_category_slug: string;
    }[]) {
      (categoriesByRole[m.person_type_slug] ??= []).push(m.service_category_slug);
    }
    return {
      categories: pick("service_categories"),
      pricingModels: pick("pricing_models"),
      workModes: pick("work_modes"),
      categoriesByRole,
    };
  },
);

/** The signed-in profile's services, every status. */
export const listMyServices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ServiceRow[]> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { data, error } = await client
      .from("profile_services")
      .select(SERVICE)
      .eq("profile_id", context.userId)
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(serviceFrom);
  });

const idInput = z.object({ id: z.string().uuid() });

/** One of the signed-in profile's services, drafts included, or null when it is not theirs. */
export const getMyService = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idInput.parse(d))
  .handler(async ({ context, data }) =>
    serviceDetail(context.supabase as unknown as SupabaseClient, data.id, context.userId),
  );

/** A service anyone may read (not a draft, on a readable profile), or null. */
export const getPublicService = createServerFn({ method: "GET" })
  .inputValidator((d) => idInput.parse(d))
  .handler(async ({ data }) =>
    serviceDetail((await anonClient()) as unknown as SupabaseClient, data.id),
  );

export type BookableService = {
  id: string;
  name: string;
  price_paise: number | null;
  price_unit: string | null;
  /** What it uses: amenity labels and equipment names, for the booking list. */
  uses: string[];
};

/** A profile's live services, in page order: what a studio's Book lets people pick. */
export const listPublicServices = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ profileId: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<BookableService[]> => {
    const client = (await anonClient()) as unknown as SupabaseClient;
    const { data: rows, error } = await client
      .from("profile_services")
      .select("id, name, price_paise, price_unit, amenity_slugs, equipment_ids")
      .eq("profile_id", data.profileId)
      .eq("status", "active")
      .order("sort_order");
    if (error) return [];
    type Row = Omit<BookableService, "uses"> & { amenity_slugs: string[]; equipment_ids: string[] };
    const list = (rows ?? []) as Row[];
    const slugs = [...new Set(list.flatMap((r) => r.amenity_slugs ?? []))];
    const ids = [...new Set(list.flatMap((r) => r.equipment_ids ?? []))];
    const [labels, items] = await Promise.all([
      slugs.length
        ? client
            .from("taxonomy_options")
            .select("slug, label")
            .eq("category_key", "amenities")
            .in("slug", slugs)
        : { data: [] },
      ids.length
        ? client.from("bookable_equipment").select("id, name").in("id", ids)
        : { data: [] },
    ]);
    const label = new Map(
      ((labels.data ?? []) as { slug: string; label: string }[]).map((l) => [l.slug, l.label]),
    );
    const item = new Map(
      ((items.data ?? []) as { id: string; name: string }[]).map((e) => [e.id, e.name]),
    );
    return list.map(({ amenity_slugs, equipment_ids, ...r }) => ({
      ...r,
      price_paise: r.price_paise == null ? null : Number(r.price_paise),
      uses: [
        ...(amenity_slugs ?? []).map((a) => label.get(a)).filter((x): x is string => !!x),
        ...(equipment_ids ?? []).map((e) => item.get(e)).filter((x): x is string => !!x),
      ],
    }));
  });

const slug = z.string().regex(/^[a-z0-9]+(_[a-z0-9]+)*$/);
const text = (max: number) => z.string().trim().max(max);
const lines = z.array(text(200).min(1)).max(30);

const packageSchema = z.object({
  name: text(80).min(1),
  price_paise: z.number().int().min(0),
  price_unit: text(24).nullable(),
  includes: lines,
  turnaround: text(80).nullable(),
  revisions: text(80).nullable(),
  is_popular: z.boolean(),
});

const addonSchema = z.object({
  label: text(80).min(1),
  price_paise: z.number().int().min(0),
  price_unit: text(24).nullable(),
});

const saveSchema = z.object({
  id: z.string().uuid().optional(),
  name: text(120).min(1),
  description: text(2000).nullable(),
  category: slug.nullable(),
  categories: z.array(slug).max(3).optional(),
  example_ids: z.array(z.string().uuid()).max(6).optional(),
  amenity_slugs: z
    .array(z.string().regex(/^[a-z0-9_]{2,40}$/))
    .max(40)
    .optional(),
  equipment_ids: z.array(z.string().uuid()).max(40).optional(),
  pricing_model: slug.nullable(),
  price_paise: z.number().int().min(0).nullable(),
  price_unit: text(24).nullable(),
  min_hours: z.number().int().positive().max(1000).nullable(),
  turnaround: text(80).nullable(),
  notice: text(80).nullable(),
  work_modes: z.array(slug).max(4),
  deliverables: lines,
  requirements: lines,
  status: z.enum(["draft", "active"]),
  /** Replaces the service's packages when given; left as they are when omitted. */
  packages: z.array(packageSchema).max(10).optional(),
  /** Replaces the service's add-ons when given; left as they are when omitted. */
  addons: z.array(addonSchema).max(20).optional(),
});

export type SaveServiceInput = z.input<typeof saveSchema>;

async function replaceChildren(
  client: SupabaseClient,
  profileId: string,
  serviceId: string,
  packages: z.infer<typeof packageSchema>[] | undefined,
  addons: z.infer<typeof addonSchema>[] | undefined,
) {
  const lists = [
    ["profile_service_packages", packages],
    ["profile_service_addons", addons],
  ] as const;
  for (const [table, rows] of lists) {
    if (!rows) continue;
    const removed = await client.from(table).delete().eq("service_id", serviceId);
    if (removed.error) throw new Error(removed.error.message);
    if (!rows.length) continue;
    const inserted = await client
      .from(table)
      .insert(
        rows.map((r, i) => ({ ...r, service_id: serviceId, profile_id: profileId, sort_order: i })),
      );
    if (inserted.error) throw new Error(inserted.error.message);
  }
}

/** Creates or updates one of the signed-in profile's services, as a draft or live. */
export const saveService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => saveSchema.parse(d))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const { id, packages, addons, ...fields } = data;
    const payload = { ...fields, description: fields.description || null };

    let serviceId = id;
    if (serviceId) {
      const { data: row, error } = await client
        .from("profile_services")
        .update(payload)
        .eq("id", serviceId)
        .eq("profile_id", context.userId)
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Service not found");
    } else {
      const { data: row, error } = await client
        .from("profile_services")
        .insert({ ...payload, profile_id: context.userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      serviceId = (row as { id: string }).id;
    }
    await replaceChildren(client, context.userId, serviceId, packages, addons);
    return { id: serviceId };
  });

/** Pauses, publishes or returns one of the signed-in profile's services to draft. */
export const setServiceStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "paused", "draft"]) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<{ status: ServiceStatus }> => {
    const { data: row, error } = await (context.supabase as unknown as SupabaseClient)
      .from("profile_services")
      .update({ status: data.status })
      .eq("id", data.id)
      .eq("profile_id", context.userId)
      .select("status")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Service not found");
    return row as { status: ServiceStatus };
  });

/** A copy of one of the signed-in profile's services, with its packages and add-ons, as a draft. */
export const duplicateService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idInput.parse(d))
  .handler(async ({ context, data }): Promise<{ id: string }> => {
    const client = context.supabase as unknown as SupabaseClient;
    const source = await serviceDetail(client, data.id, context.userId);
    if (!source) throw new Error("Service not found");
    // Read-only extras on the detail (owner availability, examples, provider) aren't columns.
    const {
      id: _id,
      profile_id: _profile,
      packages,
      addons,
      status: _status,
      ownerAvailability: _availability,
      examples: _examples,
      provider: _provider,
      ...fields
    } = source;
    const { data: row, error } = await client
      .from("profile_services")
      .insert({ ...fields, profile_id: context.userId, status: "draft" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const copyId = (row as { id: string }).id;
    await replaceChildren(
      client,
      context.userId,
      copyId,
      packages.map(({ id: _p, sort_order: _s, ...p }) => p),
      addons.map(({ id: _a, sort_order: _s, ...a }) => a),
    );
    return { id: copyId };
  });

/** Deletes one of the signed-in profile's services; its packages and add-ons go with it. */
export const deleteService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idInput.parse(d))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { data: rows, error } = await (context.supabase as unknown as SupabaseClient)
      .from("profile_services")
      .delete()
      .eq("id", data.id)
      .eq("profile_id", context.userId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows?.length) throw new Error("Service not found");
    return { ok: true };
  });
