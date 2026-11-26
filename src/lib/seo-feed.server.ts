/**
 * SEO & Ecosystem Sitemap Edge Generator
 * 
 * Maps both properties:
 * 1. Web App: https://app.musiclinkd.com
 * 2. Marketing & CMS: https://musiclinkd.com
 */

export function generateSitemapXml(): string {
  const now = new Date().toISOString();

  const urls = [
    // Web App (app.musiclinkd.com)
    { loc: "https://app.musiclinkd.com/", changefreq: "daily", priority: "1.0" },
    { loc: "https://app.musiclinkd.com/discover", changefreq: "daily", priority: "0.9" },
    { loc: "https://app.musiclinkd.com/marketplace", changefreq: "daily", priority: "0.8" },
    { loc: "https://app.musiclinkd.com/services", changefreq: "daily", priority: "0.8" },
    { loc: "https://app.musiclinkd.com/bands", changefreq: "daily", priority: "0.8" },
    { loc: "https://app.musiclinkd.com/opportunities", changefreq: "daily", priority: "0.8" },
    { loc: "https://app.musiclinkd.com/help", changefreq: "weekly", priority: "0.7" },
    { loc: "https://app.musiclinkd.com/welcome", changefreq: "monthly", priority: "0.6" },
    { loc: "https://app.musiclinkd.com/delete-account", changefreq: "monthly", priority: "0.4" },

    // Marketing & CMS (musiclinkd.com)
    { loc: "https://musiclinkd.com/", changefreq: "daily", priority: "1.0" },
    { loc: "https://musiclinkd.com/features/", changefreq: "weekly", priority: "0.9" },
    { loc: "https://musiclinkd.com/how-it-works/", changefreq: "weekly", priority: "0.9" },
    { loc: "https://musiclinkd.com/faq/", changefreq: "weekly", priority: "0.8" },
    { loc: "https://musiclinkd.com/safety/", changefreq: "weekly", priority: "0.8" },
    { loc: "https://musiclinkd.com/about/", changefreq: "monthly", priority: "0.7" },
    { loc: "https://musiclinkd.com/pricing/", changefreq: "weekly", priority: "0.8" },
    { loc: "https://musiclinkd.com/privacy/", changefreq: "monthly", priority: "0.6" },
    { loc: "https://musiclinkd.com/terms/", changefreq: "monthly", priority: "0.6" },
    { loc: "https://musiclinkd.com/cookies/", changefreq: "monthly", priority: "0.5" },
    { loc: "https://musiclinkd.com/help/", changefreq: "weekly", priority: "0.8" },
    { loc: "https://musiclinkd.com/profile-that-gets-booked/", changefreq: "weekly", priority: "0.7" },
    { loc: "https://musiclinkd.com/pricing-your-first-service/", changefreq: "weekly", priority: "0.7" },
    { loc: "https://musiclinkd.com/how-verification-works/", changefreq: "weekly", priority: "0.7" },
    { loc: "https://musiclinkd.com/booking-policies-explained/", changefreq: "weekly", priority: "0.7" },
    { loc: "https://musiclinkd.com/review-policy/", changefreq: "weekly", priority: "0.7" },
    { loc: "https://musiclinkd.com/community-guidelines/", changefreq: "weekly", priority: "0.7" },
    { loc: "https://musiclinkd.com/whats-new/", changefreq: "weekly", priority: "0.7" },
  ];

  const xmlEntries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

export function generateRobotsTxt(): string {
  return `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /

# Dual Ecosystem Sitemaps
Sitemap: https://app.musiclinkd.com/sitemap.xml
Sitemap: https://musiclinkd.com/sitemap_index.xml
Sitemap: https://musiclinkd.com/ecosystem-sitemap.xml
Sitemap: https://musiclinkd.com/app-sitemap.xml
`;
}

export function generateLlmsTxt(): string {
  return `# MusicLinkd Ecosystem (musiclinkd.com & app.musiclinkd.com)

> India's professional music industry ecosystem connecting verified talent, session musicians, recording studios, sound engineers, and venues with 0% platform fees.

## Core Modules & Features
- Talent & Studio Directory: https://app.musiclinkd.com/discover
- Lossless Multi-track Stems Player: Integrated WebAudio waveform player supporting multi-track stem auditioning.
- Dynamic QR Identity Pass: Instant profile and booking verification at https://app.musiclinkd.com/identity/q/:username
- Studio Booking Desk & Room Rental: Direct room, engineer, and gear reservations across 22+ verified recording studios.
- Industry Gigs & Opportunities: Open casting, vocal gigs, and production contracts at https://app.musiclinkd.com/opportunities
- Help Centre & Guides: https://musiclinkd.com/help/

## Ecosystem Personas
- Talent Users: Singers, playback vocalists, session guitarists, keyboardists, drummers, mixing/mastering engineers, music directors, lyricists.
- Business Users: Commercial recording studios, jam pads, indie record labels, live music venues, artist management agencies.

## Guarantees & Terms
- Commission: 0% Platform Fee on peer-to-peer artist transactions.
- Copyright: 100% Creator Rights Retention ("Your work stays yours").
- Reviews: Double-blind verified feedback preventing client or artist retaliation.
- Payment Protection: Direct UPI/NEFT peer-to-peer agreements with milestone deliverables.

## Sitemaps & Feeds
- Unified Web App Sitemap: https://app.musiclinkd.com/sitemap.xml
- Website Sitemap Index: https://musiclinkd.com/sitemap_index.xml
- Ecosystem Sitemap: https://musiclinkd.com/ecosystem-sitemap.xml
- App Sitemap on Domain: https://musiclinkd.com/app-sitemap.xml
- Marketing & CMS: https://musiclinkd.com/
- Support: contact@musiclinkd.com
`;
}
