import { createFileRoute, notFound } from "@tanstack/react-router";
import { SitePageScreen } from "@/components/ml/help";
import { loadSitePage } from "@/lib/help.functions";

/*
 * One legal screen, three slugs. Terms, Privacy and Cookies were three 15-line files differing only
 * in a CMS key and a title — the page body already comes from cms_pages (owner, 28 Sep 2026).
 */
const PAGES = {
  terms: { key: "legal-terms", title: "Terms of Use" },
  privacy: { key: "legal-privacy", title: "Privacy Policy" },
  cookies: { key: "legal-cookies", title: "Cookie Policy" },
} as const;

type LegalSlug = keyof typeof PAGES;
const isLegalSlug = (s: string): s is LegalSlug => s in PAGES;

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    if (!isLegalSlug(params.slug)) throw notFound();
    const page = await loadSitePage(PAGES[params.slug].key);
    return { ...page, title: PAGES[params.slug].title };
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.page?.title ?? loaderData?.title ?? "Legal"} — MusicLinkd`;
    return { meta: [{ title }, { property: "og:title", content: title }] };
  },
  component: LegalPage,
});

function LegalPage() {
  const { page, title } = Route.useLoaderData();
  return <SitePageScreen page={page} fallbackTitle={title} back="/welcome" />;
}
