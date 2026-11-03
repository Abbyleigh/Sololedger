-- SoloLedger Stage 11: proposed cloud schema (not deployed)
-- Run only after reviewing against the imported production data model.
create extension if not exists pgcrypto;

create table public.business_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  business_details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text,
  customer_data jsonb not null,
  updated_at timestamptz not null default now(),
  unique(owner_id, legacy_id),
  unique(owner_id, id)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text,
  invoice_number text not null,
  customer_id uuid,
  invoice_data jsonb not null,
  updated_at timestamptz not null default now(),
  unique(owner_id, legacy_id),
  unique(owner_id, invoice_number),
  unique(owner_id, id),
  foreign key (owner_id, customer_id) references public.customers(owner_id, id)
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text,
  invoice_id uuid,
  amount_pence bigint not null check (amount_pence >= 0),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  transaction_data jsonb not null,
  updated_at timestamptz not null default now(),
  unique(owner_id, legacy_id),
  unique(owner_id, id),
  foreign key (owner_id, invoice_id) references public.invoices(owner_id, id)
);

alter table public.business_profiles enable row level security;
alter table public.customers enable row level security;
alter table public.invoices enable row level security;
alter table public.transactions enable row level security;

create policy "profile_select_own" on public.business_profiles for select to authenticated using (owner_id = (select auth.uid()));
create policy "profile_insert_own" on public.business_profiles for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "profile_update_own" on public.business_profiles for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "profile_delete_own" on public.business_profiles for delete to authenticated using (owner_id = (select auth.uid()));

create policy "customers_select_own" on public.customers for select to authenticated using (owner_id = (select auth.uid()));
create policy "customers_insert_own" on public.customers for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "customers_update_own" on public.customers for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "customers_delete_own" on public.customers for delete to authenticated using (owner_id = (select auth.uid()));

create policy "invoices_select_own" on public.invoices for select to authenticated using (owner_id = (select auth.uid()));
create policy "invoices_insert_own" on public.invoices for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "invoices_update_own" on public.invoices for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "invoices_delete_own" on public.invoices for delete to authenticated using (owner_id = (select auth.uid()));

create policy "transactions_select_own" on public.transactions for select to authenticated using (owner_id = (select auth.uid()));
create policy "transactions_insert_own" on public.transactions for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "transactions_update_own" on public.transactions for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "transactions_delete_own" on public.transactions for delete to authenticated using (owner_id = (select auth.uid()));

-- IMPORTANT: This schema does not implement atomic payment posting,
-- conflict resolution, deletion of Auth users or backup/recovery.
-- Do not deploy until these are implemented and tested.
