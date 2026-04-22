-- Phase 24: Enforce Super-Admin-Only Hostel Approval
-- Owners can submit and edit their listings, but cannot publish them.

do $$
begin
  if to_regclass('public.hostels') is null then
    raise exception 'Missing table public.hostels. Run final_complete_migration.sql (or complete_migration.sql + prior phases) before phase24_enforce_super_admin_hostel_approval.sql.';
  end if;

  if to_regclass('public.users') is null then
    raise exception 'Missing table public.users. Run final_complete_migration.sql (or complete_migration.sql + prior phases) before phase24_enforce_super_admin_hostel_approval.sql.';
  end if;
end $$;

alter table public.hostels enable row level security;

-- Owners can submit only pending hostels.
drop policy if exists "Owners can insert own hostels" on public.hostels;
create policy "Owners can insert own hostels"
on public.hostels
for insert
to authenticated
with check (
  auth.uid() = owner_id
  and (select role from public.users where id = auth.uid()) = 'hostel_owner'
  and coalesce(status, 'pending') = 'pending'
);

-- Owners can edit only their own hostels and keep status pending.
-- This blocks owner-driven publish/reject transitions.
drop policy if exists "Owners can update own hostels" on public.hostels;
create policy "Owners can update own hostels"
on public.hostels
for update
to authenticated
using (
  auth.uid() = owner_id
  and (select role from public.users where id = auth.uid()) = 'hostel_owner'
)
with check (
  auth.uid() = owner_id
  and (select role from public.users where id = auth.uid()) = 'hostel_owner'
  and status = 'pending'
);

-- Existing super admin policies continue to control approve/reject transitions.
