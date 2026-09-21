import { createFileRoute } from "@tanstack/react-router";
import { SitePageScreen } from "@/components/ml/help";
import { loadSitePage, sitePageHead } from "@/lib/help.functions";

// cms_pages "legal-privacy".
export const Route = createFileRoute("/legal/privacy")({
  loader: () => loadSitePage("legal-privacy"),
  head: sitePageHead("Privacy Policy"),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { page } = Route.useLoaderData();
  return <SitePageScreen page={page} fallbackTitle="Privacy Policy" back="/welcome" />;
}
