Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3dcbb710b9ab8121bff5fba1a628713c as of 2026-09-21T18:14:35.363Z:
<page url="https://app.notion.com/p/3dcbb710b9ab8121bff5fba1a628713c" icon="🗄️">
<ancestor-path>
<parent-data-source url="collection://77172849-2e1e-4be6-a0f5-fa1097e394d2" name="MusicLinkd pages"/>
<ancestor-2-database url="https://app.notion.com/p/2bf0f7448a0549f3849eb7b85cc46cac" title="MusicLinkd pages"/>
<ancestor-3-page url="https://app.notion.com/p/3b8bb710b9ab81078f58d0ddbc2800bb" title="MusicLinkd"/>
<ancestor-4-page url="https://app.notion.com/p/2e3bb710b9ab80a29bb5ea19cd07f641" title="Wugweb HQ"/>
</ancestor-path>
<properties>
{"Labels":["Build"],"Name":"Master Schema","url":"https://app.notion.com/p/3dcbb710b9ab8121bff5fba1a628713c"}
</properties>
<iconMetadata>{"type":"emoji","emoji":"🗄️"}</iconMetadata>
<content>
> Every table in the live database, on one page: a table of all schemas, then, for each schema, a table listing its tables followed by a column table for every one of them (column, type, keys and defaults). **67 tables in 12 schemas**, RLS enabled on all 67. Read from the live Postgres database (Lovable Cloud project `ace967d9-a62e-48bb-b076-c3b63b11b185`) on 21 Sep 2026 — not from the migration files. Row counts are as of that day.
> "Schema" here means a domain group of related tables; they all live in Postgres `public`. Supabase's own `auth` / `storage` schemas are not listed.
## All schemas
<table header-row="true">
<tr>
<td>#</td>
<td>Schema</td>
<td>Tables</td>
<td>Rows</td>
<td>What it covers</td>
</tr>
<tr>
<td>1</td>
<td>Profiles</td>
<td>10</td>
<td>464</td>
<td>People and businesses, their private details, experience, gallery, members</td>
</tr>
<tr>
<td>2</td>
<td>Network & messaging</td>
<td>12</td>
<td>39</td>
<td>Connections, follows, chat, notifications, feed, saved and recent items</td>
</tr>
<tr>
<td>3</td>
<td>Portfolio</td>
<td>3</td>
<td>106</td>
<td>Work samples, credits and their events</td>
</tr>
<tr>
<td>4</td>
<td>Services & bookings</td>
<td>7</td>
<td>51</td>
<td>Services, packages, add-ons, booking requests, rentals, enquiries</td>
</tr>
<tr>
<td>5</td>
<td>Studios</td>
<td>5</td>
<td>76</td>
<td>Studios, rooms, equipment, photos, blocked time</td>
</tr>
<tr>
<td>6</td>
<td>Marketplace</td>
<td>2</td>
<td>24</td>
<td>Gear and instrument listings, offers</td>
</tr>
<tr>
<td>7</td>
<td>Opportunities</td>
<td>3</td>
<td>18</td>
<td>Gigs and jobs, applications, views</td>
</tr>
<tr>
<td>8</td>
<td>Collaborations</td>
<td>5</td>
<td>24</td>
<td>Shared projects, members, events, messages, releases</td>
</tr>
<tr>
<td>9</td>
<td>Trust</td>
<td>9</td>
<td>138</td>
<td>Reviews, reports, verification</td>
</tr>
<tr>
<td>10</td>
<td>Search</td>
<td>2</td>
<td>2</td>
<td>Search events and feedback</td>
</tr>
<tr>
<td>11</td>
<td>Taxonomy & content</td>
<td>7</td>
<td>775</td>
<td>Master data (taxonomy), pairings between taxonomies, CMS pages</td>
</tr>
<tr>
<td>12</td>
<td>Support</td>
<td>2</td>
<td>0</td>
<td>Help feedback and support requests</td>
</tr>
</table>
Four tables have RLS on with **zero policies**, so no signed-in user can read or write them: `reserved_usernames` and `spotify_connections` are by design (reached through `username_available()` and the service role), `opportunity_views` is new and not wired yet, and `portfolio_item_plays` is a bug — play counts always come back empty.
## 1 · Profiles
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`profiles`</td>
<td>46</td>
<td>129</td>
<td>3</td>
<td>One row per person or business; `roles[]` holds person types</td>
</tr>
<tr>
<td>`profile_private`</td>
<td>9</td>
<td>84</td>
<td>3</td>
<td>Private contact and business details (email, phone, GSTIN)</td>
</tr>
<tr>
<td>`profile_business`</td>
<td>17</td>
<td>36</td>
<td>2</td>
<td>Business-only details: address, hours, rosters, capacity</td>
</tr>
<tr>
<td>`profile_members`</td>
<td>11</td>
<td>12</td>
<td>2</td>
<td>Team members of a business profile</td>
</tr>
<tr>
<td>`profile_experience`</td>
<td>10</td>
<td>21</td>
<td>2</td>
<td>Experience entries</td>
</tr>
<tr>
<td>`profile_gallery`</td>
<td>6</td>
<td>36</td>
<td>2</td>
<td>Photos on a profile</td>
</tr>
<tr>
<td>`profile_events`</td>
<td>6</td>
<td>3</td>
<td>2</td>
<td>Events a profile lists</td>
</tr>
<tr>
<td>`profile_role_details`</td>
<td>4</td>
<td>80</td>
<td>2</td>
<td>Per-role details, stored as `details` json (see the profile field map below)</td>
</tr>
<tr>
<td>`reserved_usernames`</td>
<td>3</td>
<td>63</td>
<td>0</td>
<td>Usernames nobody can claim; read only through `username_available()`</td>
</tr>
<tr>
<td>`spotify_connections`</td>
<td>11</td>
<td>0</td>
<td>0</td>
<td>Spotify link; service role only, by design</td>
</tr>
</table>
#### profiles
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, FK → users</td>
</tr>
<tr>
<td>username</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>display_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>headline</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>bio</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>city</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>roles</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>avatar_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>availability</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>onboarding_complete</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>instruments</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>genres</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>languages</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>specialisations</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>work_modes</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>intents</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>contact_channels</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>experience_level</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>country</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>state</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>visibility</td>
<td>text</td>
<td>not null, default 'public'</td>
</tr>
<tr>
<td>links</td>
<td>jsonb</td>
<td>not null, default '\[\]'</td>
</tr>
<tr>
<td>discovery_prefs</td>
<td>jsonb</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>onboarding_step</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>onboarding_draft</td>
<td>jsonb</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>cover_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>hourly_rate_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>budget_tier</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>persona_badges</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>trust_badges</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>is_verified</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>is_available</td>
<td>boolean</td>
<td>not null, default true</td>
</tr>
<tr>
<td>first_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>last_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>qr_style</td>
<td>text</td>
<td>not null, default 'light'</td>
</tr>
<tr>
<td>rate_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>rate_unit</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>area</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>influences</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>response_time</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>rating</td>
<td>numeric(2,1)</td>
<td></td>
</tr>
<tr>
<td>review_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>followers_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>pin_code</td>
<td>text</td>
<td></td>
</tr>
</table>
#### profile_private
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, FK → users</td>
</tr>
<tr>
<td>date_of_birth</td>
<td>date</td>
<td></td>
</tr>
<tr>
<td>gender</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>time_zone</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>device_platform</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>email</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>gstin</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>business_phone</td>
<td>text</td>
<td></td>
</tr>
</table>
#### profile_business
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>PK, FK → profiles</td>
</tr>
<tr>
<td>business_address</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>operating_hours</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>equipment_list</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>artist_roster</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>talent_roster</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>courses</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>capacity</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>venue_features</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>logo_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>hero_banner_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>thumbnail_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>icon_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>founded_year</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>legal_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>maps_url</td>
<td>text</td>
<td></td>
</tr>
</table>
#### profile_members
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>role</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>experience</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>is_leader</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>photo_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>since_year</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'active'</td>
</tr>
</table>
#### profile_experience
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>org</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>start_year</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>end_year</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>detail</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### profile_gallery
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>image_url</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>caption</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### profile_events
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>event_date</td>
<td>date</td>
<td></td>
</tr>
<tr>
<td>venue_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
</table>
#### profile_role_details
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>PK, FK → profiles</td>
</tr>
<tr>
<td>role_slug</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>details</td>
<td>jsonb</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### reserved_usernames
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>reason</td>
<td>text</td>
<td>not null, default 'route'</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### spotify_connections
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>user_id</td>
<td>uuid</td>
<td>PK, FK → users</td>
</tr>
<tr>
<td>spotify_user_id</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>display_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>access_token</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>refresh_token</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>expires_at</td>
<td>timestamptz</td>
<td>not null</td>
</tr>
<tr>
<td>scopes</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>sharing</td>
<td>text</td>
<td>not null, default 'connections'</td>
</tr>
<tr>
<td>revoked</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## 2 · Network & messaging
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`connections`</td>
<td>7</td>
<td>1</td>
<td>4</td>
<td>Connection requests and accepted connections</td>
</tr>
<tr>
<td>`follows`</td>
<td>3</td>
<td>1</td>
<td>3</td>
<td>Who follows whom</td>
</tr>
<tr>
<td>`conversations`</td>
<td>4</td>
<td>1</td>
<td>3</td>
<td>Chat threads</td>
</tr>
<tr>
<td>`conversation_members`</td>
<td>4</td>
<td>2</td>
<td>4</td>
<td>Who is in each thread</td>
</tr>
<tr>
<td>`messages`</td>
<td>5</td>
<td>3</td>
<td>3</td>
<td>Chat messages</td>
</tr>
<tr>
<td>`notifications`</td>
<td>9</td>
<td>12</td>
<td>3</td>
<td>The in-app notification feed</td>
</tr>
<tr>
<td>`notification_preferences`</td>
<td>4</td>
<td>0</td>
<td>3</td>
<td>Per-user notification settings</td>
</tr>
<tr>
<td>`feed_posts`</td>
<td>9</td>
<td>5</td>
<td>2</td>
<td>Home feed posts</td>
</tr>
<tr>
<td>`recently_viewed`</td>
<td>7</td>
<td>9</td>
<td>1</td>
<td>Recently viewed profiles and items</td>
</tr>
<tr>
<td>`saved_items`</td>
<td>5</td>
<td>5</td>
<td>3</td>
<td>Bookmarks (talent, band, studio, business, event, listing)</td>
</tr>
<tr>
<td>`saved_searches`</td>
<td>6</td>
<td>0</td>
<td>3</td>
<td>Saved search filters</td>
</tr>
<tr>
<td>`qr_scans`</td>
<td>4</td>
<td>0</td>
<td>4</td>
<td>QR code scans</td>
</tr>
</table>
#### connections
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>requester_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>addressee_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'pending'</td>
</tr>
<tr>
<td>note</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>responded_at</td>
<td>timestamptz</td>
<td></td>
</tr>
</table>
#### follows
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>follower_id</td>
<td>uuid</td>
<td>PK, FK → profiles</td>
</tr>
<tr>
<td>target_id</td>
<td>uuid</td>
<td>PK, FK → profiles</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### conversations
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>created_by</td>
<td>uuid</td>
<td>FK → profiles</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>last_message_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### conversation_members
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>conversation_id</td>
<td>uuid</td>
<td>PK, FK → conversations</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>PK, FK → profiles</td>
</tr>
<tr>
<td>last_read_at</td>
<td>timestamptz</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### messages
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>conversation_id</td>
<td>uuid</td>
<td>FK → conversations, not null</td>
</tr>
<tr>
<td>sender_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>body</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### notifications
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>recipient_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>actor_profile_id</td>
<td>uuid</td>
<td>FK → profiles</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>body</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>href</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>read_at</td>
<td>timestamptz</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### notification_preferences
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>PK, FK → profiles, default auth.uid()</td>
</tr>
<tr>
<td>channels</td>
<td>jsonb</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>quiet_hours</td>
<td>boolean</td>
<td>not null, default true</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### feed_posts
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>author_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>post_type</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>body</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>media_urls</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>audio_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>likes_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>comments_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### recently_viewed
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>PK, FK → profiles</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>handle</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>detail</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>avatar_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>viewed_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### saved_items
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>user_id</td>
<td>uuid</td>
<td>FK → users, not null</td>
</tr>
<tr>
<td>target_type</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>target_id</td>
<td>uuid</td>
<td>not null</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### saved_searches
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null, default auth.uid()</td>
</tr>
<tr>
<td>scope</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>query</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>filters</td>
<td>jsonb</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### qr_scans
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>scanner_id</td>
<td>uuid</td>
<td>FK → users, not null</td>
</tr>
<tr>
<td>scanned_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## 3 · Portfolio
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`portfolio_items`</td>
<td>19</td>
<td>98</td>
<td>5</td>
<td>Work samples and credits; `kind` follows the Work Types taxonomy, plus `credit`</td>
</tr>
<tr>
<td>`portfolio_item_events`</td>
<td>5</td>
<td>8</td>
<td>2</td>
<td>Views, likes and shares per item</td>
</tr>
<tr>
<td>`portfolio_item_plays`</td>
<td>4</td>
<td>0</td>
<td>0</td>
<td>**Bug:** RLS on with no policies, so reads always come back empty</td>
</tr>
</table>
#### portfolio_items
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>user_id</td>
<td>uuid</td>
<td>FK → users, not null</td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td>not null, default 'track'</td>
</tr>
<tr>
<td>description</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>role</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>collaborators</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>cover_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>media_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>release_year</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>published</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>likes_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>views_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>shares_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>featured</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>duration</td>
<td>text</td>
<td></td>
</tr>
</table>
#### portfolio_item_events
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>bigint</td>
<td>PK</td>
</tr>
<tr>
<td>item_id</td>
<td>uuid</td>
<td>FK → portfolio_items, not null</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>viewer_id</td>
<td>uuid</td>
<td>FK → users, default auth.uid()</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### portfolio_item_plays
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>bigint</td>
<td>PK</td>
</tr>
<tr>
<td>item_id</td>
<td>uuid</td>
<td>FK → portfolio_items, not null</td>
</tr>
<tr>
<td>viewer_id</td>
<td>uuid</td>
<td>FK → users</td>
</tr>
<tr>
<td>played_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## 4 · Services & bookings
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`profile_services`</td>
<td>23</td>
<td>37</td>
<td>2</td>
<td>Bookable services a profile offers</td>
</tr>
<tr>
<td>`profile_service_packages`</td>
<td>13</td>
<td>2</td>
<td>2</td>
<td>Service packages</td>
</tr>
<tr>
<td>`profile_service_addons`</td>
<td>9</td>
<td>2</td>
<td>2</td>
<td>Service add-ons</td>
</tr>
<tr>
<td>`service_category_specialties`</td>
<td>4</td>
<td>4</td>
<td>1</td>
<td>Specialties within a service category</td>
</tr>
<tr>
<td>`booking_requests`</td>
<td>17</td>
<td>4</td>
<td>4</td>
<td>Studio and room bookings; status is a check constraint (requested, reviewing, confirmed, declined, cancelled, completed)</td>
</tr>
<tr>
<td>`rental_bookings`</td>
<td>13</td>
<td>2</td>
<td>4</td>
<td>Equipment rentals; fulfilment is pickup, provider_delivery or courier</td>
</tr>
<tr>
<td>`enquiries`</td>
<td>7</td>
<td>0</td>
<td>3</td>
<td>Enquiries to a business profile</td>
</tr>
</table>
#### profile_services
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>description</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>price_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>price_unit</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>price_note</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>turnaround</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>mode</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>availability</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>category_taxonomy</td>
<td>text</td>
<td>not null, default 'service_categories'</td>
</tr>
<tr>
<td>category</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>pricing_model_taxonomy</td>
<td>text</td>
<td>not null, default 'pricing_models'</td>
</tr>
<tr>
<td>pricing_model</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>min_hours</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'active'</td>
</tr>
<tr>
<td>deliverables</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>requirements</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>work_modes</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>notice</td>
<td>text</td>
<td></td>
</tr>
</table>
#### profile_service_packages
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>service_id</td>
<td>uuid</td>
<td>not null</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>price_paise</td>
<td>bigint</td>
<td>not null</td>
</tr>
<tr>
<td>price_unit</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>includes</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>turnaround</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>revisions</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>is_popular</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### profile_service_addons
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>service_id</td>
<td>uuid</td>
<td>not null</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>label</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>price_paise</td>
<td>bigint</td>
<td>not null</td>
</tr>
<tr>
<td>price_unit</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### service_category_specialties
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>service_category_category</td>
<td>text</td>
<td>not null, default 'service_categories'</td>
</tr>
<tr>
<td>service_category_slug</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>option_category</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>option_slug</td>
<td>text</td>
<td>PK</td>
</tr>
</table>
#### booking_requests
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>studio_id</td>
<td>uuid</td>
<td>FK → studios</td>
</tr>
<tr>
<td>room_id</td>
<td>uuid</td>
<td>FK → studio_rooms</td>
</tr>
<tr>
<td>requester_profile_id</td>
<td>uuid</td>
<td>FK → profiles</td>
</tr>
<tr>
<td>session_date</td>
<td>date</td>
<td>not null</td>
</tr>
<tr>
<td>start_time</td>
<td>time</td>
<td></td>
</tr>
<tr>
<td>end_time</td>
<td>time</td>
<td></td>
</tr>
<tr>
<td>hours</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>people</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>purpose</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>notes</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'requested'</td>
</tr>
<tr>
<td>reply</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>studio_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>requester_name</td>
<td>text</td>
<td></td>
</tr>
</table>
#### rental_bookings
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>listing_id</td>
<td>uuid</td>
<td>FK → marketplace_listings, not null</td>
</tr>
<tr>
<td>renter_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'requested'</td>
</tr>
<tr>
<td>start_date</td>
<td>date</td>
<td>not null</td>
</tr>
<tr>
<td>end_date</td>
<td>date</td>
<td>not null</td>
</tr>
<tr>
<td>quantity</td>
<td>integer</td>
<td>not null, default 1</td>
</tr>
<tr>
<td>fulfilment</td>
<td>text</td>
<td>not null, default 'pickup'</td>
</tr>
<tr>
<td>total_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>deposit_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>note</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### enquiries
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>business_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>sender_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>intent</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>message</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'new'</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## 5 · Studios
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`studios`</td>
<td>25</td>
<td>20</td>
<td>2</td>
<td>A studio space owned by a business</td>
</tr>
<tr>
<td>`studio_rooms`</td>
<td>12</td>
<td>14</td>
<td>2</td>
<td>Bookable rooms in a studio</td>
</tr>
<tr>
<td>`studio_equipment`</td>
<td>7</td>
<td>42</td>
<td>2</td>
<td>Equipment a studio has (Equipment Categories taxonomy)</td>
</tr>
<tr>
<td>`studio_photos`</td>
<td>7</td>
<td>0</td>
<td>2</td>
<td>Studio photos</td>
</tr>
<tr>
<td>`studio_blocks`</td>
<td>7</td>
<td>0</td>
<td>1</td>
<td>Blocked-out time</td>
</tr>
</table>
#### studios
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>owner_profile_id</td>
<td>uuid</td>
<td>FK → profile_business, profiles, not null</td>
</tr>
<tr>
<td>slug</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>description</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>location</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>geo_lat</td>
<td>double precision</td>
<td></td>
</tr>
<tr>
<td>geo_lng</td>
<td>double precision</td>
<td></td>
</tr>
<tr>
<td>hourly_rate_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>rating</td>
<td>numeric(3,2)</td>
<td></td>
</tr>
<tr>
<td>review_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>verified_gold</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>console_type</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>services</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>amenities</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>cancellation_policy</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>operating_hours</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>image_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>images</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>response_time</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>add_ons</td>
<td>jsonb</td>
<td>not null, default '\[\]'</td>
</tr>
<tr>
<td>weekly_hours</td>
<td>jsonb</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>archived_at</td>
<td>timestamptz</td>
<td></td>
</tr>
</table>
#### studio_rooms
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>studio_id</td>
<td>uuid</td>
<td>FK → studios, not null</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>capacity</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>hourly_rate_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>amenities</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>photo_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>gear</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>description</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>tiers</td>
<td>jsonb</td>
<td>not null, default '\[\]'</td>
</tr>
</table>
#### studio_equipment
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>studio_id</td>
<td>uuid</td>
<td>FK → studios, not null</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>category</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>quantity</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>included</td>
<td>boolean</td>
<td>not null, default true</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
</table>
#### studio_photos
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>studio_id</td>
<td>uuid</td>
<td>FK → studios, not null</td>
</tr>
<tr>
<td>subject_type</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>subject_id</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>url</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### studio_blocks
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>studio_id</td>
<td>uuid</td>
<td>FK → studios, not null</td>
</tr>
<tr>
<td>room_id</td>
<td>uuid</td>
<td>FK → studio_rooms</td>
</tr>
<tr>
<td>starts_at</td>
<td>timestamp</td>
<td>not null</td>
</tr>
<tr>
<td>ends_at</td>
<td>timestamp</td>
<td>not null</td>
</tr>
<tr>
<td>reason</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## 6 · Marketplace
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`marketplace_listings`</td>
<td>34</td>
<td>20</td>
<td>2</td>
<td>Gear and instrument listings, for sale or rent</td>
</tr>
<tr>
<td>`marketplace_offers`</td>
<td>7</td>
<td>4</td>
<td>4</td>
<td>Offers on listings</td>
</tr>
</table>
#### marketplace_listings
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>slug</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>seller_profile_id</td>
<td>uuid</td>
<td>FK → profiles</td>
</tr>
<tr>
<td>seller_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>category</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>item_category</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>item_category_kind</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>condition</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>price_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>price_unit</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>price_note</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>image_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>brand</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>model</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>weekly_price_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>monthly_price_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>deposit_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>quantity_available</td>
<td>integer</td>
<td>not null, default 1</td>
</tr>
<tr>
<td>pickup_available</td>
<td>boolean</td>
<td>not null, default true</td>
</tr>
<tr>
<td>delivery_available</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>delivery_fee_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>delivery_note</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>pickup_location</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>min_days</td>
<td>integer</td>
<td>not null, default 1</td>
</tr>
<tr>
<td>max_days</td>
<td>integer</td>
<td>not null, default 30</td>
</tr>
<tr>
<td>notice_period</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>unavailable_dates</td>
<td>date\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>listing_description</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>specs</td>
<td>jsonb</td>
<td>not null, default '\[\]'</td>
</tr>
<tr>
<td>included</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>listing_status</td>
<td>text</td>
<td>not null, default 'active'</td>
</tr>
</table>
#### marketplace_offers
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>listing_id</td>
<td>uuid</td>
<td>FK → marketplace_listings, not null</td>
</tr>
<tr>
<td>buyer_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>amount_paise</td>
<td>integer</td>
<td>not null</td>
</tr>
<tr>
<td>message</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'pending'</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## 7 · Opportunities
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`opportunities`</td>
<td>15</td>
<td>14</td>
<td>2</td>
<td>Gig and job postings</td>
</tr>
<tr>
<td>`opportunity_applications`</td>
<td>8</td>
<td>2</td>
<td>4</td>
<td>Applications to an opportunity</td>
</tr>
<tr>
<td>`opportunity_views`</td>
<td>5</td>
<td>2</td>
<td>0</td>
<td>New, not wired yet; RLS on with no policies</td>
</tr>
</table>
#### opportunities
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>creator_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>slug</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>role_required</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>genres</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>budget_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>budget_unit</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>budget_note</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>collaboration_type</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>location</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'open'</td>
</tr>
<tr>
<td>applicant_count</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### opportunity_applications
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>opportunity_id</td>
<td>uuid</td>
<td>FK → opportunities, not null</td>
</tr>
<tr>
<td>applicant_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>message</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>portfolio_item_ids</td>
<td>uuid\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'pending'</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### opportunity_views
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>bigint</td>
<td>PK</td>
</tr>
<tr>
<td>opportunity_id</td>
<td>uuid</td>
<td>FK → opportunities, not null</td>
</tr>
<tr>
<td>viewer_id</td>
<td>uuid</td>
<td>FK → users</td>
</tr>
<tr>
<td>viewed_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>source</td>
<td>text</td>
<td></td>
</tr>
</table>
## 8 · Collaborations
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`collabs`</td>
<td>23</td>
<td>3</td>
<td>4</td>
<td>Shared projects; a band is a collab type</td>
</tr>
<tr>
<td>`collab_members`</td>
<td>9</td>
<td>11</td>
<td>4</td>
<td>Who is in a collab and in what role</td>
</tr>
<tr>
<td>`collab_events`</td>
<td>12</td>
<td>7</td>
<td>2</td>
<td>Events and milestones on a collab</td>
</tr>
<tr>
<td>`collab_messages`</td>
<td>5</td>
<td>0</td>
<td>3</td>
<td>Collab chat</td>
</tr>
<tr>
<td>`collab_releases`</td>
<td>8</td>
<td>3</td>
<td>2</td>
<td>Releases from a collab</td>
</tr>
</table>
#### collabs
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>slug</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>name</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>tagline</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>bio</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>genres</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>city</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>formed_year</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>avatar_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>cover_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>looking_for</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>availability</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>rate_paise</td>
<td>bigint</td>
<td></td>
</tr>
<tr>
<td>rate_unit</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>is_verified</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>created_by</td>
<td>uuid</td>
<td>FK → profiles</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>type</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>visibility</td>
<td>text</td>
<td>not null, default 'public'</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'active'</td>
</tr>
<tr>
<td>ends_on</td>
<td>date</td>
<td></td>
</tr>
<tr>
<td>project_type</td>
<td>text</td>
<td></td>
</tr>
</table>
#### collab_members
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>collab_id</td>
<td>uuid</td>
<td>PK, FK → collabs</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>PK, FK → profiles</td>
</tr>
<tr>
<td>role</td>
<td>text</td>
<td>not null, default 'member'</td>
</tr>
<tr>
<td>instrument</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>since_year</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'active'</td>
</tr>
<tr>
<td>invited_by</td>
<td>uuid</td>
<td>FK → profiles</td>
</tr>
</table>
#### collab_events
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>collab_id</td>
<td>uuid</td>
<td>FK → collabs, not null</td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>venue</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>city</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>event_date</td>
<td>date</td>
<td></td>
</tr>
<tr>
<td>event_time</td>
<td>time</td>
<td></td>
</tr>
<tr>
<td>date_precision</td>
<td>text</td>
<td>not null, default 'day'</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>ticket_note</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### collab_messages
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>collab_id</td>
<td>uuid</td>
<td>FK → collabs, not null</td>
</tr>
<tr>
<td>sender_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>body</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### collab_releases
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>collab_id</td>
<td>uuid</td>
<td>FK → collabs, not null</td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>release_year</td>
<td>integer</td>
<td></td>
</tr>
<tr>
<td>cover_url</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## 9 · Trust
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`reviews`</td>
<td>12</td>
<td>43</td>
<td>5</td>
<td>Ratings and reviews</td>
</tr>
<tr>
<td>`review_requests`</td>
<td>5</td>
<td>0</td>
<td>3</td>
<td>Requests for a review</td>
</tr>
<tr>
<td>`reports`</td>
<td>8</td>
<td>0</td>
<td>2</td>
<td>User and listing reports</td>
</tr>
<tr>
<td>`verification_requests`</td>
<td>12</td>
<td>0</td>
<td>4</td>
<td>A verification request</td>
</tr>
<tr>
<td>`verification_request_items`</td>
<td>13</td>
<td>0</td>
<td>4</td>
<td>The items submitted in a request</td>
</tr>
<tr>
<td>`verification_request_private`</td>
<td>8</td>
<td>0</td>
<td>4</td>
<td>Sensitive submitted details (ID and phone numbers)</td>
</tr>
<tr>
<td>`verification_requirements`</td>
<td>11</td>
<td>12</td>
<td>1</td>
<td>What each verification type asks for</td>
</tr>
<tr>
<td>`verification_type_details`</td>
<td>16</td>
<td>4</td>
<td>1</td>
<td>Copy and rules for each verification type</td>
</tr>
<tr>
<td>`verification_type_person_types`</td>
<td>3</td>
<td>79</td>
<td>1</td>
<td>Which verification types apply to which person types</td>
</tr>
</table>
#### reviews
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>target_profile_id</td>
<td>uuid</td>
<td>FK → profiles</td>
</tr>
<tr>
<td>author_profile_id</td>
<td>uuid</td>
<td>FK → profiles</td>
</tr>
<tr>
<td>author_name</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>author_org</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>context</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>rating</td>
<td>numeric(2,1)</td>
<td>not null</td>
</tr>
<tr>
<td>body</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>response</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>target_studio_id</td>
<td>uuid</td>
<td>FK → studios</td>
</tr>
<tr>
<td>tags</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
</table>
#### review_requests
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>requester_profile_id</td>
<td>uuid</td>
<td>PK, FK → profiles, default auth.uid()</td>
</tr>
<tr>
<td>asked_profile_id</td>
<td>uuid</td>
<td>PK, FK → profiles</td>
</tr>
<tr>
<td>context</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>asked_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>reminded_at</td>
<td>timestamptz</td>
<td></td>
</tr>
</table>
#### reports
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>reporter_profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null, default auth.uid()</td>
</tr>
<tr>
<td>subject_type</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>subject_id</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>reason</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>detail</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'open'</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### verification_requests
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null</td>
</tr>
<tr>
<td>type_slug</td>
<td>text</td>
<td>FK → verification_type_details, not null</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'unverified'</td>
</tr>
<tr>
<td>submitted_at</td>
<td>timestamptz</td>
<td></td>
</tr>
<tr>
<td>reviewed_at</td>
<td>timestamptz</td>
<td></td>
</tr>
<tr>
<td>reviewed_by</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>expires_at</td>
<td>timestamptz</td>
<td></td>
</tr>
<tr>
<td>reviewer_note</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>rejection_reason</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### verification_request_items
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>request_id</td>
<td>uuid</td>
<td>not null</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>not null</td>
</tr>
<tr>
<td>type_slug</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>requirement_id</td>
<td>uuid</td>
<td>not null</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>state</td>
<td>text</td>
<td>not null, default 'uploaded'</td>
</tr>
<tr>
<td>file_path</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>file_name</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>info_text</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### verification_request_private
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>request_id</td>
<td>uuid</td>
<td>PK</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>not null</td>
</tr>
<tr>
<td>phone</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>id_type_category</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>id_type</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>id_number</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### verification_requirements
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>type_slug</td>
<td>text</td>
<td>FK → verification_type_details, not null</td>
</tr>
<tr>
<td>slug</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>label</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>why</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>is_optional</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>private_field</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### verification_type_details
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>type_category</td>
<td>text</td>
<td>not null, default 'verification_types'</td>
</tr>
<tr>
<td>type_slug</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>verifies</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>what_others_see</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>turnaround</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>applies_to</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>applies_to_every_profile</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>applies_without_role</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>prerequisite_category</td>
<td>text</td>
<td>not null, default 'verification_types'</td>
</tr>
<tr>
<td>prerequisite_slug</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>locked_reason</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>grants_is_verified</td>
<td>boolean</td>
<td>not null, default false</td>
</tr>
<tr>
<td>trust_badge_category</td>
<td>text</td>
<td>not null, default 'trust_badges'</td>
</tr>
<tr>
<td>trust_badge_slug</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### verification_type_person_types
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>type_slug</td>
<td>text</td>
<td>PK, FK → verification_type_details</td>
</tr>
<tr>
<td>person_type_category</td>
<td>text</td>
<td>not null, default 'person_types'</td>
</tr>
<tr>
<td>person_type_slug</td>
<td>text</td>
<td>PK</td>
</tr>
</table>
## 10 · Search
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`search_events`</td>
<td>6</td>
<td>2</td>
<td>1</td>
<td>Searches run</td>
</tr>
<tr>
<td>`search_feedback`</td>
<td>7</td>
<td>0</td>
<td>2</td>
<td>Feedback on search results</td>
</tr>
</table>
#### search_events
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>bigint</td>
<td>PK</td>
</tr>
<tr>
<td>scope</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>query</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>city</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, default auth.uid()</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### search_feedback
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, default auth.uid()</td>
</tr>
<tr>
<td>subject_kind</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>subject_id</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>query</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>reason</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## 11 · Taxonomy & content
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`taxonomy_categories`</td>
<td>6</td>
<td>39</td>
<td>1</td>
<td>The 39 taxonomy categories (see Master Taxonomy)</td>
</tr>
<tr>
<td>`taxonomy_options`</td>
<td>8</td>
<td>420</td>
<td>1</td>
<td>The 420 options; `metadata` jsonb, including the person type `flow` filter</td>
</tr>
<tr>
<td>`genre_languages`</td>
<td>4</td>
<td>43</td>
<td>1</td>
<td>Genre and language pairings</td>
</tr>
<tr>
<td>`person_type_instruments`</td>
<td>4</td>
<td>199</td>
<td>1</td>
<td>Person type and instrument pairings</td>
</tr>
<tr>
<td>`person_type_service_categories`</td>
<td>4</td>
<td>53</td>
<td>1</td>
<td>Person type and service category pairings</td>
</tr>
<tr>
<td>`cms_pages`</td>
<td>15</td>
<td>16</td>
<td>1</td>
<td>Editable content pages</td>
</tr>
<tr>
<td>`cms_categories`</td>
<td>4</td>
<td>5</td>
<td>1</td>
<td>Categories for content pages</td>
</tr>
</table>
#### taxonomy_categories
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>key</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>label</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>description</td>
<td>text</td>
<td>not null, default ''</td>
</tr>
<tr>
<td>is_published</td>
<td>boolean</td>
<td>not null, default true</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### taxonomy_options
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>category_key</td>
<td>text</td>
<td>PK, FK → taxonomy_categories</td>
</tr>
<tr>
<td>slug</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>label</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>is_published</td>
<td>boolean</td>
<td>not null, default true</td>
</tr>
<tr>
<td>metadata</td>
<td>jsonb</td>
<td></td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### genre_languages
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>genre_category</td>
<td>text</td>
<td>not null, default 'genres'</td>
</tr>
<tr>
<td>genre_slug</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>language_category</td>
<td>text</td>
<td>not null, default 'languages'</td>
</tr>
<tr>
<td>language_slug</td>
<td>text</td>
<td>PK</td>
</tr>
</table>
#### person_type_instruments
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>person_type_category</td>
<td>text</td>
<td>not null, default 'person_types'</td>
</tr>
<tr>
<td>person_type_slug</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>instrument_category</td>
<td>text</td>
<td>not null, default 'instruments'</td>
</tr>
<tr>
<td>instrument_slug</td>
<td>text</td>
<td>PK</td>
</tr>
</table>
#### person_type_service_categories
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>person_type_category</td>
<td>text</td>
<td>not null, default 'person_types'</td>
</tr>
<tr>
<td>person_type_slug</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>service_category_category</td>
<td>text</td>
<td>not null, default 'service_categories'</td>
</tr>
<tr>
<td>service_category_slug</td>
<td>text</td>
<td>PK</td>
</tr>
</table>
#### cms_pages
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>slug</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>route</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>title</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>content</td>
<td>text</td>
<td>not null, default ''</td>
</tr>
<tr>
<td>seo_description</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>category</td>
<td>text</td>
<td>FK → cms_categories</td>
</tr>
<tr>
<td>summary</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>kind</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>read_time</td>
<td>text</td>
<td></td>
</tr>
<tr>
<td>body</td>
<td>jsonb</td>
<td>not null, default '\[\]'</td>
</tr>
<tr>
<td>related</td>
<td>text\[\]</td>
<td>not null, default '\{\}'</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
<tr>
<td>popular_rank</td>
<td>integer</td>
<td></td>
</tr>
</table>
#### cms_categories
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>key</td>
<td>text</td>
<td>PK</td>
</tr>
<tr>
<td>label</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>blurb</td>
<td>text</td>
<td>not null, default ''</td>
</tr>
<tr>
<td>sort_order</td>
<td>integer</td>
<td>not null, default 0</td>
</tr>
</table>
## 12 · Support
<table header-row="true">
<tr>
<td>Table</td>
<td>Columns</td>
<td>Rows</td>
<td>Policies</td>
<td>Notes</td>
</tr>
<tr>
<td>`help_feedback`</td>
<td>6</td>
<td>0</td>
<td>3</td>
<td>Feedback on help articles</td>
</tr>
<tr>
<td>`support_requests`</td>
<td>8</td>
<td>0</td>
<td>2</td>
<td>Support requests</td>
</tr>
</table>
#### help_feedback
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>page_slug</td>
<td>text</td>
<td>FK → cms_pages, not null</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null, default auth.uid()</td>
</tr>
<tr>
<td>helpful</td>
<td>boolean</td>
<td>not null</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
#### support_requests
<table header-row="true">
<tr>
<td>Column</td>
<td>Type</td>
<td>Notes</td>
</tr>
<tr>
<td>id</td>
<td>uuid</td>
<td>PK, default gen_random_uuid()</td>
</tr>
<tr>
<td>profile_id</td>
<td>uuid</td>
<td>FK → profiles, not null, default auth.uid()</td>
</tr>
<tr>
<td>topic</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>page_slug</td>
<td>text</td>
<td>FK → cms_pages</td>
</tr>
<tr>
<td>message</td>
<td>text</td>
<td>not null</td>
</tr>
<tr>
<td>status</td>
<td>text</td>
<td>not null, default 'open'</td>
</tr>
<tr>
<td>created_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
<tr>
<td>updated_at</td>
<td>timestamptz</td>
<td>not null, default now()</td>
</tr>
</table>
## Profile field map
A profile holds many things, and only some have their own taxonomy. This maps each of the 30 fields to where it is stored and, where one exists, the taxonomy that supplies its values. It is the `profile_fields` category in the database, which the app reads for display labels; it moved here from Master Taxonomy because it describes schema, not selectable values.
<table header-row="true">
<tr>
<td>#</td>
<td>Field</td>
<td>Stored in</td>
<td>Backed by taxonomy</td>
</tr>
<tr>
<td>1</td>
<td>Covers</td>
<td>`profile_role_details.details → covers_count`</td>
<td>—</td>
</tr>
<tr>
<td>2</td>
<td>Originals</td>
<td>`profile_role_details.details → original_songs_count`</td>
<td>—</td>
</tr>
<tr>
<td>3</td>
<td>Publications</td>
<td>`profile_role_details.details → published_works_count`</td>
<td>—</td>
</tr>
<tr>
<td>4</td>
<td>Event Experience</td>
<td>`profile_role_details.details → event_experience_years`</td>
<td>—</td>
</tr>
<tr>
<td>5</td>
<td>Experience</td>
<td>`profile_role_details.details → years_of_experience`</td>
<td>—</td>
</tr>
<tr>
<td>6</td>
<td>Primary Instrument</td>
<td>`profile_role_details.details → primary_instrument`</td>
<td>`instruments`</td>
</tr>
<tr>
<td>7</td>
<td>Secondary Instruments</td>
<td>`profile_role_details.details → secondary_instruments`</td>
<td>`instruments`</td>
</tr>
<tr>
<td>8</td>
<td>Specialty</td>
<td>`profile_role_details.details → specialty`</td>
<td>Depends on person type (engineer_specialties, lyricist_specializations, director_specializations and similar)</td>
</tr>
<tr>
<td>9</td>
<td>Specializations</td>
<td>`profile_role_details.details → specializations`</td>
<td>Depends on person type (same set as Specialty)</td>
</tr>
<tr>
<td>10</td>
<td>Available</td>
<td>`profiles.is_available`</td>
<td>—</td>
</tr>
<tr>
<td>11</td>
<td>Address</td>
<td>`profile_business.business_address`</td>
<td>—</td>
</tr>
<tr>
<td>12</td>
<td>Hours</td>
<td>`profile_business.operating_hours`</td>
<td>—</td>
</tr>
<tr>
<td>13</td>
<td>Equipment</td>
<td>`profile_business.equipment_list`</td>
<td>—</td>
</tr>
<tr>
<td>14</td>
<td>Artists</td>
<td>`profile_business.artist_roster`</td>
<td>—</td>
</tr>
<tr>
<td>15</td>
<td>Talent</td>
<td>`profile_business.talent_roster`</td>
<td>—</td>
</tr>
<tr>
<td>16</td>
<td>Courses</td>
<td>`profile_business.courses`</td>
<td>—</td>
</tr>
<tr>
<td>17</td>
<td>Capacity</td>
<td>`profile_business.capacity`</td>
<td>—</td>
</tr>
<tr>
<td>18</td>
<td>Features</td>
<td>`profile_business.venue_features`</td>
<td>—</td>
</tr>
<tr>
<td>19</td>
<td>Thumbnail</td>
<td>`profile_business.thumbnail_url`</td>
<td>—</td>
</tr>
<tr>
<td>20</td>
<td>Icon</td>
<td>`profile_business.icon_url`</td>
<td>—</td>
</tr>
<tr>
<td>21</td>
<td>Likes</td>
<td>`portfolio_items.likes_count`</td>
<td>—</td>
</tr>
<tr>
<td>22</td>
<td>Views</td>
<td>`portfolio_items.views_count`</td>
<td>—</td>
</tr>
<tr>
<td>23</td>
<td>Shares</td>
<td>`portfolio_items.shares_count`</td>
<td>—</td>
</tr>
<tr>
<td>24</td>
<td>Email</td>
<td>`profile_private.email`</td>
<td>—</td>
</tr>
<tr>
<td>25</td>
<td>GSTIN</td>
<td>`profile_private.gstin`</td>
<td>—</td>
</tr>
<tr>
<td>26</td>
<td>Phone</td>
<td>`profile_private.business_phone`</td>
<td>—</td>
</tr>
<tr>
<td>27</td>
<td>Production Styles</td>
<td>`profile_role_details.details → production_styles`</td>
<td>—</td>
</tr>
<tr>
<td>28</td>
<td>Monitoring</td>
<td>`profile_role_details.details → monitoring`</td>
<td>—</td>
</tr>
<tr>
<td>29</td>
<td>Turnaround</td>
<td>`profile_role_details.details → turnaround`</td>
<td>—</td>
</tr>
<tr>
<td>30</td>
<td>Session Experience</td>
<td>`profile_role_details.details → session_experience`</td>
<td>—</td>
</tr>
</table>
Other profile columns that do have a taxonomy: `roles` → person_types, `genres` → genres, `instruments` → instruments, `languages` → languages, `intents` → intents, `work_modes` → work_modes, `availability` → availability_status, `visibility` → profile_visibility, `persona_badges` → persona_badges, `trust_badges` → trust_badges.
## Legacy schema
The pre-migration record (the 29 Aug Firestore/admin-store snapshot) and its per-document notes are imported below, followed by the full text of the old *Legacy Schema — canonical record* page. Everything above the legacy sections is the live Postgres schema.
### Legacy admin store — 32 document types
All marked "Schema only": described in the legacy store, not tables in Postgres.
<table header-row="true">
<tr>
<td>Document type</td>
<td>Purpose</td>
<td>Uses taxonomy</td>
<td>Source</td>
</tr>
<tr>
<td>`admin_roles`</td>
<td>Grants an admin role to a uid with grant provenance.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`audit_logs`</td>
<td>Audit record of an actor action against a target path.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`blocks`</td>
<td>One user blocking another, keyed by both uids. Rules live, no data yet.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`brand_assets`</td>
<td>Owner brand asset URLs for logo, icon, thumbnail, banner and variants. No confirmed app-side writer.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`broadcast_messages`</td>
<td>Broadcast message with title, body, audience and send status.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`capabilities`</td>
<td>Per-role capability flags for profiles, opportunities, selling, events and CRM.</td>
<td>person_types</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`chat_threads`</td>
<td>Chat thread holding its member uids.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`chat_threads/{id}/messages`</td>
<td>Individual chat message with sender, text and sent timestamp.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`connections`</td>
<td>PENDING / ACCEPTED / DECLINED. Two competing writers with different record shapes. No Postgres equivalent yet. *(Postgres now has a **`connections`** table.)*</td>
<td>—</td>
<td>Architecture & Mapping §2, audit 29 Aug</td>
</tr>
<tr>
<td>`feed_posts`</td>
<td>Feed post with author denormalisation, media and engagement counts. Denormalisation exists only because the legacy store cannot join — dropped in Postgres.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`flows`</td>
<td>Flow registry entry with key, order, title, description and status. Backs the admin Flow Registry.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`flows/{id}/screens`</td>
<td>Screen registry entry with number, variant, states and collections touched.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`marketplace_items`</td>
<td>Marketplace listing with seller, price, category, condition and availability. Zero real documents — app hardcoded. Price is a string here, a number on studios; fix to integer minor units in the port.</td>
<td>marketplace_categories, equipment_categories</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`marketplace_orders`</td>
<td>Marketplace order with payment, delivery and rental date fields. Rules live, no data yet.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`moderation_flags`</td>
<td>Report flagging a target with reason and moderation review state.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`module_registry`</td>
<td>Module registry entry with enable flag, nav key and remote config key. Toggle exists only in the legacy store; Remote Config mirror deferred.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`offers`</td>
<td>Offer / counter-offer between buyer and seller on a listing. Rules live, no data yet.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`opportunity_applications`</td>
<td>Application to an opportunity with attached portfolio projects and status. Rules live, no data yet.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`page_content`</td>
<td>CMS page content with route, status, body and SEO description. Real admin CRUD, live site never reads it — an admin can save and change nothing. Replaced by cms_pages.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`portfolio_projects`</td>
<td>Published portfolio project with links, roles, collaborators, credits and engagement counts. Rules deployed, no confirmed app-side writer. Superseded by portfolio_items.</td>
<td>project_types, project_roles</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`profile_analytics`</td>
<td>Counters written by the VIEWING client on the legacy plan tier — anyone can inflate their own view count. Needs a trigger or server function; fix in the port.</td>
<td>—</td>
<td>Live read of the legacy store, 14 Sep</td>
</tr>
<tr>
<td>`projects`</td>
<td>Gig/opportunity posting with role, budget, genres and collaboration type.</td>
<td>genres, project_roles, languages, collaboration_types, opportunity_types</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`reviews`</td>
<td>Review of a target entity with rating, text and optional booking link.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`studio_bookings`</td>
<td>P0 conflict on record: rules expect userId / totalAmount / bookingStatus; the Android writer used artistUserId / totalCostAmount / statusKey. No Postgres equivalent yet — booking has no table. *(Postgres now has **`booking_requests`**.)*</td>
<td>booking_statuses</td>
<td>Architecture & Mapping §2, audit 29 Aug</td>
</tr>
<tr>
<td>`studios`</td>
<td>Studio listing with owner, location, rate, amenities, equipment and rooms.</td>
<td>studio_amenities, studio_services</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`support_tickets`</td>
<td>Support ticket with requester, subject, message, status and assignee.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`taxonomy_categories`</td>
<td>Taxonomy category definition with key, label, description and active flag. 29 categories live; 4 ported to Postgres 14 Sep.</td>
<td>—</td>
<td>Master Registry §3 + live read of the legacy store, 14 Sep</td>
</tr>
<tr>
<td>`taxonomy_categories/{id}/options`</td>
<td>Taxonomy option with label, value, sort order, active flag and metadata. Subcollection — flattened to a taxonomy_options table in Postgres.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`user_bookmarks`</td>
<td>Saved-profile bookmark linking an owner uid to a saved user. 100% unwired app-side.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`users`</td>
<td>Core user profile: identity, roles, contact, media and four role-gated extension blocks. The 22-field god-record — split into profiles + per-type tables in Postgres.</td>
<td>person_types, genres, languages, instruments, persona_badges, trust_badges, budget_type</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`verification_requests`</td>
<td>Verification submission with subject, documents, ID type and review state.</td>
<td>verification_id_type</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
<tr>
<td>`widgets`</td>
<td>Widget registry entry with category, purpose, composition, code mapping and visibility. Backs Master Registry §4 — the widget catalogue is a rendering of this type.</td>
<td>—</td>
<td>Master Registry §3, 29 Aug</td>
</tr>
</table>
### Not built
Declared in the legacy schema with zero documents and no confirmed writer. Design fresh rather than porting the shape. Read from the legacy store, 14 Sep.
<table header-row="true">
<tr>
<td>Name</td>
<td>Note</td>
</tr>
<tr>
<td>`notifications`</td>
<td>Declared in the legacy schema, zero documents, no confirmed writer. Do not port the shape — design fresh. *(Postgres now has a live **`notifications`** table.)*</td>
</tr>
<tr>
<td>`user_settings`</td>
<td>Declared in the legacy schema, zero documents, no confirmed writer.</td>
</tr>
</table>
### Notes recorded on the live tables
The purpose and verification notes from the old schema database, kept as written. The last column says where the live database has since moved on.
<table header-row="true">
<tr>
<td>Table</td>
<td>Purpose as recorded</td>
<td>Verified against</td>
<td>Since then</td>
</tr>
<tr>
<td>`band_events`</td>
<td>Shows for a band: date at day or month precision, time, venue, city, a confirmed or hold status and a ticket note (past follows from the date).</td>
<td>20260915130000_bands.sql; live 17 Sep</td>
<td>Table no longer exists: bands are `collabs` rows with type band, and shows are `collab_events`.</td>
</tr>
<tr>
<td>`band_members`</td>
<td>Joins a band to a talent profile with a role of owner, admin or member (one owner per band), an instrument and a since year.</td>
<td>20260915130000_bands.sql; live 17 Sep</td>
<td>Table no longer exists: now `collab_members`.</td>
</tr>
<tr>
<td>`band_releases`</td>
<td>Releases of a band: title, kind single, ep, album or live, release year and cover image.</td>
<td>20260915130000_bands.sql; live 17 Sep</td>
<td>Table no longer exists: now `collab_releases`.</td>
</tr>
<tr>
<td>`bands`</td>
<td>A band is a group of talent profiles with a slug URL key, name, tagline, bio, genres, city, formed year, avatar, cover, open seats, availability and rate; it is not an account and has no username.</td>
<td>20260915130000_bands.sql; live 17 Sep</td>
<td>Table no longer exists: now `collabs` with type band.</td>
</tr>
<tr>
<td>`booking_requests`</td>
<td>Studio/room booking requests from a talent profile to a business's studio.</td>
<td>Confirmed live 18 Sep 2026; real status values: requested, reviewing, confirmed, declined, cancelled, completed (Master Taxonomy's booking_statuses does not match exactly)</td>
<td></td>
</tr>
<tr>
<td>`cms_pages`</td>
<td>CMS page content. Replaces page_content in the legacy store, which nothing ever read.</td>
<td>20260914180000_catalog.sql</td>
<td></td>
</tr>
<tr>
<td>`feed_posts`</td>
<td>Community feed. Author data joined, not denormalised as in the legacy store.</td>
<td>20260914180000_catalog.sql</td>
<td></td>
</tr>
<tr>
<td>`genre_languages`</td>
<td>Join table — genre to language associations.</td>
<td>20260914120000_taxonomy_persona_bucket.sql</td>
<td></td>
</tr>
<tr>
<td>`marketplace_listings`</td>
<td>Buy / sell / rent listings.</td>
<td>20260914180000_catalog.sql</td>
<td></td>
</tr>
<tr>
<td>`marketplace_offers`</td>
<td>Buyer offers/price negotiation on marketplace_listings rows.</td>
<td>Confirmed live 18 Sep 2026 via Lovable query_database</td>
<td></td>
</tr>
<tr>
<td>`opportunities`</td>
<td>Gigs, jobs, briefs. co_write dropped 14 Sep.</td>
<td>20260914190000_opportunities_drop_co_write.sql</td>
<td></td>
</tr>
<tr>
<td>`person_type_instruments`</td>
<td>Join table — which instruments belong to which person type.</td>
<td>20260914120000_taxonomy_persona_bucket.sql</td>
<td></td>
</tr>
<tr>
<td>`person_type_service_categories`</td>
<td>Maps which service categories each person type can offer, as 53 imported rows.</td>
<td>20260915160000_services.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`portfolio_item_plays`</td>
<td>Per-play tracking for portfolio items, meant to feed myPortfolioPlays() counts. BUG found 18 Sep 2026: RLS is enabled with zero policies — a hard deny-all. myPortfolioPlays (src/lib/portfolio.functions.ts) reads this table with the user-scoped client, so the read is always silently blocked and returns \{\}. No insert path exists anywhere in src/ either — nothing ever writes a play event. The feature has no working pipeline at all, not just a misconfiguration.</td>
<td>18 Sep 2026 live DB audit</td>
<td>Still zero policies as of 21 Sep.</td>
</tr>
<tr>
<td>`portfolio_items`</td>
<td>Released work. Credits reference project roles.</td>
<td>supabase/migrations @ 0194491</td>
<td></td>
</tr>
<tr>
<td>`profile_business`</td>
<td>Business profile extension — type, address, GSTIN, operating hours.</td>
<td>supabase/migrations @ 0194491</td>
<td>Business type now lives in `profiles.roles`; GSTIN is in `profile_private`.</td>
</tr>
<tr>
<td>`profile_events`</td>
<td>Events / shows on a profile.</td>
<td>20260914170000_profile_sections.sql</td>
<td></td>
</tr>
<tr>
<td>`profile_experience`</td>
<td>Work history entries on a profile.</td>
<td>20260914170000_profile_sections.sql</td>
<td></td>
</tr>
<tr>
<td>`profile_gallery`</td>
<td>Profile image gallery.</td>
<td>20260914170000_profile_sections.sql</td>
<td></td>
</tr>
<tr>
<td>`profile_members`</td>
<td>Band lineup / org members.</td>
<td>20260914170000_profile_sections.sql</td>
<td>Bands are now `collabs`; this holds the team of a business profile.</td>
</tr>
<tr>
<td>`profile_private`</td>
<td>Date of birth and gender. Owner-only RLS — nothing public selects from it. Added 15 Sep.</td>
<td>20260915100000_profile_private.sql</td>
<td>Also holds email, GSTIN, business phone, time zone and device platform.</td>
</tr>
<tr>
<td>`profile_role_details`</td>
<td>Per-role attributes. Replaces the legacy 9-way discriminated union.</td>
<td>supabase/migrations @ 0194491</td>
<td></td>
</tr>
<tr>
<td>`profile_service_addons`</td>
<td>Extras of a profile service: label, price, price unit and sort order.</td>
<td>20260915160000_services.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`profile_service_packages`</td>
<td>Tiers of a profile service: name, price, price unit, what the tier includes, turnaround, revisions, a popular flag and sort order.</td>
<td>20260915160000_services.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`profile_services`</td>
<td>Services offered and rates.</td>
<td>supabase/migrations @ 0194491</td>
<td></td>
</tr>
<tr>
<td>`profiles`</td>
<td>Core identity. Username, display name, roles\[\], genres\[\], instruments\[\], languages\[\], visibility. RLS on visibility applied 13 Sep.</td>
<td>supabase/migrations @ 0194491</td>
<td></td>
</tr>
<tr>
<td>`rental_bookings`</td>
<td>Equipment rental bookings against marketplace_listings (rental-type items).</td>
<td>Confirmed live 18 Sep 2026</td>
<td></td>
</tr>
<tr>
<td>`reserved_usernames`</td>
<td>Blocklist for username claims.</td>
<td>20260914200000_username_rules.sql</td>
<td></td>
</tr>
<tr>
<td>`reviews`</td>
<td>Reviews. One per author per target; may link to a booking.</td>
<td>20260914180000_catalog.sql</td>
<td></td>
</tr>
<tr>
<td>`saved_items`</td>
<td>Bookmarks — one row per (user, target_type, target_id). target_type: talent/business/studio/band/event/listing, resolving to profiles/studios/bands/profile_events/marketplace_listings respectively.</td>
<td>Confirmed live 18 Sep 2026 via src/lib/saved.functions.ts</td>
<td>The `bands` table no longer exists, but `saved.functions.ts` still reads it for band targets, so saved bands can't resolve (bug).</td>
</tr>
<tr>
<td>`service_category_specialties`</td>
<td>Maps a service category to studio_services and engineer_specialties taxonomy options, as 4 imported rows for mixing and mastering.</td>
<td>20260915160000_services.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`studio_equipment`</td>
<td>Gear available at a studio.</td>
<td>20260914180000_catalog.sql</td>
<td></td>
</tr>
<tr>
<td>`studio_rooms`</td>
<td>Bookable rooms within a studio.</td>
<td>20260914180000_catalog.sql</td>
<td></td>
</tr>
<tr>
<td>`studios`</td>
<td>Studio / space records.</td>
<td>20260914180000_catalog.sql</td>
<td></td>
</tr>
<tr>
<td>`taxonomy_categories`</td>
<td>The category table. 4 of 29 ported from the legacy store so far.</td>
<td>20260914120000_taxonomy_persona_bucket.sql</td>
<td>Now 39 categories.</td>
</tr>
<tr>
<td>`taxonomy_options`</td>
<td>The option values — 121 rows across 4 categories. This is the source of truth for values, not Notion.</td>
<td>20260914120000_taxonomy_persona_bucket.sql</td>
<td>Now 420 options across 39 categories.</td>
</tr>
<tr>
<td>`verification_request_items`</td>
<td>One row per requirement of a verification request, holding its state (uploaded, missing or rejected) and either a file in the private verification-documents bucket for a document requirement or info_text for an info requirement.</td>
<td>20260915170000_verification.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`verification_request_private`</td>
<td>The private values of a verification request: phone, id_type from the verification_id_type taxonomy, and id_number.</td>
<td>20260915170000_verification.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`verification_requests`</td>
<td>One verification request per profile and type, carrying its status (unverified, in_review, verified, rejected or expired) and review fields, with at most one open request per profile and type.</td>
<td>20260915170000_verification.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`verification_requirements`</td>
<td>The requirements of each verification type: slug, label, why it is asked for, kind document or info, whether it is optional, an optional private field and sort order (12 rows imported).</td>
<td>20260915170000_verification.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`verification_type_details`</td>
<td>One row per verification_types option holding what it verifies, what others see, turnaround, who it applies to, its prerequisite type and locked reason, whether it grants is_verified, and its trust badge.</td>
<td>20260915170000_verification.sql; live 17 Sep</td>
<td></td>
</tr>
<tr>
<td>`verification_type_person_types`</td>
<td>Maps which person types can apply for which verification type, replacing the app's verificationTypesFor (81 rows).</td>
<td>20260915170000_verification.sql; live 17 Sep</td>
<td>Now 79 rows.</td>
</tr>
</table>
### Legacy Schema — canonical record (Firestore, 29 Aug 2026)
Imported in full from the old *Legacy Schema — canonical record* page. It describes the legacy Firestore store that still backs the admin panel; the live product uses the Postgres schema above. Its own notes say: the source of truth is `admin/types/firestore.ts` and `firestore.rules`; admin readiness, schema definition and Android persistence are separate statuses; known mismatches are preserved, not normalised. A companion snapshot of the same 34 Firestore document types sits in Master Registry §3 (as of 29 Aug); if the two disagree, treat the more recently edited as more likely current and flag the conflict.
#### users/\{userId\}
Core fields (confirmed written by the app): `displayName`, `email`, `primaryRole`, `secondaryRole`, `isVerified`, `isBanned`, `isAvailable`, `hourlyRate`, `location`, `bio`, `genres[]`, `languages[]`, `instruments[]`, `personaBadges[]`, `trustBadges[]` (admin-granted only), `avatarUrl`, `createdAt`, `updatedAt`.
Added to the type but **unconfirmed as app-written**: `profileType` (TALENT, BAND, BUSINESS or VENUE — write-locked after creation via `firestore.rules`), `mobileNumber`, `whatsappNumber`, `fcmToken`, `externalLinks` (spotify, instagram, youtube, linkedin, website, twitter, soundcloud, appleMusic, bandcamp, all optional), `instrumentProficiency[]`, `roleExperience` (map), plus family-extension fields:
- **Business:** `businessName`, `businessType` (Studio, Label, School, Dealer), `businessAddress`, `tagline`, `operatingHours`, `gstin`, `services[]`, `equipmentList[]`.
- **Band:** `bandName`, `lineupMembers[]` (name, role, isLeader), `techRiderUrl`, `stagePlotUrl`.
- **Venue:** `venueName`, `capacity`, `venueFeatures[]`, `eventCalendar[]`.
#### Collections with real, deployed rules, and their Android-side status
**Confirmed writers with schema conflicts**
- `studio_bookings/{bookingId}` — schema and rules expect `studioId`, `userId`, `date`, `slotText`, `totalAmount`, `bookedHourSlots[]`, `bookingStatus`, `paymentStatus`, `paymentTransactionId`, `createdAt`. The Android booking writer (`StudioBookingScreens.kt`) used incompatible names — `artistUserId`, `totalCostAmount`, `statusKey` — confirmed broken as of 2026-08-11. **CONFLICT — needs a code fix and live verification.**
- `connections/{senderUid_targetUserId}` — one writer (`FirebaseManager.sendConnectionRequest`) follows the composite-ID model; `ConnectionsScreen.kt` also writes a different, non-composite document. **CONFLICT.**
- `feed_posts/{postId}` — a writer and reader exist, but they use `content` where the schema has `text`, denormalise `authorName` / `authorRole`, and mismatch on the media URL. Live data exists, so any fix needs a migration plan, not a plain rename. **CONFLICT.**
**Historical status.** Earlier audit evidence found only a small subset of Firestore collections used by Android in a schema-consistent way. Later admin and schema work expanded Firestore readiness but did not automatically make Android writers live. Always separate "schema exists" from "app writes correctly".
**Schema-only, not proven from Android:** `modules/{moduleKey}`, `reviews/{authorUid_targetId}`, `verification_requests/{requestId}`, `projects/{projectId}`, `user_bookmarks/{ownerUid_savedUserId}`, `portfolio_projects/{projectId}`, `notifications/{notificationId}`, `user_settings/{userId}`, `brand_assets/{assetId}`. The last four were added to `admin/types/firestore.ts` and `firestore.rules` so the collections are ready when the app starts writing to them (see AI Studio Sync Prompts, Prompt F).
Other implementation findings retained:
- Portfolio publishing was found to be in-memory and hardcoded on Android.
- The business and studio workspace was found to be mocked and local.
- The module registry is an admin and backend capability; mobile consumption of module enable/disable remains to be wired and verified.
- Notifications have a Firestore model, but no deployed Cloud Function writes them server-side on the Spark-plan architecture.
- Remote Config mirroring was deferred; module enable/disable is Firestore-only in the MVP.
#### portfolio_projects/\{projectId\} — reconciled target shape
A top-level collection with `ownerUid`, not under `/users/{uid}` or `/musicians/{uid}`. Fields grounded in the real Portfolio UI: `projectId`, `ownerUid`, `name`, `description`, `type` (from `project_types`), `releaseDate`, `status` (Released, Upcoming, In Production, Draft), `visibility` (Public, Connections Only, Private Draft), `spotifyUrl`, `appleMusicUrl`, `youtubeUrl`, `soundcloudUrl`, `mixcloudUrl`, `instagramReelUrl`, `ownerRoles[]` (from `project_roles`), `collaborators[]`, `credits[]`, `artworkTheme` (a palette keyword, not an uploaded Storage URL), `projectViews`, `likes`, `shares`, `createdAt`, `lastUpdatedAt`. Do not introduce generic `externalLinks`, `bannerMediaUrl`, `commentCount` or `durationSeconds` as required fields: AI Studio proposed them but the current UI does not back them. Real artwork and media upload is a separate future scope.
#### notifications/\{notificationId\}
`userId`, `title`, `body`, `type` (CONNECTION_REQUEST, BOOKING_UPDATE, REVIEW_RECEIVED, SYSTEM_ALERT, GIG_MATCH), `isRead`, `targetUrl?`, `createdAt`. Rules: any signed-in user can create (no Cloud Functions exist to do it server-side on the Spark plan); only the target user can mark read or delete.
#### user_settings/\{userId\}
Doc ID is the user's own UID. `pushNotificationsEnabled`, `emailNotificationsEnabled`, `profileVisibility` (PUBLIC, CONNECTIONS_ONLY, PRIVATE), `darkModeEnabled`, `currency`, `language`, `updatedAt`. Rules: owner or admin only.
#### brand_assets/\{assetId\}
`ownerUid`, `logoUrl?`, `iconUrl?`, `thumbnailUrl?`, `heroBannerUrl?`, `darkVariantUrl?`, `lightVariantUrl?`, `updatedAt`. Rules: public read, owner-uid write pattern.
#### Taxonomy categories (taxonomy_categories/\{categoryId\}/options/\{optionId\})
Public read, admin write. Uniform option shape: label, value, sortOrder, isActive, metadata?. The principle is one generic taxonomy system rather than parallel `metadata_*` collections. Categories recorded: `person_types`, `languages`, `genres`, `instruments`, `persona_badges`, `project_types`, `project_roles`, `booking_statuses`, `studio_amenities`, `collaboration_types`, `trust_badges`, plus proposed categories such as `profile_types` and `business_types`. A milestone of **128 taxonomy options written to Firestore** is recorded; it shows data population, not that every screen switched from hardcoded lists. Not every string is taxonomy: named streaming-link fields stay explicit until the UI becomes dynamic.
#### Naming and architecture decisions worth remembering
- User-owned domain collections use a top-level collection plus an owner UID field. No `/musicians/{uid}/...` subcollections as a parallel architecture.
- The five core onboarding master-data categories map to the generic taxonomy system: `person_types`, `languages`, `genres`, `instruments`, `persona_badges`.
- `project_types` and `project_roles` are separate concepts; a person's identity role must not be conflated with their role on one project.
- `project_formats` should not duplicate `project_types` unless the product proves a distinct concept.
- Social and external link types are not a generic taxonomy because the live UI uses fixed named fields.
- Existing deployed field names take precedence over AI-proposed renames when a rename would break dependent admin pages or rules (for example `ModerationFlagDoc`'s `reportedBy` versus the proposed `reporterUid`, and `VerificationRequestDoc`'s `subjectType` / `subjectId` / `submittedBy` versus the proposed `userId`). See `admin/app/(admin)/moderation/page.tsx` and `admin/app/(admin)/verification/page.tsx`.
- The schema page must preserve known conflicts rather than overwrite them with the newest proposal.
#### Known implementation conflicts retained
- `studio_bookings`: `userId` schema and rules versus the Android `artistUserId` writer.
- `connections`: composite-ID writer versus an alternate non-composite writer.
- `feed_posts`: schema and data-shape mismatch.
- `portfolio_projects`: schema and admin readiness exist, but Android end-to-end persistence was not proven.
- Business and studio data: schema and admin support exist, but the Android workspace was mocked and local.
- Android Firebase setup: a historical fallback or mock configuration prevented proving production sync.
#### Environment and backend note (as of 29 Aug — superseded)
The MVP then used one Firebase project, `musiclinkd-7ae30`, with Supabase registered only as an alternative backend for deferred work, and the page said not to describe Supabase as the current data store. That is no longer true: the live product runs on Supabase Postgres (the schema above), and Firebase serves only the admin panel.
#### Latest reconciliation — schema implications
- **Identity:** keep `users`, profile family or type, role profiles and project roles separate; no parallel role or profile collections without a documented need.
- **Opportunities:** represented within the existing project and opportunity architecture, not a parallel `gig_opportunities` system. Required attributes: role, location, collaboration type, budget, applicant count and status, timeline.
- **Marketplace:** distinct transaction semantics for GEAR_SALE, GEAR_RENTAL, BEATS_LICENSING, STEMS, MIXING_MASTERING and CREATIVE_SERVICES. Buy, sell and rent may share listing primitives but keep their own fields and state machines.
- **Booking:** ownership is a critical reconciliation item. The canonical field is `userId`; legacy Android evidence used `artistUserId` and other variants. No new writer accepted until the canonical field is enforced across schema, rules and clients.
- **Reviews:** one review per author per target, optionally linked to an eligible booking or transaction for verified reviews.
- **Connections:** canonical states PENDING, ACCEPTED, DECLINED; all writers must be reconciled before the schema is declared stable.
- **Feed and content drift:** `content` versus `text`, and media field naming, stay recorded as drift until all writers and readers are reconciled.
- **Taxonomy:** the generic taxonomy stays the master-data mechanism; explicit fields stay explicit where the UI contract needs named fields. The 128-option insertion is evidence of population, not of universal client use.
- **Evidence states:** every schema section carries one of CANONICAL, IMPLEMENTED, VERIFIED LIVE, PARTIAL, MOCK, CONFLICT, PROPOSED, DEFERRED.
#### Schema integrity verification — 29 Aug 2026
**Status: reconciled; runtime compatibility open.** The canonical schema was updated with the profile-family fields, portfolio target model, notifications, user settings, brand assets and taxonomy structure. These are schema and admin definitions, not proof that Android persists them.
Decisions verified: canonical identity stays `users/{userId}` (do not revive the ad-hoc `musicians` namespace); user-owned domain collections use top-level documents with owner UID fields; `taxonomy_categories/{categoryId}/options/{optionId}` is the canonical vocabulary model; buy, sell and rent stay distinct journeys sharing commerce infrastructure; booking ownership is `userId`; connection states are PENDING, ACCEPTED, DECLINED; reviews keep author and target uniqueness.
Still open: the `studio_bookings` field conflict, the multiple `connections` writer shapes, the `feed_posts` shape drift, and `portfolio_projects`, business and studio persistence being schema-ready but not runtime-verified. **Conclusion:** the schema is the canonical design and control model, not a claim of end-to-end Android and schema parity; resolve the conflicts above before marking any affected domain VERIFIED LIVE.
<page url="https://app.notion.com/p/3b8bb710b9ab817e904bf15c3c4b9460">🗃️ Legacy Schema — canonical record</page>
</content>
</page>