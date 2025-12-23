-- Create Profiles Table
create table if not exists public.profiles (
  id uuid not null default gen_random_uuid (),
  full_name text not null,
  email text null,
  phone text null,
  role text not null default 'Sekreter'::text,
  status text not null default 'active'::text,
  created_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies (Permissive for development)
create policy "Enable read access for all users" on "public"."profiles"
as permissive for select to public using (true);

create policy "Enable insert for all users" on "public"."profiles"
as permissive for insert to public with check (true);

create policy "Enable update for all users" on "public"."profiles"
as permissive for update to public using (true);

create policy "Enable delete for all users" on "public"."profiles"
as permissive for delete to public using (true);
