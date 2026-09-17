-- Marketplace offers: a buyer proposes a price on a listing, the seller accepts, declines or
-- lets it sit. No money moves through MusicLinkd — settlement happens between the two of them,
-- same boundary as booking_requests and rental_bookings.
create table public.marketplace_offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_profile_id uuid not null references public.profiles(id) on delete cascade,
  amount_paise integer not null check (amount_paise > 0),
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  created_at timestamptz not null default now()
);

alter table public.marketplace_offers enable row level security;

create or replace function public.listing_is_mine(p_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.marketplace_listings
    where id = p_listing_id and seller_profile_id = auth.uid()
  );
$$;

create policy "Buyer makes their own offer"
  on public.marketplace_offers for insert
  with check (buyer_profile_id = auth.uid());

create policy "Buyer and seller read"
  on public.marketplace_offers for select
  using (buyer_profile_id = auth.uid() or listing_is_mine(listing_id));

create policy "Seller answers, buyer withdraws"
  on public.marketplace_offers for update
  using (listing_is_mine(listing_id) or buyer_profile_id = auth.uid())
  with check (listing_is_mine(listing_id) or buyer_profile_id = auth.uid());

create policy "Buyer removes their own"
  on public.marketplace_offers for delete
  using (buyer_profile_id = auth.uid());
