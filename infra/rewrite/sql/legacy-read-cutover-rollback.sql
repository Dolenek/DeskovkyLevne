-- Rollback for legacy-read-cutover.sql

begin;

grant select on table public.product_price_snapshots to anon;
grant select on table public.product_price_snapshots to authenticated;

drop policy if exists "Enable read access for all users" on public.product_price_snapshots;

create policy "Enable read access for all users"
on public.product_price_snapshots
as permissive
for select
to public
using (true);

commit;
