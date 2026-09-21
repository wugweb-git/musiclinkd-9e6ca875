import { createFileRoute } from "@tanstack/react-router";
import { SitePageScreen } from "@/components/ml/help";
import { loadSitePage, sitePageHead } from "@/lib/help.functions";

// cms_pages "about".
export const Route = createFileRoute("/about")({
  loader: () => loadSitePage("about"),
  head: sitePageHead("About MusicLinkd"),
  component: AboutPage,
});

function AboutPage() {
  const { page } = Route.useLoaderData();
  return <SitePageScreen page={page} fallbackTitle="About MusicLinkd" back="/help" />;
}
