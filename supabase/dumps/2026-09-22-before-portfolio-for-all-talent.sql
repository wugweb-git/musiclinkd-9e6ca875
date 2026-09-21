-- MusicLinkd live database snapshot (Lovable Cloud, Supabase project ace967d9-a62e-48bb-b076-c3b63b11b185)
-- Taken 2026-09-22 via Lovable query_database, before giving every talent profile a portfolio.
-- Migration: supabase/migrations/20260922193000_portfolio_for_all_talent.sql
--
-- What changes: public.portfolio_items gets 2 rows for each of the 56 completed talent profiles below, 112 rows in all.
-- Before state: portfolio_items held 126 rows; none of these 56 profiles had a row (the migration only touches profiles
-- with none). No existing row is updated or deleted.
-- Left alone: arjun.mehta and rahul.sharma (no roles and no city, so nothing to base a work on) and business profiles.
--
-- To undo (these profiles had no portfolio items before, so this removes exactly the rows the migration added):

DELETE FROM public.portfolio_items
 WHERE user_id IN (SELECT id FROM public.profiles WHERE username IN (
    'aanya.malhotra',
    'aarav.mehta',
    'aditi.sen',
    'advait.bose',
    'advait.pillai',
    'anika.chatterjee',
    'anika.mehta',
    'anika.menon',
    'anika.nair',
    'anika.rao',
    'arjun.joshi',
    'arjun.kapoor',
    'arjun.menon',
    'arnav.desai',
    'arnav.gupta',
    'dev.desai',
    'dev.nair',
    'dev.pillai',
    'diya.reddy',
    'harpreet.singh',
    'ira.sharma',
    'ishaan.kapoor',
    'kabeer.varma',
    'kabir.desai',
    'kabir.sethi',
    'kavya.chatterjee',
    'kunal.pillai',
    'lisa.dsouza',
    'meera.bose',
    'myra.iyer',
    'myra.rao',
    'naina.chatterjee',
    'nikhil.verma',
    'ravi.deshmukh',
    'reyansh.kulkarni',
    'reyansh.pillai',
    'rhea.kapoor',
    'riya.kapoor',
    'riya.khanna',
    'riya.rao',
    'rohan.deshmukh',
    'rudra.khanna',
    'sanjana.sen',
    'sanya.kulkarni',
    'shaurya.pillai',
    'tara.bose',
    'tara.sharma',
    'tarun.pandit',
    'vedanshu.beats',
    'vihaan.bhatt',
    'vihaan.nair',
    'vivaan.bose',
    'yuvraj.bose',
    'yuvraj.mehta',
    'zaid.qureshi',
    'zara.desai'
 ));

-- After undo, portfolio_items should hold 126 rows again.
