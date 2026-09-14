-- Taxonomy tables, seeded with two categories: languages and business_types.
--
-- Shape from Claude outputs/specs/TAXONOMY-MIGRATION-SPEC.md §5. Options are keyed by a stable
-- slug, never by the display string. Language slugs are ISO 639-1 where a two-letter code exists,
-- ISO 639-3 otherwise (Bhojpuri: bho). Labels are each language's name in its own script.
--
-- The 12 options are the languages in the onboarding picker (src/data/onboarding.ts), in its order.
-- This migration does not touch profiles.languages, which still stores English names.
--
-- Reference data: public SELECT, no client write.
--
-- Rollback: DROP TABLE public.taxonomy_options; DROP TABLE public.taxonomy_categories;

CREATE TABLE public.taxonomy_categories (
  key         text PRIMARY KEY,
  label       text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.taxonomy_options (
  category_key text NOT NULL REFERENCES public.taxonomy_categories(key) ON DELETE CASCADE,
  slug         text NOT NULL,
  label        text NOT NULL,
  sort_order   int  NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  metadata     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (category_key, slug)
);

CREATE INDEX taxonomy_options_active_sort_idx
  ON public.taxonomy_options (category_key, sort_order) WHERE is_active;

GRANT SELECT ON public.taxonomy_categories, public.taxonomy_options TO anon, authenticated;
GRANT ALL ON public.taxonomy_categories, public.taxonomy_options TO service_role;
ALTER TABLE public.taxonomy_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxonomy_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Taxonomy categories are readable by everyone"
  ON public.taxonomy_categories FOR SELECT USING (true);
CREATE POLICY "Taxonomy options are readable by everyone"
  ON public.taxonomy_options FOR SELECT USING (true);

INSERT INTO public.taxonomy_categories (key, label, description) VALUES
  ('languages', 'Languages', 'Languages a person performs or writes in.'),
  ('business_types', 'Business Types', 'Kind of business a business profile represents.');

-- The 9 business types in the onboarding picker (src/data/onboarding.ts businessTypes), in its order.
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order) VALUES
  ('business_types', 'studio',           'Studio',           1),
  ('business_types', 'label',            'Label',            2),
  ('business_types', 'agency',           'Agency',           3),
  ('business_types', 'venue',            'Venue',            4),
  ('business_types', 'dealer',           'Dealer',           5),
  ('business_types', 'rental_provider',  'Rental Provider',  6),
  ('business_types', 'music_school',     'Music School',     7),
  ('business_types', 'production_house', 'Production House', 8),
  ('business_types', 'other',            'Other',            9);

INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order) VALUES
  ('languages', 'hi',  'हिंदी',     1),
  ('languages', 'pa',  'ਪੰਜਾਬੀ',    2),
  ('languages', 'ta',  'தமிழ்',     3),
  ('languages', 'te',  'తెలుగు',    4),
  ('languages', 'bn',  'বাংলা',     5),
  ('languages', 'mr',  'मराठी',     6),
  ('languages', 'gu',  'ગુજરાતી',   7),
  ('languages', 'kn',  'ಕನ್ನಡ',     8),
  ('languages', 'ml',  'മലയാളം',    9),
  ('languages', 'bho', 'भोजपुरी',   10),
  ('languages', 'as',  'অসমীয়া',   11),
  ('languages', 'en',  'English',   12);
