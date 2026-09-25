import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * A rental's detail page is the listing's detail page. Market is one marketplace (owner, 22 Sep
 * 2026), and sale and rent are one flow, so one database row has one screen.
 *
 * This was a second, near-identical detail screen over the same row: it carried the deposit, the
 * rental terms and an availability badge that /marketplace/l/$id did not, while missing that
 * screen's photo carousel, video embed, posted date, offer sheet and owner check — so you could
 * report your own listing here, and had no way to edit it. The same item read differently
 * depending on which card you tapped. The rental terms moved onto the listing; the slug is the
 * same, so this path stays and keeps old links working.
 */
export const Route = createFileRoute("/marketplace/rent/e/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/marketplace/l/$id", params: { id: params.id }, replace: true });
  },
});
