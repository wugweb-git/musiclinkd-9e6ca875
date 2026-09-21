-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before the talent services write.
--
-- What changes: public.profile_services gets 2 rows for each of the 61 talent profiles below,
-- 122 rows in all. Migration: supabase/migrations/20260922190000_talent_services_rest.sql.
--
-- Before state:
--   profile_services holds 64 rows in total.
--   None of the 61 profiles below has a row in profile_services (the migration only touches profiles with none).
--   No existing row is updated or deleted.
--
-- Left out on purpose: test and vedanshu (the owner's own sign-ins, version 4 ids), vedanshu.beats,
-- and arjun.mehta and rahul.sharma (no roles).
--
-- The 61 profiles:
--   aanya.malhotra
--   aarav.mehta
--   aditi.sen
--   advait.bose
--   advait.pillai
--   anika.chatterjee
--   anika.mehta
--   anika.menon
--   anika.nair
--   anika.rao
--   arjun.joshi
--   arjun.kapoor
--   arjun.menon
--   arnav.desai
--   arnav.gupta
--   dev.desai
--   dev.nair
--   dev.pillai
--   diya.reddy
--   dj.rish
--   harpreet.singh
--   ira.sharma
--   ishaan.kapoor
--   kabeer.varma
--   kabir.desai
--   kabir.sethi
--   karan.malhotra
--   kavya.chatterjee
--   kunal.pillai
--   lisa.dsouza
--   meera.bose
--   myra.iyer
--   myra.rao
--   naina.chatterjee
--   nikhil.verma
--   ravi.deshmukh
--   reyansh.kulkarni
--   reyansh.pillai
--   rhea.kapoor
--   riya.kapoor
--   riya.khanna
--   riya.rao
--   rohan.deshmukh
--   rohit.malhotra
--   rudra.khanna
--   sanjana.sen
--   sanya.kulkarni
--   shaurya.pillai
--   siddharth.swar
--   tara.bose
--   tara.sharma
--   tarun.pandit
--   the.bangalore.blues.project
--   vihaan.bhatt
--   vihaan.nair
--   vikramaditya.roy
--   vivaan.bose
--   yuvraj.bose
--   yuvraj.mehta
--   zaid.qureshi
--   zara.desai
--
-- To undo (these profiles had no services before, so this removes exactly the rows the migration added):

DELETE FROM public.profile_services
 WHERE profile_id IN (
  '9a5eaae1-90b7-5a8c-beb6-10f5607337d8',
  '11e3d788-1bd9-5d62-ad84-d2df8a6c8022',
  'dde16718-69ca-5aa2-ae03-f510d8fda584',
  '31ea88e0-57b6-5ec5-8276-17ffca4c063c',
  '20d6d5f8-ee83-5fb4-9a04-61fc84fd015f',
  'f1031a1f-7904-516d-b49d-3172abb587bb',
  'f08df374-be6c-5bf6-a4c9-8bd71231903a',
  '17275468-4a59-5e56-b02d-699c3a0f4d09',
  '6c19be0f-9cbf-5220-9a7d-f88f7b85a45f',
  'ad14622c-32a2-5745-ab7a-ac0a07a26d24',
  '5fc28173-c60d-5981-87fc-4dbfdca16100',
  '9078142e-bb3a-59c1-b330-2c9bb54af016',
  'dbb4397e-9c0c-53d8-8624-2825c93d349f',
  '388fbd0a-9c57-5f5d-84e7-45a43890c4a8',
  'd7b2a092-5bed-5b7b-8789-77faad938c7c',
  '498445a9-7943-53f3-b422-7c4997b39288',
  '474dd050-dd84-5115-9947-c19ea69f55b7',
  '0479adfd-6a90-5bf6-b679-d9ab17529e2d',
  '41f1ddee-f88c-5ef0-9e4e-b2ff76d7a168',
  'e7d66ce9-64e6-5650-a18b-06e60db407d2',
  '53147d82-58ac-5f17-97d3-f8125042e764',
  '34585ea4-83cc-5fb0-b0e0-f1076bfbb9b2',
  '7b4d0107-be73-5d90-ba95-1625acf3a663',
  '53c496e2-a238-5f1b-b342-cd86265b6cdb',
  'd30b13f4-1634-5ea5-b7cd-de033e7da7d9',
  '46a358e7-18fd-5c37-abe2-e9244046f3db',
  'a8caa3a8-b2a9-5d96-907d-d48ac5ad6fb4',
  '8fe9b424-31bd-50b5-ac09-b5723e0c742e',
  '7b996651-96d0-5032-b802-5f9b1aaafddd',
  '0f820a59-9f0a-56a6-b1c4-99360bcc0d2c',
  '607904b4-fbaa-5e01-adcd-f93b6a395f33',
  '43bebcf2-e27c-5c90-aa18-dc9ede1e7612',
  'e2a0b264-d862-5918-b5aa-a114bf5aa564',
  'ce7c45cf-ecc1-5b3b-85de-04de6ede4eca',
  'bb118dab-8f76-5b9a-a490-f374f307d022',
  '565f053c-eacc-50cb-854d-d5d2bc06b64e',
  '50301dd7-3b17-501d-8b2e-384a02418d9e',
  '0e7d2282-c460-572c-831a-3370f6c5ae6b',
  'c3276cb0-364e-5eb7-8d5e-7de29465382e',
  '86d5ed33-51cf-58a1-8173-27df428e378b',
  'e698d62c-46e2-5ffe-bb51-4c10a3189e63',
  'cfa46377-c5e2-5acd-a5aa-5a0b2c45acb5',
  '1fc06477-f2c7-53f6-a61b-20a3ca628e10',
  '9908d919-3c31-5ddb-bb44-5b4e0747c64d',
  '9b9015d1-f4dc-5cd0-83f6-c2ae7c21f42e',
  '76d1e631-1a32-59ab-8cf5-96ce884da4e4',
  '51d70213-523b-57f9-b0fa-a708d7fdd026',
  'f5757e8f-5906-53fa-9c64-d99598290958',
  '71361c13-574f-5b8b-bde0-26254d5db0b4',
  '00cedfed-15d6-573c-8b04-574af1c1fa7d',
  '504856ce-a5f9-52c3-b643-77ae8f3f0b89',
  '85365f26-48cb-5792-a096-1fe4de00dbfd',
  'c2b4edcd-eb80-5a4f-86d8-35a2a5a88ad6',
  'fb916678-36bd-58cb-8ad0-1ce8e3981bb8',
  '93fa9c03-0544-5af7-9186-fd34df2cf3a0',
  '5225c8cd-d516-5b13-adb1-c23f24dba427',
  '6bff4ad2-63de-5f0d-80f9-1e27c222bcfc',
  '226be9db-7f22-5f7c-97a6-6294c0c734c0',
  '12a87d86-87b8-5599-a6b7-29301786b921',
  'e441dda1-4f3e-562a-812d-1a5525b9a90e',
  '41bb93a2-c008-5cd9-8527-df24dd257435'
 );

-- After undo, profile_services should hold 64 rows again.
