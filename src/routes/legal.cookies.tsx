import { createFileRoute } from "@tanstack/react-router";
import { SitePageScreen } from "@/components/ml/help";
import { loadSitePage, sitePageHead } from "@/lib/help.functions";

// cms_pages "legal-cookies".
export const Route = createFileRoute("/legal/cookies")({
  loader: () => loadSitePage("legal-cookies"),
  head: sitePageHead("Cookie Policy"),
  component: CookiesPage,
});

function CookiesPage() {
  const { page } = Route.useLoaderData();
  return <SitePageScreen page={page} fallbackTitle="Cookie Policy" back="/welcome" />;
}
