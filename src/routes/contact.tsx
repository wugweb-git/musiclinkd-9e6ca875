import { createFileRoute } from "@tanstack/react-router";
import { ContactSupport, SitePageScreen } from "@/components/ml/help";
import { getHelpCentre, loadSitePage, sitePageHead, type HelpCategory } from "@/lib/help.functions";

// cms_pages "contact", then the help centre's contact-support sheet (its topics from cms_categories).
export const Route = createFileRoute("/contact")({
  loader: async () => {
    const [site, centre] = await Promise.all([
      loadSitePage("contact"),
      getHelpCentre().catch(() => null),
    ]);
    return { ...site, categories: (centre?.categories ?? []) as HelpCategory[] };
  },
  head: sitePageHead("Contact MusicLinkd"),
  component: ContactPage,
});

function ContactPage() {
  const { page, categories } = Route.useLoaderData();
  return (
    <SitePageScreen page={page} fallbackTitle="Contact MusicLinkd" back="/help">
      <ContactSupport categories={categories} />
    </SitePageScreen>
  );
}
