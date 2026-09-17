-- Enquiries: a visitor asks a business about a room, mixing, a live date, or something else. This
-- is what feeds the business's own Leads inbox — one record both sides read, not two disconnected
-- fake screens. No payment or scheduling here, just the ask.
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid not null references public.profiles(id) on delete cascade,
  sender_profile_id uuid not null references public.profiles(id) on delete cascade,
  intent text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'replied', 'booked', 'closed')),
  created_at timestamptz not null default now()
);

alter table public.enquiries enable row level security;

create policy "Sender asks as themselves"
  on public.enquiries for insert
  with check (sender_profile_id = auth.uid());

create policy "Sender and business read"
  on public.enquiries for select
  using (sender_profile_id = auth.uid() or business_profile_id = auth.uid());

create policy "Business updates its own inbox"
  on public.enquiries for update
  using (business_profile_id = auth.uid())
  with check (business_profile_id = auth.uid());
