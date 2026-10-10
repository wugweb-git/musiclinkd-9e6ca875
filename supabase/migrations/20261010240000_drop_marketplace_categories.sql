-- marketplace_categories is deleted (owner, 10 Oct 2026): a listing's category is the tool it lists
-- (instruments, equipment_categories, daw_tools); every listing already stores a tool slug.
-- Applied 10 Oct 2026, after 26b3c03 was published.
-- Opportunity roles are NOT mapped to persona types (owner: "dont point anything; let the keywords
-- and content of each opportunity get the job done"). A mapping run the same day was reverted:
-- every role_required is back to the text it was written with (three "Singer"/"singer" rows now
-- all read "Singer").
BEGIN;
DELETE FROM public.taxonomy_options WHERE category_key = 'marketplace_categories';
DELETE FROM public.taxonomy_categories WHERE key = 'marketplace_categories';
COMMIT;
