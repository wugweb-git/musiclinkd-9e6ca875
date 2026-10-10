-- Snapshot before 20261010140000_drop_retired_categories.sql: taxonomy only, no user data.
-- Undo: run this file.
INSERT INTO public.taxonomy_categories (key, label, description, is_published) VALUES
  ('project_roles', 'Project Roles', 'Role a person plays on one project (distinct from person_types, their platform-wide primary role) — matches availableProjectRoles in PortfolioData.kt.', true),
  ('director_specializations', 'Director Specializations', 'Music Director role profile. Proposed vocabulary.', true),
  ('podcast_categories', 'Podcast Categories', 'Podcaster role profile. Proposed vocabulary.', true)
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.taxonomy_options (category_key, slug, label, sort_order, is_published, metadata) VALUES
  ('project_roles','singer','Singer',1,true,NULL), ('project_roles','composer','Composer',2,true,NULL), ('project_roles','music_director','Music Director',3,true,NULL), ('project_roles','producer','Producer',4,true,NULL), ('project_roles','lyricist','Lyricist',5,true,NULL), ('project_roles','session_musician','Session Musician',6,true,NULL), ('project_roles','dj','DJ',7,true,NULL), ('project_roles','mix_engineer','Mix Engineer',8,true,NULL), ('project_roles','mastering_engineer','Mastering Engineer',9,true,NULL), ('project_roles','sound_designer','Sound Designer',10,true,NULL), ('project_roles','band_member','Band Member',11,true,NULL),
  ('director_specializations','film_music','Film Music',1,true,NULL), ('director_specializations','ott','OTT',2,true,NULL), ('director_specializations','advertising','Advertising',3,true,NULL), ('director_specializations','independent','Independent',4,true,NULL),
  ('podcast_categories','music','Music',1,true,NULL), ('podcast_categories','interview','Interview',2,true,NULL), ('podcast_categories','comedy','Comedy',3,true,NULL), ('podcast_categories','culture','Culture',4,true,NULL), ('podcast_categories','business','Business',5,true,NULL), ('podcast_categories','education','Education',6,true,NULL)
ON CONFLICT (category_key, slug) DO NOTHING;
