-- shop-senegal — initial schema: products catalog + payments/orders tracking
-- Run once in the Supabase SQL Editor (Dashboard → SQL Editor) on a hosted project,
-- or via `supabase db push` if you later link this project to the Supabase CLI.

create extension if not exists pgcrypto;

-- ─── products ────────────────────────────────────────────────────────────
-- Public catalog, readable by anyone via the anon key.

create table if not exists products (
  id          text primary key,
  name        text not null,
  description text not null,
  price       integer not null, -- XOF has no subunit, integer amount
  category    text not null,
  image_url   text,
  created_at  timestamptz not null default now()
);

alter table products enable row level security;

create policy "Products are publicly readable"
  on products for select
  using (true);

-- ─── payments ────────────────────────────────────────────────────────────
-- Orders + their payment status/progression. No public policies: only the
-- service_role key (server-side only) can read or write this table.

create table if not exists payments (
  id                       uuid primary key default gen_random_uuid(),
  order_reference          text not null unique,
  status                   text not null default 'pending'
                             check (status in ('pending', 'succeeded', 'failed', 'cancelled')),
  currency                 text not null default 'XOF',
  amount_total             integer not null,
  items                    jsonb not null, -- snapshot: [{ productId, name, unitPrice, quantity }]
  customer_name            text not null,
  customer_email           text not null,
  customer_phone           text,
  provider                 text,           -- set once a payment provider is wired in later
  provider_transaction_id  text,           -- webhook-matching key, for later
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table payments enable row level security;
-- Deliberately no policies — anon/authenticated get zero access by default.
-- Only the service_role client (server-only) can read/write this table.

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger payments_set_updated_at
  before update on payments
  for each row
  execute function set_updated_at();

-- ─── seed: sample Sénégal-themed products (XOF) ─────────────────────────

insert into products (id, name, description, price, category, image_url) values
  ('boubou-bazin-brode', 'Boubou Bazin Brodé',
   'Boubou traditionnel en bazin riche, brodé à la main avec des motifs raffinés — pièce d''exception pour les grandes occasions.',
   75000, 'Vêtements', null),
  ('sabar-tambour-traditionnel', 'Sabar — Tambour Traditionnel Sénégalais',
   'Tambour sabar artisanal, sculpté dans un tronc unique et tendu de peau de chèvre, utilisé dans les danses et cérémonies wolof.',
   120000, 'Musique', null),
  ('service-the-attaya', 'Service à Thé Attaya',
   'Plateau, théière et trois petits verres pour préparer l''attaya, le thé vert traditionnel sénégalais servi en trois temps.',
   28000, 'Art de Vivre', null),
  ('sac-raphia-casamance', 'Sac en Raphia de Casamance',
   'Sac tissé à la main en raphia naturel par des artisanes de Casamance, motifs colorés et finitions en cuir.',
   18000, 'Accessoires', null),
  ('tableau-sous-verre-dakar', 'Tableau Sous-Verre de Dakar',
   'Peinture sous-verre traditionnelle représentant des scènes de la vie dakaroise, technique ancestrale sénégalaise.',
   45000, 'Décoration', null)
on conflict (id) do nothing;
