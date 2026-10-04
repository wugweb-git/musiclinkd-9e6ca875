import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { anonClient } from "@/lib/portfolio.functions";

/*
 * Help centre: topics (cms_categories) and guides (cms_pages rows with a category), "was this
 * helpful" answers (help_feedback) and requests to the team (support_requests).
 * Schema: supabase/migrations/20260921190000_help_cms.sql. Before it is applied every read comes
 * back empty with `ready: false`, and the screens say the help centre isn't available yet.
 */

export type ContentBlock =
  | { type: "para"; text: string }
  /** `id` makes the heading a link target (`#id`). */
  | { type: "heading"; text: string; id?: string | undefined }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string }
  /** `link` is a router link as stored: an app path and, for a dynamic one, its params. */
  | { type: "cta"; label: string; link: { to: string; params?: Record<string, string> } };

export type HelpKind = "guide" | "policy" | "faq" | "release";

export type HelpCategory = { key: string; label: string; blurb: string };

export type HelpPage = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  /** "Updated 2 Sep 2026", from cms_pages.updated_at. */
  updated: string;
  kind: HelpKind;
  blocks: ContentBlock[];
  related: string[];
  popularRank: number | null;
};

export type HelpCentre = { ready: boolean; categories: HelpCategory[]; pages: HelpPage[] };

const db = (client: unknown) => client as unknown as SupabaseClient;

const PAGE_COLUMNS =
  "slug, title, summary, category, kind, read_time, updated_at, body, related, sort_order, popular_rank";

type PageRow = {
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  kind: string | null;
  read_time: string | null;
  updated_at: string;
  body: unknown;
  related: string[] | null;
  popular_rank: number | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Updated 2 Sep 2026" — spelt out by hand so every runtime prints the same month. */
export function updatedLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `Updated ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const KINDS: HelpKind[] = ["guide", "policy", "faq", "release"];

function toPage(r: PageRow): HelpPage {
  return {
    slug: r.slug,
    title: r.title,
    summary: r.summary ?? "",
    category: r.category,
    readTime: r.read_time ?? "",
    updated: updatedLabel(r.updated_at),
    kind: KINDS.includes(r.kind as HelpKind) ? (r.kind as HelpKind) : "guide",
    blocks: Array.isArray(r.body) ? (r.body as ContentBlock[]) : [],
    related: r.related ?? [],
    popularRank: r.popular_rank,
  };
}

/** The words a guide can be found by: title, summary, topic and everything it says. */
function pageText(p: HelpPage, categories: HelpCategory[]) {
  const topic = categories.find((c) => c.key === p.category)?.label ?? p.category;
  const body = p.blocks.flatMap((b) =>
    b.type === "list" ? b.items : b.type === "cta" ? [b.label] : [b.text],
  );
  return [p.title, p.summary, topic, ...body].join(" ").toLowerCase();
}

/** Guides that contain every word of `q`, in any order. */
export function searchHelp(centre: HelpCentre, q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return centre.pages.filter((p) => {
    const text = pageText(p, centre.categories);
    return words.every((w) => text.includes(w));
  });
}

/** Every topic and published guide, in order. Public; empty with ready: false on any failure. */
export const getHelpCentre = createServerFn({ method: "GET" }).handler(
  async (): Promise<HelpCentre> => {
    const client = db(await anonClient());
    const [cats, pages] = await Promise.all([
      client.from("cms_categories").select("key, label, blurb").order("sort_order"),
      client
        .from("cms_pages")
        .select(PAGE_COLUMNS)
        .eq("status", "published")
        .not("category", "is", null)
        .order("sort_order"),
    ]);
    if (cats.error || pages.error) return { ready: false, categories: [], pages: [] };
    return {
      ready: true,
      categories: (cats.data ?? []) as HelpCategory[],
      pages: ((pages.data ?? []) as PageRow[]).map(toPage),
    };
  },
);

export type HelpArticle = {
  page: HelpPage;
  categoryLabel: string | null;
  related: Pick<HelpPage, "slug" | "title" | "readTime">[];
};

/** One published guide with its related guides, or null. Public. */
export const getHelpArticle = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<HelpArticle | null> => {
    const client = db(await anonClient());
    const { data: row, error } = await client
      .from("cms_pages")
      .select(PAGE_COLUMNS)
      .eq("slug", data.slug)
      .eq("status", "published")
      .not("category", "is", null)
      .maybeSingle();
    if (error || !row) return null;
    const page = toPage(row as PageRow);
    const [cat, rel] = await Promise.all([
      client.from("cms_categories").select("label").eq("key", page.category).maybeSingle(),
      page.related.length
        ? client
            .from("cms_pages")
            .select("slug, title, read_time")
            .in("slug", page.related)
            .eq("status", "published")
            .not("category", "is", null)
        : Promise.resolve({ data: [], error: null }),
    ]);
    const found = (rel.data ?? []) as { slug: string; title: string; read_time: string | null }[];
    return {
      page,
      categoryLabel: (cat.data as { label: string } | null)?.label ?? null,
      // Kept in the order the guide lists them; a related guide that is gone is left out.
      related: page.related.flatMap((slug) => {
        const r = found.find((f) => f.slug === slug);
        return r ? [{ slug: r.slug, title: r.title, readTime: r.read_time ?? "" }] : [];
      }),
    };
  });

/** The signed-in person's answer to "was this helpful" on one guide, or null. */
export const getMyHelpFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ context, data }): Promise<boolean | null> => {
    const { data: row, error } = await db(context.supabase)
      .from("help_feedback")
      .select("helpful")
      .eq("page_slug", data.slug)
      .eq("profile_id", context.userId)
      .maybeSingle();
    if (error || !row) return null;
    return (row as { helpful: boolean }).helpful;
  });

/** Records (or changes) the signed-in person's answer for one guide. */
export const giveHelpFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ slug: z.string().min(1).max(120), helpful: z.boolean() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await db(context.supabase)
      .from("help_feedback")
      .upsert(
        {
          page_slug: data.slug,
          profile_id: context.userId,
          helpful: data.helpful,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: "page_slug,profile_id" },
      );
    if (error) throw new Error(error.message);
    return { helpful: data.helpful };
  });

export type SupportStatus = "open" | "answered" | "closed";

export type SupportRequest = {
  id: string;
  topic: string;
  page_slug: string | null;
  message: string;
  status: SupportStatus;
  created_at: string;
};

/** Sends a request to the team from the help centre. */
export const sendSupportRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        topic: z.string().regex(/^[a-z0-9-]{1,40}$/),
        message: z.string().trim().min(1).max(2000),
        pageSlug: z.string().min(1).max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await db(context.supabase)
      .from("support_requests")
      .insert({
        profile_id: context.userId,
        topic: data.topic,
        message: data.message,
        page_slug: data.pageSlug ?? null,
      } as never)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: (row as { id: string }).id };
  });

/** The signed-in person's own requests, newest first. Empty on any failure. */
export const listMySupportRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupportRequest[]> => {
    const { data, error } = await db(context.supabase)
      .from("support_requests")
      .select("id, topic, page_slug, message, status, created_at")
      .eq("profile_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return [];
    return (data ?? []) as SupportRequest[];
  });

/*
 * Site pages: the cms_pages rows with no category (about, contact, legal-*). Each one is shown on
 * the route it names; drafts show nowhere. A row whose body has no blocks yet shows its `content`
 * text as paragraphs. Snapshot and blocks: supabase/migrations/20260921220000_cms_site_pages.sql.
 */

export type SitePage = {
  slug: string;
  title: string;
  /** The short version shown under the title; empty when the row has none. */
  summary: string;
  seoDescription: string;
  /** "Last updated 2 September 2026", from cms_pages.updated_at. */
  updated: string;
  blocks: ContentBlock[];
};

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function lastUpdatedLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `Last updated ${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** `content` split on blank lines, one paragraph each. */
function contentBlocks(content: string | null): ContentBlock[] {
  return (content ?? "")
    .split(/\n\s*\n/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ type: "para", text }));
}

/** One published site page, or null (missing, draft, or unreadable). Public. */
export const getSitePage = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<SitePage | null> => {
    const { data: row, error } = await db(await anonClient())
      .from("cms_pages")
      .select("slug, title, summary, content, seo_description, updated_at, body")
      .eq("slug", data.slug)
      .eq("status", "published")
      .is("category", null)
      .maybeSingle();
    if (error || !row) return null;
    const r = row as {
      slug: string;
      title: string;
      summary: string | null;
      content: string | null;
      seo_description: string | null;
      updated_at: string;
      body: unknown;
    };
    const blocks = Array.isArray(r.body) ? (r.body as ContentBlock[]) : [];
    return {
      slug: r.slug,
      title: r.title,
      summary: r.summary ?? "",
      seoDescription: r.seo_description ?? "",
      updated: lastUpdatedLabel(r.updated_at),
      blocks: blocks.length ? blocks : contentBlocks(r.content),
    };
  });

/** A site page's published cms_pages row as `{ page }`; page is null when there is none. */
export const loadSitePage = async (slug: string) => ({
  page: await getSitePage({ data: { slug } }).catch(() => null),
});

/** Head for a site-page route from the row's title and seo_description. */
export const sitePageHead =
  (fallbackTitle: string) =>
  ({ loaderData }: { loaderData?: { page: SitePage | null } }) => {
    const page = loaderData?.page ?? null;
    const title = `${page?.title ?? fallbackTitle} — MusicLinkd`;
    return {
      meta: [
        { title },
        ...(page?.seoDescription
          ? [
              { name: "description", content: page.seoDescription },
              { property: "og:description", content: page.seoDescription },
            ]
          : []),
        { property: "og:title", content: title },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
        ...(page ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  };
