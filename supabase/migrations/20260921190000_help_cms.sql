-- Help centre on cms_pages. The help screens (/help, /help/category/$key, /help/$slug) read their
-- guides from the database instead of src/data/cms.ts, which this migration retires: its five
-- topics and seven guides move into the tables below word for word.
--
-- cms_categories holds the help topics (key, label, blurb, order); anyone reads them.
-- cms_pages gains the columns a guide needs: category (null for the site pages about / home /
-- legal-* / pricing / …, which stay as they are), summary, kind, read_time, body (the guide's
-- blocks as jsonb: para / heading / list / callout / cta), related (slugs), sort_order and
-- popular_rank (the guides that lead "All"). updated_at carries each guide's "Updated" date.
-- The existing "Published pages are readable by everyone" policy already covers the new rows.
--
-- help_feedback: one "was this helpful" answer per person per guide; people read and change only
-- their own. support_requests: a request to the team from the help centre (topic, the guide it
-- came from, the message); the sender reads theirs back, the team reads them in the database.
-- Snapshot: supabase/dumps/2026-09-21-before-help-cms.sql
--
-- Rollback:
--   DROP TABLE public.support_requests;
--   DROP TABLE public.help_feedback;
--   DELETE FROM public.cms_pages WHERE category IS NOT NULL;
--   ALTER TABLE public.cms_pages
--     DROP COLUMN category, DROP COLUMN summary, DROP COLUMN kind, DROP COLUMN read_time,
--     DROP COLUMN body, DROP COLUMN related, DROP COLUMN sort_order, DROP COLUMN popular_rank;
--   DROP TABLE public.cms_categories;

BEGIN;

-- Topics ---------------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cms_categories (
  key        text PRIMARY KEY CHECK (key ~ '^[a-z0-9-]{1,40}$'),
  label      text NOT NULL CHECK (length(label) BETWEEN 1 AND 60),
  blurb      text NOT NULL DEFAULT '' CHECK (length(blurb) <= 160),
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE public.cms_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone reads help topics" ON public.cms_categories;
CREATE POLICY "Anyone reads help topics" ON public.cms_categories
  FOR SELECT TO anon, authenticated
  USING (true);

INSERT INTO public.cms_categories (key, label, blurb, sort_order) VALUES
  ('getting-started', 'Getting started', 'Set up a profile people book', 1),
  ('bookings', 'Bookings & studios', 'Availability, policies, no-shows', 2),
  ('marketplace', 'Marketplace & rentals', 'Buying, selling, renting gear', 3),
  ('trust', 'Trust & safety', 'Verification, reviews, reporting', 4),
  ('legal', 'Legal', 'Terms, privacy, community rules', 5)
ON CONFLICT (key) DO NOTHING;

-- Guides ---------------------------------------------------------------------------------------

ALTER TABLE public.cms_pages
  ADD COLUMN IF NOT EXISTS category     text REFERENCES public.cms_categories(key) ON UPDATE CASCADE,
  ADD COLUMN IF NOT EXISTS summary      text,
  ADD COLUMN IF NOT EXISTS kind         text CHECK (kind IN ('guide', 'policy', 'faq', 'release')),
  ADD COLUMN IF NOT EXISTS read_time    text,
  ADD COLUMN IF NOT EXISTS body         jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related      text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sort_order   int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS popular_rank int;

CREATE INDEX IF NOT EXISTS cms_pages_category_idx ON public.cms_pages (category, sort_order);

INSERT INTO public.cms_pages
  (slug, route, title, status, summary, category, kind, read_time, updated_at, body, related,
   sort_order, popular_rank)
VALUES
  ('profile-that-gets-booked', '/help/profile-that-gets-booked',
   'Building a profile that gets booked', 'published',
   'The five things clients look at before they message you.',
   'getting-started', 'guide', '5 min read', '2026-09-02 09:00:00+00',
   '[
     {"type": "para", "text": "A MusicLinkd profile is a professional identity, not a social feed. Clients scan it in under a minute and look for the same five things every time."},
     {"type": "heading", "text": "What clients check"},
     {"type": "list", "items": ["One clear role line", "Two audio samples that start strong", "A rate range", "Verification badges", "Recent reviews from completed work"]},
     {"type": "callout", "text": "Profiles with two published portfolio items receive roughly three times more first messages."},
     {"type": "cta", "label": "Open my portfolio", "link": {"to": "/portfolio"}}
   ]'::jsonb,
   ARRAY['pricing-your-first-service', 'how-verification-works'], 1, 1),

  ('pricing-your-first-service', '/help/pricing-your-first-service',
   'Pricing your first service', 'published',
   'How to set a rate you can defend and still win work.',
   'getting-started', 'guide', '6 min read', '2026-08-28 09:00:00+00',
   '[
     {"type": "para", "text": "Price the outcome, not the hours. Clients compare a finished mix against other finished mixes, so publish a per-deliverable rate with a clear revision count."},
     {"type": "heading", "text": "A simple structure"},
     {"type": "list", "items": ["Base deliverable and what is included", "Number of revisions", "Turnaround", "Add-ons priced separately", "Cancellation window"]},
     {"type": "cta", "label": "Add a service", "link": {"to": "/profile/edit"}}
   ]'::jsonb,
   ARRAY['profile-that-gets-booked', 'booking-policies-explained'], 2, NULL),

  ('how-verification-works', '/help/how-verification-works',
   'How verification works', 'published',
   'What each badge means and how the review is done.',
   'trust', 'faq', '4 min read', '2026-09-05 09:00:00+00',
   '[
     {"type": "para", "text": "Verification confirms specific facts, not quality. Each badge has its own evidence requirements and is reviewed by a person."},
     {"type": "list", "items": ["Identity — a government ID and a selfie match", "Professional — two credited releases or clients", "Business — registration documents", "Studio — address proof and room photos"]},
     {"type": "callout", "text": "Documents are only used for the review and are never shown on your public profile."},
     {"type": "cta", "label": "Start verification", "link": {"to": "/verification"}}
   ]'::jsonb,
   ARRAY['review-policy', 'profile-that-gets-booked'], 3, 2),

  ('booking-policies-explained', '/help/booking-policies-explained',
   'Booking policies explained', 'published',
   'Cancellation windows, holds, deposits and no-shows.',
   'bookings', 'guide', '7 min read', '2026-08-30 09:00:00+00',
   '[
     {"type": "para", "text": "Every bookable resource publishes one policy set. Customers see it before they request, and it is attached to the booking record."},
     {"type": "heading", "text": "The three settings that matter"},
     {"type": "list", "items": ["Cancellation window and refund tiers", "Whether a hold expires automatically", "Buffer time between sessions"]},
     {"type": "cta", "label": "Open provider policies", "link": {"to": "/business/policies"}}
   ]'::jsonb,
   ARRAY['review-policy', 'how-verification-works'], 4, 3),

  ('review-policy', '/help/review-policy',
   'Review policy', 'published',
   'Who can review, what gets removed and how responses work.',
   'trust', 'policy', '3 min read', '2026-09-01 09:00:00+00',
   '[
     {"type": "para", "text": "Reviews exist to describe completed work. Only a completed booking, order or rental unlocks a review, and both sides submit blind."},
     {"type": "list", "items": ["No editing after publishing", "One response per review", "Contact details and off-platform payment requests are removed", "Flagged reviews are re-checked within 48 hours"]},
     {"type": "cta", "label": "Open my reviews", "link": {"to": "/reviews"}}
   ]'::jsonb,
   ARRAY['how-verification-works', 'community-guidelines'], 5, NULL),

  ('community-guidelines', '/help/community-guidelines',
   'Community guidelines', 'published',
   'What is expected of every account on MusicLinkd.',
   'legal', 'policy', '4 min read', '2026-08-18 09:00:00+00',
   '[
     {"type": "para", "text": "MusicLinkd is a professional network. Keep negotiations, briefs and payment discussions on the platform so both sides have a record."},
     {"type": "list", "items": ["No harassment or discrimination", "No misrepresenting credits", "No off-platform payment pressure", "No reselling other people''s work as your own"]}
   ]'::jsonb,
   ARRAY['review-policy'], 6, NULL),

  ('whats-new', '/help/whats-new',
   'What''s new in MusicLinkd', 'published',
   'Rentals, collaboration workspaces and QR identity shipped this quarter.',
   'getting-started', 'release', '2 min read', '2026-09-10 09:00:00+00',
   '[
     {"type": "list", "items": ["Equipment rentals with calendar availability", "Collaboration workspaces with milestones and files", "QR digital identity and share cards", "Provider pricing and policy controls"]},
     {"type": "cta", "label": "Open my QR identity", "link": {"to": "/identity/qr"}}
   ]'::jsonb,
   ARRAY['profile-that-gets-booked'], 7, NULL)
ON CONFLICT (slug) DO NOTHING;

-- Was this helpful -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.help_feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug  text NOT NULL REFERENCES public.cms_pages(slug) ON UPDATE CASCADE ON DELETE CASCADE,
  profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  helpful    boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_slug, profile_id)
);

ALTER TABLE public.help_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read your own help feedback" ON public.help_feedback;
CREATE POLICY "Read your own help feedback" ON public.help_feedback
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Give your own help feedback" ON public.help_feedback;
CREATE POLICY "Give your own help feedback" ON public.help_feedback
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Change your own help feedback" ON public.help_feedback;
CREATE POLICY "Change your own help feedback" ON public.help_feedback
  FOR UPDATE TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Contact support ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.support_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  /** A cms_categories key, or 'other'. */
  topic      text NOT NULL CHECK (topic ~ '^[a-z0-9-]{1,40}$'),
  /** The guide the person was reading when they asked, if any. */
  page_slug  text REFERENCES public.cms_pages(slug) ON UPDATE CASCADE ON DELETE SET NULL,
  message    text NOT NULL CHECK (length(btrim(message)) BETWEEN 1 AND 2000),
  status     text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS support_requests_profile_idx
  ON public.support_requests (profile_id, created_at DESC);

ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read your own support requests" ON public.support_requests;
CREATE POLICY "Read your own support requests" ON public.support_requests
  FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Send your own support requests" ON public.support_requests;
CREATE POLICY "Send your own support requests" ON public.support_requests
  FOR INSERT TO authenticated
  WITH CHECK (profile_id = auth.uid() AND status = 'open');

COMMIT;
