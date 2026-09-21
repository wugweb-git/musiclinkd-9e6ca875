-- Before 20260922220000_rj_podcaster_profiles.sql (22 Sep 2026): the live database had no profile
-- with the rj or podcaster type. The migration only adds rows; this undoes it.

BEGIN;
DELETE FROM public.profile_services WHERE profile_id IN ('06f82052-a882-4c24-aeb1-fdfa46f1f06b', 'c44a75ff-43f2-4122-833b-bd891883bd36', '361fd4d7-df5b-46d7-9f5d-8e76d77532d2', 'c2e62e64-b80c-4041-9879-0528827730ad');
DELETE FROM public.portfolio_items WHERE user_id IN ('06f82052-a882-4c24-aeb1-fdfa46f1f06b', 'c44a75ff-43f2-4122-833b-bd891883bd36', '361fd4d7-df5b-46d7-9f5d-8e76d77532d2', 'c2e62e64-b80c-4041-9879-0528827730ad');
DELETE FROM auth.users WHERE id IN ('06f82052-a882-4c24-aeb1-fdfa46f1f06b', 'c44a75ff-43f2-4122-833b-bd891883bd36', '361fd4d7-df5b-46d7-9f5d-8e76d77532d2', 'c2e62e64-b80c-4041-9879-0528827730ad');
COMMIT;
