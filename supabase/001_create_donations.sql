-- PCV Donations — Milestone 1 schema
-- Run this in the Supabase SQL Editor at:
-- https://supabase.com/dashboard/project/qliqollmmwoiwizatwbf/sql

create table if not exists donations (
  id               uuid        default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  project          text        not null check (project in ('general_fund', 'disaster_prep')),
  amount_usd       numeric(12, 2) not null check (amount_usd > 0),
  payment_method   text        not null check (payment_method in ('card', 'usdc')),
  identity_tier    text        not null check (identity_tier in ('anonymous', 'named', 'verified')),
  first_name       text,
  last_name        text,
  email            text,
  phone            text,
  status           text        not null default 'pending'
                               check (status in ('pending', 'completed', 'failed')),
  transaction_id   text,
  mock             boolean     not null default false
);

-- Indexes for ledger queries
create index if not exists donations_status_created
  on donations (status, created_at desc);

create index if not exists donations_project
  on donations (project);

-- Row-Level Security
alter table donations enable row level security;

-- Public: insert new donations
create policy "anon_insert"
  on donations for insert
  to anon
  with check (true);

-- Public: read completed donations (app masks PII per identity_tier)
create policy "anon_select_completed"
  on donations for select
  to anon
  using (status = 'completed');

-- Public: update own pending donation to completed/failed (Milestone 1 client-side flow)
-- For production, replace with a server-side Edge Function and restrict this policy.
create policy "anon_update_status"
  on donations for update
  to anon
  using (true)
  with check (status in ('completed', 'failed'));
