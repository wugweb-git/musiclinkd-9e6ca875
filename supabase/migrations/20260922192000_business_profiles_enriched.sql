-- Owner, 22 Sep 2026: business profiles carry policies, services, equipment, amenities, rooms, courses and a real bio.
-- Fills what is empty and never replaces existing content, except the 13 one-line placeholder bios ("Studio serving the
-- Kolkata music scene.") which are matched on their exact old text. Left alone: wugweb (owner's studio), octave.sound.labs
-- (a real sign-up) and cd.page (an empty test page). Services follow the Add service rules: specific categories, deliverables,
-- a delivery time from the four choices, one starting price with no unit. Equipment uses one vocabulary: instruments and
-- equipment_categories slugs. Not filled, because they would be invented: artist and talent rosters, team members, gallery
-- photos, reviews, founded year and legal name.
-- Snapshot and undo: supabase/dumps/2026-09-22-before-business-profiles.sql
-- Applied to the live database 2026-09-22: 64 services (186 -> 250), 66 equipment rows (50 -> 116), 11 rooms (14 -> 25),
-- policies on 34 businesses, 29 headlines, 13 bios. Every insert and update is guarded, so running it again changes nothing.

BEGIN;

-- 1. Headlines where there is none.
UPDATE public.profiles p SET headline = v.h, updated_at = now()
  FROM (VALUES
    ('neon.ensemble.agency', 'Bookings for bands and solo acts, Bengaluru'),
    ('nisha.rao.events', 'Festival booking and event promotion, Bengaluru'),
    ('silver.riot.agency', 'Artist and act bookings, Bengaluru'),
    ('swaraj.instruments', 'Sitars, tanpuras, tablas and harmoniums, made and restored in Mumbai'),
    ('ironwood.records', 'Independent rock and folk label, Delhi'),
    ('monsoon.machine.records', 'Independent label, Hyderabad'),
    ('velvet.static.records', 'Independent label, Hyderabad'),
    ('crimson.owls.academy', 'Music school in Anjuna, Goa'),
    ('echo.parade.academy', 'Music school in Chandigarh'),
    ('swar.academy.of.music', 'Hindustani and contemporary music school, Mumbai'),
    ('pulse.live.systems', 'PA, line array, DJ and lighting hire with crew'),
    ('sound.solutions', 'Sound equipment on rent for gigs and events'),
    ('analog.ensemble.studios', 'Recording, mixing and mastering in Kolkata'),
    ('basement.jam.rooms', 'Backlined rehearsal rooms, open late, Delhi'),
    ('beatcraft.studios', 'Beat production for trap, lo-fi and hip-hop'),
    ('beatroute.spaces', 'Rehearsal and tracking space, Mumbai'),
    ('blue.room.mixing.suite', 'A mixing suite in Mumbai'),
    ('headroom.mastering', 'Attended and unattended mastering, Bengaluru'),
    ('jam.room.bandra', 'Hourly rehearsal room in Bandra'),
    ('krimson.avenue', 'Recording and production studio in Koramangala'),
    ('paper.parade.studios', 'Recording, mixing and mastering, Mumbai'),
    ('resonance.acoustic.suites', 'Acoustic tracking suite, Bengaluru'),
    ('soundhouse.studio', 'Studio gear hire and recording, Mumbai'),
    ('the.hive.recording.studio', 'Budget-friendly recording, Mumbai'),
    ('the.humming.tree.live.room', 'A live room for touring bands, Mumbai'),
    ('velvet.vocal.and.foley.studio', 'Vocal recording and foley, Mumbai'),
    ('waveform.podcast.studio', 'Podcast studio with multicam video, Mumbai'),
    ('ironwood.live.hall.and.venue', '400-capacity live hall and venue, Pune'),
    ('blue.sitar.venues', 'Live music venue in Pune')
  ) AS v(u, h)
 WHERE p.username = v.u AND (p.headline IS NULL OR p.headline = '');

-- 2. Placeholder bios, matched on the exact old text.
UPDATE public.profiles p SET bio = v.b, updated_at = now()
  FROM (VALUES
    ('neon.ensemble.agency', 'Booking Agency serving the Bengaluru music scene.', 'A booking agency in Bengaluru placing bands and solo acts at venues, weddings and corporate events. The rider, the fee and the schedule are agreed in writing before the date, and we follow the booking through to the show.'),
    ('silver.riot.agency', 'Booking Agency serving the Bengaluru music scene.', 'A booking agency in Bengaluru for live acts at weddings, brand events, venues and clubs. We agree the fee, the rider and the schedule with the client and the artist before anything is confirmed.'),
    ('monsoon.machine.records', 'Label serving the Hyderabad music scene.', 'An independent label in Hyderabad working with artists from first recording to release. We fund studio time, coordinate the mix and master, and plan each release with the artist.'),
    ('velvet.static.records', 'Label serving the Hyderabad music scene.', 'An independent label in Hyderabad that signs artists, funds their recording and plans each release with them, from the first session to the release date.'),
    ('crimson.owls.academy', 'School serving the Goa music scene.', 'A music school in Anjuna, Goa, teaching vocals, guitar, keys and music production to beginners and working musicians. Lessons run Monday to Saturday, with a trial class before you enrol.'),
    ('echo.parade.academy', 'School serving the Chandigarh music scene.', 'A music school in Chandigarh teaching vocals, guitar, keys and drums to beginners and working musicians. Lessons run Monday to Saturday, with a trial class before you enrol.'),
    ('swar.academy.of.music', 'Hindustani & contemporary music school.', 'A Hindustani and contemporary music school in Mumbai, with vocal and instrumental lessons from beginner to advanced and a trial class before you enrol.'),
    ('analog.ensemble.studios', 'Studio serving the Kolkata music scene.', 'A recording studio in Kolkata with a digital console for tracking, mixing and mastering. Bring a band or a finished mix and work with an engineer in the room.'),
    ('blue.room.mixing.suite', 'Mixing-focused suite.', 'A mixing suite in Mumbai focused on stereo mixing and vocal editing. Send stems, or bring your session and mix with the engineer.'),
    ('resonance.acoustic.suites', 'Acoustic-focused tracking suite.', 'A tracking suite in Bengaluru built around a treated room and a vocal booth, for acoustic, vocal-led and singer-songwriter records.'),
    ('the.humming.tree.live.room', 'Live room for touring bands.', 'A live room in Mumbai for touring bands, showcases and rehearsals, open Tuesday to Sunday from 12:00 to 23:00.'),
    ('velvet.vocal.and.foley.studio', 'Vocal recording & foley specialists.', 'A vocal recording and foley studio in Mumbai, with a vocal booth for singers and voice-over and a room for sound effects.'),
    ('paper.parade.studios', 'Studio serving the Mumbai music scene.', 'A studio in Mumbai with an API console, for tracking, mixing and mastering.')
  ) AS v(u, o, b)
 WHERE p.username = v.u AND p.bio = v.o;

-- 3. Policies, one rule per entry.
UPDATE public.profile_business b SET policies = v.pol, updated_at = now()
  FROM public.profiles p, (VALUES
    ('analog.ensemble.studios', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('beatcraft.studios', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('blue.room.mixing.suite', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('headroom.mastering', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('krimson.avenue', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('paper.parade.studios', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('resonance.acoustic.suites', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('soundhouse.bandra', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('soundhouse.studio', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('the.hive.recording.studio', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('the.humming.tree.live.room', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('velvet.vocal.and.foley.studio', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('waveform.podcast.studio', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('yash.raj.sound.studios', ARRAY['Sessions start and end on time; overtime is charged by the hour.', 'Bring your own hard drive; session files are delivered within the booking.', 'Outside engineers and producers are welcome, with notice.', 'Food and drink stay out of the live and control rooms.', 'Damage to gear is charged at repair cost.']::text[]),
    ('basement.jam.rooms', ARRAY['Bookings are by the hour and end on time.', 'Bring your own sticks, cables and strings.', 'Volume is kept to what the room and neighbours allow.', 'Damage to gear is charged at repair cost.', 'Cancel free up to 24 hours before your slot.']::text[]),
    ('beatroute.spaces', ARRAY['Bookings are by the hour and end on time.', 'Bring your own sticks, cables and strings.', 'Volume is kept to what the room and neighbours allow.', 'Damage to gear is charged at repair cost.', 'Cancel free up to 24 hours before your slot.']::text[]),
    ('jam.room.bandra', ARRAY['Bookings are by the hour and end on time.', 'Bring your own sticks, cables and strings.', 'Volume is kept to what the room and neighbours allow.', 'Damage to gear is charged at repair cost.', 'Cancel free up to 24 hours before your slot.']::text[]),
    ('ironwood.records', ARRAY['Demos are reviewed by email and we reply within two weeks.', 'Every deal is written down and agreed before work starts.', 'Release dates are agreed with the artist and confirmed in writing.', 'Unreleased music is kept confidential.']::text[]),
    ('monsoon.machine.records', ARRAY['Demos are reviewed by email and we reply within two weeks.', 'Every deal is written down and agreed before work starts.', 'Release dates are agreed with the artist and confirmed in writing.', 'Unreleased music is kept confidential.']::text[]),
    ('velvet.static.records', ARRAY['Demos are reviewed by email and we reply within two weeks.', 'Every deal is written down and agreed before work starts.', 'Release dates are agreed with the artist and confirmed in writing.', 'Unreleased music is kept confidential.']::text[]),
    ('swar.academy.of.music', ARRAY['Enrolment is confirmed once the first month''s fee is paid.', 'A trial class is offered before you commit.', 'Missed classes can be rescheduled with 24 hours'' notice.', 'Batch sizes are agreed at enrolment.']::text[]),
    ('crimson.owls.academy', ARRAY['Enrolment is confirmed once the first month''s fee is paid.', 'A trial class is offered before you commit.', 'Missed classes can be rescheduled with 24 hours'' notice.', 'Batch sizes are agreed at enrolment.']::text[]),
    ('echo.parade.academy', ARRAY['Enrolment is confirmed once the first month''s fee is paid.', 'A trial class is offered before you commit.', 'Missed classes can be rescheduled with 24 hours'' notice.', 'Batch sizes are agreed at enrolment.']::text[]),
    ('marigold.reel', ARRAY['Every project starts with a written brief and a quote.', 'Music, sound and picture timelines are agreed before shoot dates.', 'Revisions are limited to the rounds in the quote.', 'Rights and credits are agreed in writing before delivery.']::text[]),
    ('nine.lamps.media', ARRAY['Every project starts with a written brief and a quote.', 'Music, sound and picture timelines are agreed before shoot dates.', 'Revisions are limited to the rounds in the quote.', 'Rights and credits are agreed in writing before delivery.']::text[]),
    ('tarang.audio.visual', ARRAY['Every project starts with a written brief and a quote.', 'Music, sound and picture timelines are agreed before shoot dates.', 'Revisions are limited to the rounds in the quote.', 'Rights and credits are agreed in writing before delivery.']::text[]),
    ('neon.ensemble.agency', ARRAY['Bookings are confirmed with a written agreement and an advance.', 'The artist''s rider is shared before the date and agreed with the venue.', 'Cancellations by the client are charged as set out in the booking terms.', 'Enquiries are answered within two working days.']::text[]),
    ('silver.riot.agency', ARRAY['Bookings are confirmed with a written agreement and an advance.', 'The artist''s rider is shared before the date and agreed with the venue.', 'Cancellations by the client are charged as set out in the booking terms.', 'Enquiries are answered within two working days.']::text[]),
    ('nisha.rao.events', ARRAY['Bookings are confirmed with a written agreement and an advance.', 'The artist''s rider is shared before the date and agreed with the venue.', 'Cancellations by the client are charged as set out in the booking terms.', 'Enquiries are answered within two working days.']::text[]),
    ('pulse.live.systems', ARRAY['A refundable security deposit and ID proof are needed for every rental.', 'Gear is checked together at handover and again on return.', 'Damage or loss is charged at repair or replacement cost.', 'Delivery, set-up and crew are quoted separately.', 'Cancel free up to 48 hours before pickup.']::text[]),
    ('sound.solutions', ARRAY['A refundable security deposit and ID proof are needed for every rental.', 'Gear is checked together at handover and again on return.', 'Damage or loss is charged at repair or replacement cost.', 'Delivery, set-up and crew are quoted separately.', 'Cancel free up to 48 hours before pickup.']::text[]),
    ('swaraj.instruments', ARRAY['Instruments can be tried in the shop before you buy.', 'Repairs and restoration are quoted after inspection.', 'Returns and exchanges are agreed at purchase.', 'Rentals need a deposit and ID proof.']::text[]),
    ('ironwood.live.hall.and.venue', ARRAY['Bookings are confirmed with a deposit; the balance is due before the event.', 'Soundcheck time is booked as part of the hire.', 'Events must end by the licensed time.', 'Outside catering and decor are allowed with notice.', 'Damage to the venue or its fixtures is charged at repair cost.']::text[]),
    ('blue.sitar.venues', ARRAY['Bookings are confirmed with a deposit; the balance is due before the event.', 'Soundcheck time is booked as part of the hire.', 'Events must end by the licensed time.', 'Outside catering and decor are allowed with notice.', 'Damage to the venue or its fixtures is charged at repair cost.']::text[])
  ) AS v(u, pol)
 WHERE p.id = b.profile_id AND p.username = v.u AND cardinality(coalesce(b.policies, '{}')) = 0;

-- 4. Equipment lists, courses and venue features.
UPDATE public.profile_business b SET equipment_list = v.x, updated_at = now()
  FROM public.profiles p, (VALUES
    ('pulse.live.systems', ARRAY['PA systems', 'Line array speakers', 'Stage monitors', 'DJ rigs', 'Stage lighting']::text[]),
    ('sound.solutions', ARRAY['PA systems', 'Microphones', 'Mixers', 'Stage monitors']::text[]),
    ('swaraj.instruments', ARRAY['Sitar', 'Tanpura', 'Tabla', 'Harmonium']::text[]),
    ('soundhouse.studio', ARRAY['Studio microphones', 'Preamps', 'Studio monitors']::text[]),
    ('blue.sitar.venues', ARRAY['In-house sound system', 'Backline']::text[])
  ) AS v(u, x)
 WHERE p.id = b.profile_id AND p.username = v.u AND cardinality(coalesce(b.equipment_list, '{}')) = 0;
UPDATE public.profile_business b SET courses = v.x, updated_at = now()
  FROM public.profiles p, (VALUES
    ('swar.academy.of.music', ARRAY['Hindustani vocal', 'Hindustani instrumental', 'Contemporary vocal', 'Music theory']::text[]),
    ('crimson.owls.academy', ARRAY['Vocal lessons', 'Guitar', 'Keys', 'Music production']::text[]),
    ('echo.parade.academy', ARRAY['Vocal lessons', 'Guitar', 'Keys', 'Drums', 'Music theory']::text[])
  ) AS v(u, x)
 WHERE p.id = b.profile_id AND p.username = v.u AND cardinality(coalesce(b.courses, '{}')) = 0;
UPDATE public.profile_business b SET venue_features = v.x, updated_at = now()
  FROM public.profiles p, (VALUES
    ('blue.sitar.venues', ARRAY['In-house sound', 'Backline for hire']::text[])
  ) AS v(u, x)
 WHERE p.id = b.profile_id AND p.username = v.u AND cardinality(coalesce(b.venue_features, '{}')) = 0;

-- 5. Services, only for a business that has none.
INSERT INTO public.profile_services
  (profile_id, name, description, category, categories, deliverables, turnaround, mode, work_modes, price_paise, availability, sort_order, status)
SELECT p.id, v.name, v.descr, v.cats[1], v.cats, v.deliv, v.ta, v.mode, v.wm, v.price, v.av, v.ord, 'active'
  FROM (VALUES
    ('analog.ensemble.studios', 'Studio recording', 'Tracking in a studio in Kolkata with a house engineer and the studio''s digital console.', ARRAY['studio_recording', 'session_recording']::text[], ARRAY['Engineer for the session', 'Multitrack session files', 'Rough mix of the day']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 340000, 'Weekdays', 0),
    ('analog.ensemble.studios', 'Stereo mixing', 'A stereo mix of your tracked song, with stems and two rounds of revisions.', ARRAY['stereo_mixing']::text[], ARRAY['Stereo mix', 'Stems', 'Two revision rounds']::text[], '1 week', 'Hybrid', ARRAY['in_person', 'remote']::text[], 1360000, 'Weekdays', 1),
    ('analog.ensemble.studios', 'Mastering', 'Mastering for singles and EPs, with a streaming master and a reference check.', ARRAY['streaming_mastering', 'album_mastering']::text[], ARRAY['Streaming master', 'Reference check', 'One round of changes']::text[], '3–5 days', 'Remote', ARRAY['remote']::text[], 340000, 'Weekdays', 2),
    ('basement.jam.rooms', 'Full backline rehearsal room', 'A rehearsal room with drums, amps and a PA, priced by the hour with no minimum.', ARRAY['rehearsal_space']::text[], ARRAY['Drum kit and amps', 'PA with microphones', 'No minimum booking']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 60000, 'Any day', 0),
    ('basement.jam.rooms', 'Acoustic room', 'A smaller room for acoustic sets, writing sessions and vocal practice.', ARRAY['rehearsal_space']::text[], ARRAY['Room for up to four', 'Basic PA', 'No minimum booking']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 35000, 'Any day', 1),
    ('beatroute.spaces', 'Tracking session', 'Tracking space for bands and session players, with an engineer on request.', ARRAY['studio_recording', 'session_recording']::text[], ARRAY['Tracking room', 'Engineer on request', 'Multitrack session files']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 350000, 'Any day', 0),
    ('beatroute.spaces', 'Band rehearsal', 'Rehearsal time in a backlined room in Mumbai, booked by the hour.', ARRAY['rehearsal_space']::text[], ARRAY['Backlined room', 'PA with microphones', 'Hourly booking']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 210000, 'Any day', 1),
    ('blue.room.mixing.suite', 'Stereo mixing', 'Mixing in a room built for it, from your stems, with two rounds of revisions.', ARRAY['stereo_mixing']::text[], ARRAY['Stereo mix', 'Instrumental and a cappella', 'Two revision rounds']::text[], '1 week', 'Hybrid', ARRAY['in_person', 'remote']::text[], 1200000, 'Weekdays', 0),
    ('blue.room.mixing.suite', 'Vocal tuning and editing', 'Tuning, timing and comping on lead and backing vocals before the mix.', ARRAY['vocal_tuning', 'stereo_mixing']::text[], ARRAY['Tuned and comped vocals', 'Edit notes', 'Stems']::text[], '3–5 days', 'Remote', ARRAY['remote']::text[], 600000, 'Weekdays', 1),
    ('headroom.mastering', 'Attended mastering', 'Mastering with the engineer in the room, so you hear changes as they are made.', ARRAY['album_mastering', 'streaming_mastering']::text[], ARRAY['Attended session', 'Masters in your formats', 'Loudness report']::text[], '3–5 days', 'In person', ARRAY['in_person']::text[], 350000, 'Any day', 0),
    ('headroom.mastering', 'Unattended and stem mastering', 'Send your mixes or stems and get masters back for streaming, with one round of changes.', ARRAY['streaming_mastering', 'album_mastering']::text[], ARRAY['Streaming masters', 'Stem mastering on request', 'One round of changes']::text[], '3–5 days', 'Remote', ARRAY['remote']::text[], 250000, 'Any day', 1),
    ('jam.room.bandra', 'Hourly band rehearsal', 'A fully treated room with a drum kit, two amps and a PA with four microphones.', ARRAY['rehearsal_space']::text[], ARRAY['Drum kit', 'Two amps', 'PA with four microphones']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 80000, 'Any day', 0),
    ('jam.room.bandra', 'Pre-production block', 'A three-hour block for pre-production and demo tracking before you go into a studio.', ARRAY['rehearsal_space', 'studio_recording']::text[], ARRAY['Three hours in the room', 'Backlined room', 'Rough demo recording']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 240000, 'Any day', 1),
    ('krimson.avenue', 'Tracking and vocal production', 'Tracking and vocal production for independent artists, in Koramangala.', ARRAY['studio_recording', 'session_vocals']::text[], ARRAY['Engineer', 'Vocal production', 'Session files']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 120000, 'Weekdays', 0),
    ('krimson.avenue', 'Mixing', 'A mix of your tracked song, with stems and two rounds of revisions.', ARRAY['stereo_mixing']::text[], ARRAY['Stereo mix', 'Stems', 'Two revision rounds']::text[], '1 week', 'Hybrid', ARRAY['in_person', 'remote']::text[], 960000, 'Weekdays', 1),
    ('paper.parade.studios', 'Studio recording', 'Tracking in a console-equipped room with a house engineer.', ARRAY['studio_recording']::text[], ARRAY['Engineer for the session', 'Multitrack session files', 'Rough mix of the day']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 420000, 'Weekdays', 0),
    ('paper.parade.studios', 'Mixing on the console', 'A mix of your tracked stems on the studio''s console, with two rounds of revisions.', ARRAY['stereo_mixing']::text[], ARRAY['Stereo mix', 'Stems', 'Two revision rounds']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 2100000, 'Weekdays', 1),
    ('paper.parade.studios', 'Mastering', 'Mastering for singles and albums, with a streaming master.', ARRAY['streaming_mastering', 'album_mastering']::text[], ARRAY['Streaming master', 'Album master', 'One round of changes']::text[], '3–5 days', 'Remote', ARRAY['remote']::text[], 420000, 'Weekdays', 2),
    ('resonance.acoustic.suites', 'Acoustic tracking', 'Tracking for acoustic and vocal-led records in a treated room with a vocal booth.', ARRAY['studio_recording', 'session_vocals']::text[], ARRAY['Treated tracking room', 'Engineer', 'Session files']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 280000, 'Weekdays', 0),
    ('resonance.acoustic.suites', 'Mastering', 'Mastering for acoustic and singer-songwriter releases.', ARRAY['streaming_mastering']::text[], ARRAY['Streaming master', 'Loudness report', 'One round of changes']::text[], '3–5 days', 'Remote', ARRAY['remote']::text[], 280000, 'Weekdays', 1),
    ('soundhouse.studio', 'Studio gear hire', 'Studio-grade microphones, preamps and monitoring for hire, serviced between rentals.', ARRAY['studio_rental']::text[], ARRAY['Microphones, preamps and monitoring', 'Serviced between rentals', 'Set-up notes']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 250000, 'Weekdays', 0),
    ('the.hive.recording.studio', 'Studio recording', 'Budget-friendly tracking for new artists, with an engineer and long opening hours.', ARRAY['studio_recording']::text[], ARRAY['Engineer for the session', 'Session files', 'Rough mix of the day']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 120000, 'Any day', 0),
    ('the.hive.recording.studio', 'Mixing', 'A mix of your tracked song, with two rounds of revisions.', ARRAY['stereo_mixing']::text[], ARRAY['Stereo mix', 'Stems', 'Two revision rounds']::text[], '1 week', 'Hybrid', ARRAY['in_person', 'remote']::text[], 960000, 'Any day', 1),
    ('the.humming.tree.live.room', 'Live room hire', 'A live room for touring bands, showcases and rehearsals.', ARRAY['concerts', 'rehearsal_space']::text[], ARRAY['Live room', 'House PA', 'Load-in support']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 250000, 'Any day', 0),
    ('the.humming.tree.live.room', 'Live session recording', 'Record a live session in the room with an engineer and a multitrack.', ARRAY['studio_recording', 'concerts']::text[], ARRAY['Engineer', 'Multitrack recording', 'Rough mix']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 500000, 'Any day', 1),
    ('velvet.vocal.and.foley.studio', 'Vocal recording', 'Vocal tracking in a booth built for it, with an engineer.', ARRAY['studio_recording', 'session_vocals']::text[], ARRAY['Vocal booth', 'Engineer', 'Comped vocal takes']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 220000, 'Weekdays', 0),
    ('velvet.vocal.and.foley.studio', 'Voice-over', 'Voice-over recording for ads, films and digital content, with edited takes.', ARRAY['voice_over']::text[], ARRAY['Edited takes', 'Clean WAV', 'Script notes']::text[], '1–2 days', 'Hybrid', ARRAY['in_person', 'remote']::text[], 220000, 'Weekdays', 1),
    ('velvet.vocal.and.foley.studio', 'Foley and sound design', 'Custom foley and effects for films, ads and games.', ARRAY['sound_design']::text[], ARRAY['Foley and effects', 'Stems', 'Delivered to picture']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 350000, 'Weekdays', 2),
    ('waveform.podcast.studio', 'Podcast recording', 'A four-microphone podcast room with a producer on the desk.', ARRAY['podcast_production']::text[], ARRAY['Four-microphone room', 'Producer on the desk', 'Raw and edited audio']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 200000, 'Weekdays', 0),
    ('waveform.podcast.studio', 'Video podcast', 'Multicam video capture with the audio, edited and ready to publish.', ARRAY['podcast_production']::text[], ARRAY['Multicam capture', 'Edited episode', 'Audio and video files']::text[], '3–5 days', 'In person', ARRAY['in_person']::text[], 350000, 'Weekdays', 1),
    ('ironwood.live.hall.and.venue', 'Concert and event hire', 'The hall with its line array sound and lighting, for concerts, showcases and private events.', ARRAY['concerts', 'corporate_events', 'private_parties']::text[], ARRAY['Hall hire', 'In-house sound and lighting', 'Backline included']::text[], '2 weeks', 'In person', ARRAY['in_person']::text[], 3750000, 'Any day', 0),
    ('ironwood.live.hall.and.venue', 'Soundcheck and rehearsal slot', 'A slot on the stage before a show, for soundcheck or a full rehearsal.', ARRAY['rehearsal_space', 'concerts']::text[], ARRAY['Stage and sound', 'Engineer', 'Backline included']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 937500, 'Any day', 1),
    ('blue.sitar.venues', 'Venue hire', 'A live music venue in Pune for concerts, private events and showcases, with in-house sound.', ARRAY['concerts', 'private_parties', 'corporate_events']::text[], ARRAY['Venue hire', 'In-house sound', 'Backline available for hire']::text[], '2 weeks', 'In person', ARRAY['in_person']::text[], 2500000, 'Any day', 0),
    ('neon.ensemble.agency', 'Artist booking for events', 'Bands and solo acts for weddings, corporate events and private events, with the rider agreed in advance.', ARRAY['weddings', 'corporate_events', 'private_parties']::text[], ARRAY['Artist shortlist', 'Written agreement', 'Rider agreed with the venue']::text[], '1 week', 'Hybrid', ARRAY['in_person', 'remote']::text[], 3000000, 'Weekdays', 0),
    ('neon.ensemble.agency', 'Live act booking for venues', 'Bands and solo acts for venues and clubs, scheduled by the month.', ARRAY['band_gigs', 'concerts']::text[], ARRAY['Act shortlist', 'Monthly schedule', 'Written agreement']::text[], '1 week', 'Hybrid', ARRAY['in_person', 'remote']::text[], 4000000, 'Weekdays', 1),
    ('silver.riot.agency', 'Artist booking for events', 'Live acts for weddings, brand events and private parties, with the fee, rider and schedule agreed in writing.', ARRAY['weddings', 'corporate_events', 'private_parties']::text[], ARRAY['Artist shortlist', 'Written agreement', 'Rider agreed with the venue']::text[], '1 week', 'Hybrid', ARRAY['in_person', 'remote']::text[], 3000000, 'Weekdays', 0),
    ('silver.riot.agency', 'Live act booking for venues', 'Bands and solo acts for venues and clubs, from a single night to a monthly run.', ARRAY['band_gigs', 'concerts']::text[], ARRAY['Act shortlist', 'Schedule', 'Written agreement']::text[], '1 week', 'Hybrid', ARRAY['in_person', 'remote']::text[], 4000000, 'Weekdays', 1),
    ('nisha.rao.events', 'Festival line-up booking', 'Line-ups for festivals and multi-day events, from headliners to openers.', ARRAY['concerts']::text[], ARRAY['Line-up proposal', 'Artist agreements', 'Schedule']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 10000000, 'Weekdays', 0),
    ('nisha.rao.events', 'Event promotion and production', 'Promotion and on-the-ground production for concerts and festivals.', ARRAY['concerts', 'corporate_events']::text[], ARRAY['Promotion plan', 'Production schedule', 'Day-of coordination']::text[], '2 weeks', 'In person', ARRAY['in_person']::text[], 8000000, 'Weekdays', 1),
    ('ironwood.records', 'Artist development and release', 'Production budget and release support for rock and folk acts: studio days, mix and master, and a release plan.', ARRAY['music_production']::text[], ARRAY['Studio days funded', 'Mix and master', 'Release plan']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 5000000, 'Weekdays', 0),
    ('ironwood.records', 'Recording and production support', 'A producer and studio time for a single or EP, with the release plan agreed up front.', ARRAY['music_production', 'studio_recording']::text[], ARRAY['Producer', 'Studio time', 'Mix-ready session']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 3000000, 'Weekdays', 1),
    ('monsoon.machine.records', 'Artist development and release', 'Studio days, mix and master, and a release plan for signed acts.', ARRAY['music_production']::text[], ARRAY['Studio days funded', 'Mix and master', 'Release plan']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 5000000, 'Weekdays', 0),
    ('monsoon.machine.records', 'Recording and production support', 'A producer and studio time for a single or EP, with the release plan agreed up front.', ARRAY['music_production', 'studio_recording']::text[], ARRAY['Producer', 'Studio time', 'Mix-ready session']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 3000000, 'Weekdays', 1),
    ('velvet.static.records', 'Artist development and release', 'Studio days, mix and master, and a release plan for signed acts.', ARRAY['music_production']::text[], ARRAY['Studio days funded', 'Mix and master', 'Release plan']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 5000000, 'Weekdays', 0),
    ('velvet.static.records', 'Recording and production support', 'A producer and studio time for a single or EP, with the release plan agreed up front.', ARRAY['music_production', 'studio_recording']::text[], ARRAY['Producer', 'Studio time', 'Mix-ready session']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 3000000, 'Weekdays', 1),
    ('swar.academy.of.music', 'Hindustani vocal lessons', 'Weekly Hindustani vocal lessons from beginner to advanced, with a trial class first.', ARRAY['vocal_lessons']::text[], ARRAY['Four lessons a month', 'Trial class', 'Practice plan']::text[], '1–2 days', 'Hybrid', ARRAY['in_person', 'remote']::text[], 450000, 'Any day', 0),
    ('swar.academy.of.music', 'Instrument lessons', 'Lessons on Hindustani and contemporary instruments, one-on-one or in small groups.', ARRAY['instrument_lessons']::text[], ARRAY['Four lessons a month', 'Trial class', 'Practice plan']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 450000, 'Any day', 1),
    ('swar.academy.of.music', 'Online classes', 'Live online classes for students outside Mumbai, on the same syllabus.', ARRAY['online_classes', 'vocal_lessons']::text[], ARRAY['Live online class', 'Class recordings', 'Practice plan']::text[], '1–2 days', 'Remote', ARRAY['remote']::text[], 300000, 'Any day', 2),
    ('crimson.owls.academy', 'Vocal lessons', 'Weekly vocal lessons for beginners and working singers, with a trial class first.', ARRAY['vocal_lessons']::text[], ARRAY['Four lessons a month', 'Trial class', 'Practice plan']::text[], '1–2 days', 'Hybrid', ARRAY['in_person', 'remote']::text[], 400000, 'Any day', 0),
    ('crimson.owls.academy', 'Guitar, keys and production lessons', 'Lessons on guitar, keys and music production, one-on-one or in small groups.', ARRAY['instrument_lessons', 'production_lessons']::text[], ARRAY['Four lessons a month', 'Trial class', 'Practice plan']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 450000, 'Any day', 1),
    ('crimson.owls.academy', 'Online classes', 'Live online classes for students outside Goa.', ARRAY['online_classes']::text[], ARRAY['Live online class', 'Class recordings', 'Practice plan']::text[], '1–2 days', 'Remote', ARRAY['remote']::text[], 300000, 'Any day', 2),
    ('echo.parade.academy', 'Vocal lessons', 'Weekly vocal lessons for beginners and working singers, with a trial class first.', ARRAY['vocal_lessons']::text[], ARRAY['Four lessons a month', 'Trial class', 'Practice plan']::text[], '1–2 days', 'Hybrid', ARRAY['in_person', 'remote']::text[], 400000, 'Any day', 0),
    ('echo.parade.academy', 'Instrument lessons', 'Lessons on guitar, keys and drums, one-on-one or in small groups.', ARRAY['instrument_lessons']::text[], ARRAY['Four lessons a month', 'Trial class', 'Practice plan']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 450000, 'Any day', 1),
    ('echo.parade.academy', 'Online classes', 'Live online classes for students outside Chandigarh.', ARRAY['online_classes']::text[], ARRAY['Live online class', 'Class recordings', 'Practice plan']::text[], '1–2 days', 'Remote', ARRAY['remote']::text[], 300000, 'Any day', 2),
    ('marigold.reel', 'Music video and song shoots', 'Script, shoot and edit for music videos and songs, with the track or score commissioned in-house.', ARRAY['film_scoring', 'music_production']::text[], ARRAY['Script and shoot', 'Edit and grade', 'Commissioned score']::text[], '2 weeks', 'In person', ARRAY['in_person']::text[], 15000000, 'Weekdays', 0),
    ('marigold.reel', 'Scoring and sound for ad films', 'Original music and sound design for ad films, web series and brand films.', ARRAY['film_scoring', 'sound_design']::text[], ARRAY['Original score', 'Sound design pass', 'Stems for the mix']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 8000000, 'Weekdays', 1),
    ('nine.lamps.media', 'Branded content and documentaries', 'Concept, shoot and edit for branded films and documentaries, with music commissioned or licensed.', ARRAY['film_scoring', 'music_production']::text[], ARRAY['Treatment', 'Shoot and edit', 'Commissioned or licensed score']::text[], '2 weeks', 'In person', ARRAY['in_person']::text[], 15000000, 'Weekdays', 0),
    ('nine.lamps.media', 'Original scores and sound design', 'Original scores and sound design for OTT, campaigns and festival films.', ARRAY['film_scoring', 'sound_design']::text[], ARRAY['Original score', 'Sound design pass', 'Stems for the mix']::text[], '2 weeks', 'Hybrid', ARRAY['in_person', 'remote']::text[], 8000000, 'Weekdays', 1),
    ('tarang.audio.visual', 'Film songs and music videos', 'Shooting and editing film songs, music videos and title tracks with vocalists, composers and live musicians.', ARRAY['film_scoring', 'music_production']::text[], ARRAY['Script and shoot', 'Edit and grade', 'Recorded track']::text[], '2 weeks', 'In person', ARRAY['in_person']::text[], 15000000, 'Weekdays', 0),
    ('tarang.audio.visual', 'Live sessions and shoots', 'Multicam shoots of live sessions, with a mixed audio track.', ARRAY['concerts', 'music_production']::text[], ARRAY['Multicam shoot', 'Edit', 'Mixed audio']::text[], '1 week', 'In person', ARRAY['in_person']::text[], 6000000, 'Weekdays', 1),
    ('pulse.live.systems', 'Live sound and PA hire', 'PA systems, line arrays and monitors with crew, delivery and on-site support for gigs and events.', ARRAY['concerts', 'corporate_events', 'private_parties']::text[], ARRAY['PA and monitors', 'Crew and set-up', 'On-site support']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 1500000, 'Any day', 0),
    ('pulse.live.systems', 'DJ rig and stage lighting hire', 'DJ rigs and stage lighting with delivery and set-up.', ARRAY['club_nights', 'private_parties']::text[], ARRAY['DJ rig or lighting', 'Delivery and set-up', 'On-site support']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 800000, 'Any day', 1),
    ('sound.solutions', 'Sound equipment hire', 'PA systems, microphones, mixers and monitors for gigs, events and rehearsals, with delivery.', ARRAY['concerts', 'private_parties', 'corporate_events']::text[], ARRAY['PA, microphones and mixer', 'Delivery', 'Set-up notes']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 600000, 'Any day', 0),
    ('swaraj.instruments', 'Instrument hire', 'Sitars, tanpuras, tablas and harmoniums on rent for recordings and performances.', ARRAY['session_recording', 'concerts']::text[], ARRAY['Instrument on hire', 'Tuned before pickup', 'Deposit refunded on return']::text[], '1–2 days', 'In person', ARRAY['in_person']::text[], 150000, 'Any day', 0)
  ) AS v(u, name, descr, cats, deliv, ta, mode, wm, price, av, ord)
  JOIN public.profiles p ON p.username = v.u
 WHERE NOT EXISTS (SELECT 1 FROM public.profile_services s WHERE s.profile_id = p.id);

-- 6. Studios: amenities, cancellation policy and description, only where empty.
UPDATE public.studios s SET amenities = v.a, updated_at = now()
  FROM (VALUES
    ('beatcraft-studios', ARRAY['wifi', 'air_conditioning', 'drinking_water']::text[]),
    ('krimson-avenue', ARRAY['vocal_booth', 'wifi', 'air_conditioning', 'drinking_water']::text[]),
    ('soundhouse-bandra', ARRAY['live_room', 'vocal_booth', 'wifi', 'air_conditioning', 'drinking_water']::text[]),
    ('soundhouse-studio', ARRAY['wifi', 'air_conditioning', 'drinking_water']::text[])
  ) AS v(slug, a)
 WHERE s.slug = v.slug AND cardinality(coalesce(s.amenities, '{}')) = 0;
UPDATE public.studios s SET cancellation_policy = v.c, updated_at = now()
  FROM (VALUES
    ('analog-ensemble-studios', 'Free cancellation up to 48 hours before the session.'),
    ('beatcraft-studios', 'Free cancellation up to 48 hours before the session.'),
    ('blue-room-mixing-suite', 'Free cancellation up to 48 hours before the session.'),
    ('krimson-avenue', 'Free cancellation up to 48 hours before the session.'),
    ('paper-parade-studios', 'Free cancellation up to 48 hours before the session.'),
    ('resonance-acoustic-suites', 'Free cancellation up to 48 hours before the session.'),
    ('soundhouse-bandra', 'Free cancellation up to 48 hours before the session.'),
    ('soundhouse-studio', 'Free cancellation up to 48 hours before the session.'),
    ('the-hive-recording-studio', 'Free cancellation up to 48 hours before the session.'),
    ('the-humming-tree-live-room', 'Free cancellation up to 48 hours before the session.'),
    ('velvet-vocal-and-foley-studio', 'Free cancellation up to 48 hours before the session.'),
    ('jam-room-bandra', 'Free cancellation up to 24 hours before the slot.'),
    ('beatroute-spaces', 'Free cancellation up to 24 hours before the slot.')
  ) AS v(slug, c)
 WHERE s.slug = v.slug AND (s.cancellation_policy IS NULL OR s.cancellation_policy = '');
UPDATE public.studios s SET description = v.d, updated_at = now()
  FROM (VALUES
    ('analog-ensemble-studios', 'A recording studio in Kolkata with a digital console. Track a band or vocals with a house engineer, then mix and master in the same place.'),
    ('blue-room-mixing-suite', 'A mixing suite in Mumbai for stereo mixing and vocal editing. Send stems, or bring your session and work with the engineer.'),
    ('krimson-avenue', 'A recording and production studio in Koramangala for independent artists: tracking, vocal production and mixing.'),
    ('paper-parade-studios', 'A studio in Mumbai with an API console, for tracking, mixing and mastering.'),
    ('resonance-acoustic-suites', 'A tracking suite in Bengaluru with a treated room and a vocal booth, for acoustic, vocal-led and singer-songwriter records.'),
    ('the-hive-recording-studio', 'A budget-friendly recording studio in Mumbai for new artists, open long hours with an engineer on hand.'),
    ('the-humming-tree-live-room', 'A live room in Mumbai for touring bands, showcases and rehearsals, with a house PA.'),
    ('velvet-vocal-and-foley-studio', 'A vocal recording and foley studio in Mumbai, with a vocal booth for singers and voice-over and a room for sound effects.')
  ) AS v(slug, d)
 WHERE s.slug = v.slug AND (s.description IS NULL OR s.description = '');

-- 7. Studio equipment, only for a studio with none. sort_order 200 and up marks these rows.
INSERT INTO public.studio_equipment (studio_id, name, category, quantity, included, sort_order)
SELECT s.id, v.name, v.cat, v.qty, v.inc, v.ord
  FROM (VALUES
    ('analog-ensemble-studios', 'Large-diaphragm condenser microphones', 'microphones', 2, true, 200),
    ('analog-ensemble-studios', 'Dynamic microphones', 'microphones', 4, true, 201),
    ('analog-ensemble-studios', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 202),
    ('analog-ensemble-studios', 'Nearfield studio monitors', 'studio_monitors', 1, true, 203),
    ('analog-ensemble-studios', 'Mic preamps', 'preamps', 4, true, 204),
    ('analog-ensemble-studios', 'Headphones and cue system', 'headphones', 4, true, 205),
    ('analog-ensemble-studios', 'Avid S6 Digital Console', 'consoles', 1, true, 206),
    ('beatcraft-studios', 'Nearfield studio monitors', 'studio_monitors', 1, true, 200),
    ('beatcraft-studios', 'Audio interface', 'audio_interfaces', 1, true, 201),
    ('beatcraft-studios', 'MIDI controller', 'controllers', 1, true, 202),
    ('beatcraft-studios', 'Drum machine', 'drum_machine', 1, true, 203),
    ('beatcraft-studios', 'Sampler', 'sampler', 1, true, 204),
    ('beatcraft-studios', 'Headphones', 'headphones', 2, true, 205),
    ('beatroute-spaces', 'Drum kit', 'drums', 1, true, 200),
    ('beatroute-spaces', 'Guitar amplifiers', 'amplifiers', 2, true, 201),
    ('beatroute-spaces', 'PA system with four microphones', 'pa_systems', 1, true, 202),
    ('beatroute-spaces', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 203),
    ('beatroute-spaces', 'Dynamic microphones', 'microphones', 4, true, 204),
    ('beatroute-spaces', 'Avid S6 Digital Console', 'consoles', 1, true, 205),
    ('blue-room-mixing-suite', 'Nearfield studio monitors', 'studio_monitors', 1, true, 200),
    ('blue-room-mixing-suite', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 201),
    ('blue-room-mixing-suite', 'Outboard processing', 'outboard', 1, true, 202),
    ('blue-room-mixing-suite', 'Headphones', 'headphones', 2, true, 203),
    ('blue-room-mixing-suite', 'Mixing controller', 'controllers', 1, true, 204),
    ('blue-room-mixing-suite', 'Avid S6 Digital Console', 'consoles', 1, true, 205),
    ('headroom-mastering', 'Mastering-grade monitors', 'studio_monitors', 1, true, 200),
    ('headroom-mastering', 'Analogue processing chain', 'outboard', 1, true, 201),
    ('headroom-mastering', 'Audio interface', 'audio_interfaces', 1, true, 202),
    ('headroom-mastering', 'Headphones', 'headphones', 2, true, 203),
    ('ironwood-live-hall-and-venue', 'PA system', 'pa_systems', 1, true, 200),
    ('ironwood-live-hall-and-venue', 'Stage monitors', 'pa_systems', 4, true, 201),
    ('ironwood-live-hall-and-venue', 'Drum kit', 'drums', 1, true, 202),
    ('ironwood-live-hall-and-venue', 'Backline amplifiers', 'amplifiers', 3, true, 203),
    ('ironwood-live-hall-and-venue', 'Dynamic microphones', 'microphones', 6, true, 204),
    ('jam-room-bandra', 'Drum kit', 'drums', 1, true, 200),
    ('jam-room-bandra', 'Guitar amplifiers', 'amplifiers', 2, true, 201),
    ('jam-room-bandra', 'PA system with four microphones', 'pa_systems', 1, true, 202),
    ('krimson-avenue', 'Large-diaphragm condenser microphones', 'microphones', 2, true, 200),
    ('krimson-avenue', 'Dynamic microphones', 'microphones', 4, true, 201),
    ('krimson-avenue', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 202),
    ('krimson-avenue', 'Nearfield studio monitors', 'studio_monitors', 1, true, 203),
    ('krimson-avenue', 'Mic preamps', 'preamps', 4, true, 204),
    ('krimson-avenue', 'Headphones and cue system', 'headphones', 4, true, 205),
    ('paper-parade-studios', 'Large-diaphragm condenser microphones', 'microphones', 2, true, 200),
    ('paper-parade-studios', 'Dynamic microphones', 'microphones', 4, true, 201),
    ('paper-parade-studios', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 202),
    ('paper-parade-studios', 'Nearfield studio monitors', 'studio_monitors', 1, true, 203),
    ('paper-parade-studios', 'Mic preamps', 'preamps', 4, true, 204),
    ('paper-parade-studios', 'Headphones and cue system', 'headphones', 4, true, 205),
    ('paper-parade-studios', 'API 1608', 'consoles', 1, true, 206),
    ('resonance-acoustic-suites', 'Large-diaphragm condenser microphones', 'microphones', 2, true, 200),
    ('resonance-acoustic-suites', 'Vocal booth microphone chain', 'preamps', 2, true, 201),
    ('resonance-acoustic-suites', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 202),
    ('resonance-acoustic-suites', 'Nearfield studio monitors', 'studio_monitors', 1, true, 203),
    ('resonance-acoustic-suites', 'Headphones and cue system', 'headphones', 4, true, 204),
    ('resonance-acoustic-suites', 'Solid State Logic Origin', 'consoles', 1, true, 205),
    ('soundhouse-bandra', 'Large-diaphragm condenser microphones', 'microphones', 2, true, 200),
    ('soundhouse-bandra', 'Dynamic microphones', 'microphones', 4, true, 201),
    ('soundhouse-bandra', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 202),
    ('soundhouse-bandra', 'Nearfield studio monitors', 'studio_monitors', 1, true, 203),
    ('soundhouse-bandra', 'Mic preamps', 'preamps', 4, true, 204),
    ('soundhouse-bandra', 'Headphones and cue system', 'headphones', 4, true, 205),
    ('soundhouse-studio', 'Studio-grade microphones', 'microphones', 1, false, 200),
    ('soundhouse-studio', 'Preamps', 'preamps', 1, false, 201),
    ('soundhouse-studio', 'Studio monitors', 'studio_monitors', 1, false, 202),
    ('the-hive-recording-studio', 'Large-diaphragm condenser microphones', 'microphones', 2, true, 200),
    ('the-hive-recording-studio', 'Dynamic microphones', 'microphones', 4, true, 201),
    ('the-hive-recording-studio', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 202),
    ('the-hive-recording-studio', 'Nearfield studio monitors', 'studio_monitors', 1, true, 203),
    ('the-hive-recording-studio', 'Mic preamps', 'preamps', 4, true, 204),
    ('the-hive-recording-studio', 'Headphones and cue system', 'headphones', 4, true, 205),
    ('the-hive-recording-studio', 'API 1608', 'consoles', 1, true, 206),
    ('the-humming-tree-live-room', 'PA system', 'pa_systems', 1, true, 200),
    ('the-humming-tree-live-room', 'Stage monitors', 'pa_systems', 4, true, 201),
    ('the-humming-tree-live-room', 'Drum kit', 'drums', 1, true, 202),
    ('the-humming-tree-live-room', 'Backline amplifiers', 'amplifiers', 3, true, 203),
    ('the-humming-tree-live-room', 'Dynamic microphones', 'microphones', 6, true, 204),
    ('the-humming-tree-live-room', 'API 1608', 'consoles', 1, true, 205),
    ('velvet-vocal-and-foley-studio', 'Large-diaphragm condenser microphones', 'microphones', 2, true, 200),
    ('velvet-vocal-and-foley-studio', 'Vocal booth microphone chain', 'preamps', 2, true, 201),
    ('velvet-vocal-and-foley-studio', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 202),
    ('velvet-vocal-and-foley-studio', 'Nearfield studio monitors', 'studio_monitors', 1, true, 203),
    ('velvet-vocal-and-foley-studio', 'Headphones and cue system', 'headphones', 4, true, 204),
    ('velvet-vocal-and-foley-studio', 'Neve 8816 Summing Mixer', 'mixers', 1, true, 205),
    ('yash-raj-sound-studios', 'Large-diaphragm condenser microphones', 'microphones', 2, true, 200),
    ('yash-raj-sound-studios', 'Dynamic microphones', 'microphones', 4, true, 201),
    ('yash-raj-sound-studios', 'Audio interface, 16 inputs', 'audio_interfaces', 1, true, 202),
    ('yash-raj-sound-studios', 'Nearfield studio monitors', 'studio_monitors', 1, true, 203),
    ('yash-raj-sound-studios', 'Mic preamps', 'preamps', 4, true, 204),
    ('yash-raj-sound-studios', 'Headphones and cue system', 'headphones', 4, true, 205),
    ('yash-raj-sound-studios', 'SSL 9000J 72-Channel Console', 'consoles', 1, true, 206)
  ) AS v(slug, name, cat, qty, inc, ord)
  JOIN public.studios s ON s.slug = v.slug
 WHERE NOT EXISTS (SELECT 1 FROM public.studio_equipment e WHERE e.studio_id = s.id);

-- 8. One room for a studio with none, at the studio's own hourly rate.
INSERT INTO public.studio_rooms (studio_id, name, kind, capacity, hourly_rate_paise, sort_order)
SELECT s.id, v.name, v.kind, v.cap, v.rate, 0
  FROM (VALUES
    ('analog-ensemble-studios', 'Studio A', 'Tracking room and control room', 6, 340000),
    ('beatroute-spaces', 'Rehearsal and tracking room', 'Backlined room', 8, 350000),
    ('blue-room-mixing-suite', 'Mix room', 'Mixing suite', 3, 150000),
    ('jam-room-bandra', 'Rehearsal room', 'Backlined rehearsal room', 6, 80000),
    ('krimson-avenue', 'Studio A', 'Tracking room', 5, 120000),
    ('paper-parade-studios', 'Studio A', 'Tracking room with console', 6, 420000),
    ('resonance-acoustic-suites', 'Acoustic suite', 'Treated tracking room and vocal booth', 4, 280000),
    ('the-hive-recording-studio', 'Studio', 'Recording room', 5, 120000),
    ('the-humming-tree-live-room', 'Live room', 'Live room', 25, 250000),
    ('velvet-vocal-and-foley-studio', 'Vocal booth', 'Vocal booth', 2, 220000),
    ('ironwood-live-hall-and-venue', 'Main hall', 'Concert hall', 400, 937500)
  ) AS v(slug, name, kind, cap, rate)
  JOIN public.studios s ON s.slug = v.slug
 WHERE NOT EXISTS (SELECT 1 FROM public.studio_rooms r WHERE r.studio_id = s.id);

COMMIT;
