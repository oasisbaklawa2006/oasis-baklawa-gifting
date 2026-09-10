REVOKE ALL ON FUNCTION public.expire_cart_recovery_sessions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.purge_stale_persistence(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_cart_recovery_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_stale_persistence(integer) TO service_role;