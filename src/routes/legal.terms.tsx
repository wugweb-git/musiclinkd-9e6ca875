import { createFileRoute } from "@tanstack/react-router";
import { SitePageScreen } from "@/components/ml/help";
import { loadSitePage, sitePageHead } from "@/lib/help.functions";

// cms_pages "legal-terms".
export const Route = createFileRoute("/legal/terms")({
  loader: () => loadSitePage("legal-terms"),
  head: sitePageHead("Terms of Use"),
  component: TermsPage,
});

function TermsPage() {
  const { page } = Route.useLoaderData();
  return <SitePageScreen page={page} fallbackTitle="Terms of Use" back="/welcome" />;
}
