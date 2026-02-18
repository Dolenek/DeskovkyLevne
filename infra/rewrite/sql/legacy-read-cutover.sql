-- Apply only after Go API traffic parity is verified and direct PostgREST reads are no longer required.

begin;

revoke select on table public.product_price_snapshots from anon;
revoke select on table public.product_price_snapshots from authenticated;

drop policy if exists "Enable read access for all users" on public.product_price_snapshots;

commit;
