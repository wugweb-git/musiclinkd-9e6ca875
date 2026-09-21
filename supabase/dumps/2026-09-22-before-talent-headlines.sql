-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before adding headlines to talent profiles.
-- Migration: supabase/migrations/20260922194000_talent_headlines.sql
--
-- What changes: profiles.headline on 72 completed talent profiles, all of which had no headline (NULL) before.
-- 75 talent profiles had none; arjun.mehta, rahul.sharma and sunidhi.raga are left without one (nothing to build it from).
-- No existing headline is changed.
--
-- To undo: each line clears the headline only if it is still the migration's text, so an edited headline is never cleared.

BEGIN;
UPDATE public.profiles SET headline = NULL WHERE username = 'aanya.malhotra' AND headline = 'Singer and lyricist in New Delhi, working in Rock.';
UPDATE public.profiles SET headline = NULL WHERE username = 'aarav.mehta' AND headline = 'Music producer and composer in Mumbai, working in EDM.';
UPDATE public.profiles SET headline = NULL WHERE username = 'aditi.sen' AND headline = 'Singer and lyricist in Bengaluru, working in Jazz.';
UPDATE public.profiles SET headline = NULL WHERE username = 'advait.bose' AND headline = 'Music producer and sitarist in New Delhi, working in Qawwali.';
UPDATE public.profiles SET headline = NULL WHERE username = 'advait.pillai' AND headline = 'Music producer and sound engineer in Chennai, working in Qawwali.';
UPDATE public.profiles SET headline = NULL WHERE username = 'anika.chatterjee' AND headline = 'Composer and music producer in Ahmedabad, working in Jazz.';
UPDATE public.profiles SET headline = NULL WHERE username = 'anika.mehta' AND headline = 'Guitarist and music producer in Ahmedabad, working in EDM.';
UPDATE public.profiles SET headline = NULL WHERE username = 'anika.menon' AND headline = 'Music producer and sitarist in Ahmedabad, working in Lofi.';
UPDATE public.profiles SET headline = NULL WHERE username = 'anika.nair' AND headline = 'Singer and sitarist in Chennai, working in Indie Pop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'anika.rao' AND headline = 'Guitarist and drummer in Bengaluru, working in Indie Pop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'arijit.sen' AND headline = 'Singer and composer in Mumbai, working in Bollywood.';
UPDATE public.profiles SET headline = NULL WHERE username = 'arjun.joshi' AND headline = 'Singer and keyboardist in Ahmedabad, working in Bhangra.';
UPDATE public.profiles SET headline = NULL WHERE username = 'arjun.kapoor' AND headline = 'Music producer and keyboardist in Bengaluru, working in Ghazal.';
UPDATE public.profiles SET headline = NULL WHERE username = 'arjun.menon' AND headline = 'Composer in Kochi, working in Carnatic Fusion.';
UPDATE public.profiles SET headline = NULL WHERE username = 'arnav.desai' AND headline = 'Singer and guitarist in Bengaluru, working in Qawwali.';
UPDATE public.profiles SET headline = NULL WHERE username = 'arnav.gupta' AND headline = 'Guitarist and drummer in Bengaluru, working in Qawwali.';
UPDATE public.profiles SET headline = NULL WHERE username = 'dev.desai' AND headline = 'Singer and lyricist in Bengaluru, working in R&B.';
UPDATE public.profiles SET headline = NULL WHERE username = 'dev.nair' AND headline = 'Guitarist and music producer in Mumbai, working in Qawwali.';
UPDATE public.profiles SET headline = NULL WHERE username = 'dev.pillai' AND headline = 'Keyboardist and guitarist in New Delhi, working in Ghazal.';
UPDATE public.profiles SET headline = NULL WHERE username = 'diya.reddy' AND headline = 'Singer and composer in Chandigarh, working in Acoustic.';
UPDATE public.profiles SET headline = NULL WHERE username = 'dj.noor' AND headline = 'DJ in Mumbai, working in House.';
UPDATE public.profiles SET headline = NULL WHERE username = 'dj.rish' AND headline = 'Music producer and composer in Anjuna, working in EDM.';
UPDATE public.profiles SET headline = NULL WHERE username = 'harpreet.singh' AND headline = 'Folk vocalist in Amritsar, working in Sufi Devotional.';
UPDATE public.profiles SET headline = NULL WHERE username = 'ira.sharma' AND headline = 'Sound engineer and music producer in Mumbai, working in Bollywood.';
UPDATE public.profiles SET headline = NULL WHERE username = 'ishaan.kapoor' AND headline = 'Music producer and singer in Mumbai, working in Indie Pop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'kabeer.varma' AND headline = 'Sound engineer and music producer in Mumbai, working in Rajasthani Folk.';
UPDATE public.profiles SET headline = NULL WHERE username = 'kabir.desai' AND headline = 'Music producer and sitarist in New Delhi, working in Lofi.';
UPDATE public.profiles SET headline = NULL WHERE username = 'kabir.sethi' AND headline = 'Singer and lyricist in Mumbai, working in Indie Pop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'karan.malhotra' AND headline = 'Music producer and sound engineer in Pune, working in EDM.';
UPDATE public.profiles SET headline = NULL WHERE username = 'karan.saxena' AND headline = 'Guitarist and composer in New Delhi, working in Rock.';
UPDATE public.profiles SET headline = NULL WHERE username = 'kavya.chatterjee' AND headline = 'Sitarist and lyricist in Mumbai, working in Sufi Devotional.';
UPDATE public.profiles SET headline = NULL WHERE username = 'kunal.pillai' AND headline = 'Composer and lyricist in Chennai, working in Ghazal.';
UPDATE public.profiles SET headline = NULL WHERE username = 'lisa.dsouza' AND headline = 'Singer in Panjim, working in Indie Pop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'maya.sharma' AND headline = 'Singer and lyricist in Mumbai, working in Acoustic.';
UPDATE public.profiles SET headline = NULL WHERE username = 'meera.bose' AND headline = 'Singer and composer in Ahmedabad, working in Jazz.';
UPDATE public.profiles SET headline = NULL WHERE username = 'meher.kaur' AND headline = 'Guitarist, mixing engineer and music producer in New Delhi, working in Blues.';
UPDATE public.profiles SET headline = NULL WHERE username = 'myra.iyer' AND headline = 'Sound engineer and singer in Pune, working in EDM.';
UPDATE public.profiles SET headline = NULL WHERE username = 'myra.rao' AND headline = 'Keyboardist and music producer in Mumbai, working in Sufi Devotional.';
UPDATE public.profiles SET headline = NULL WHERE username = 'naina.chatterjee' AND headline = 'Lyricist and sitarist in Bengaluru, working in Reggae.';
UPDATE public.profiles SET headline = NULL WHERE username = 'nikhil.verma' AND headline = 'Sound engineer and sound designer in Mumbai, working in Rock.';
UPDATE public.profiles SET headline = NULL WHERE username = 'nithya.balan' AND headline = 'Singer in Chennai, working in Tamil Film (Kollywood).';
UPDATE public.profiles SET headline = NULL WHERE username = 'ravi.deshmukh' AND headline = 'Guitarist in Mumbai.';
UPDATE public.profiles SET headline = NULL WHERE username = 'reyansh.kulkarni' AND headline = 'Singer and sitarist in Chennai, working in Jazz.';
UPDATE public.profiles SET headline = NULL WHERE username = 'reyansh.pillai' AND headline = 'Drummer and composer in Chennai, working in Sufi Devotional.';
UPDATE public.profiles SET headline = NULL WHERE username = 'rhea.kapoor' AND headline = 'Composer and music producer in Mumbai, working in EDM.';
UPDATE public.profiles SET headline = NULL WHERE username = 'riya.kapoor' AND headline = 'Drummer and sound engineer in Mumbai, working in Hindustani Classical.';
UPDATE public.profiles SET headline = NULL WHERE username = 'riya.khanna' AND headline = 'Composer and keyboardist in New Delhi, working in Ghazal.';
UPDATE public.profiles SET headline = NULL WHERE username = 'riya.rao' AND headline = 'Sound engineer and music producer in Mumbai, working in EDM.';
UPDATE public.profiles SET headline = NULL WHERE username = 'rohan.deshmukh' AND headline = 'Music producer and sound engineer in Pune, working in Acoustic.';
UPDATE public.profiles SET headline = NULL WHERE username = 'rohan.sharma' AND headline = 'Guitarist and music producer in Mumbai, working in Indie Pop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'rohit.malhotra' AND headline = 'Composer and music producer in Mumbai, working in Bollywood.';
UPDATE public.profiles SET headline = NULL WHERE username = 'rudra.khanna' AND headline = 'Lyricist and composer in Hyderabad, working in Sufi Devotional.';
UPDATE public.profiles SET headline = NULL WHERE username = 'sanjana.sen' AND headline = 'Composer and music producer in Bengaluru, working in Hindustani Classical.';
UPDATE public.profiles SET headline = NULL WHERE username = 'sanya.kulkarni' AND headline = 'Composer and lyricist in Pune, working in Rajasthani Folk.';
UPDATE public.profiles SET headline = NULL WHERE username = 'shaurya.pillai' AND headline = 'Singer and music producer in New Delhi, working in R&B.';
UPDATE public.profiles SET headline = NULL WHERE username = 'siddharth.swar' AND headline = 'Sound engineer and sound designer in Chennai, working in Rock.';
UPDATE public.profiles SET headline = NULL WHERE username = 'tanvi.rao' AND headline = 'Singer in Pune, working in Hindustani Classical.';
UPDATE public.profiles SET headline = NULL WHERE username = 'tara.bose' AND headline = 'Music producer and drummer in Mumbai, working in Bollywood.';
UPDATE public.profiles SET headline = NULL WHERE username = 'tara.khanna' AND headline = 'Guitarist and singer in Hyderabad, working in Jazz.';
UPDATE public.profiles SET headline = NULL WHERE username = 'tara.sharma' AND headline = 'Drummer and music producer in Hyderabad, working in Indie Pop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'tarun.pandit' AND headline = 'Sitarist and composer in New Delhi, working in Hindustani Classical.';
UPDATE public.profiles SET headline = NULL WHERE username = 'the.bangalore.blues.project' AND headline = 'Singer and guitarist in Bengaluru, working in Jazz.';
UPDATE public.profiles SET headline = NULL WHERE username = 'vedanshu.beats' AND headline = 'Music producer and sound engineer in Mumbai, working in EDM.';
UPDATE public.profiles SET headline = NULL WHERE username = 'vihaan.bhatt' AND headline = 'Sound engineer and composer in Mumbai, working in Sufi Devotional.';
UPDATE public.profiles SET headline = NULL WHERE username = 'vihaan.nair' AND headline = 'Sitarist and sound engineer in Pune, working in Carnatic Classical.';
UPDATE public.profiles SET headline = NULL WHERE username = 'vikramaditya.roy' AND headline = 'Sitarist and composer in New Delhi, working in Hindustani Classical.';
UPDATE public.profiles SET headline = NULL WHERE username = 'vivaan.bose' AND headline = 'Drummer and composer in Ahmedabad, working in Qawwali.';
UPDATE public.profiles SET headline = NULL WHERE username = 'yuvraj.bose' AND headline = 'Keyboardist and composer in Mumbai, working in Bhangra.';
UPDATE public.profiles SET headline = NULL WHERE username = 'yuvraj.mehta' AND headline = 'Guitarist and drummer in New Delhi, working in Carnatic Classical.';
UPDATE public.profiles SET headline = NULL WHERE username = 'zaid.qureshi' AND headline = 'Rapper and lyricist in Mumbai, working in Hip Hop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'zara.desai' AND headline = 'Lyricist and sitarist in Bengaluru, working in Indie Pop.';
UPDATE public.profiles SET headline = NULL WHERE username = 'zara.menon' AND headline = 'Guitarist and sound engineer in Pune, working in Carnatic Classical.';
COMMIT;
