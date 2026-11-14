-- Keep the server-only website persistence tables inaccessible to API roles.
-- RLS remains enabled with no anon/authenticated policies; this also removes
-- unnecessary table-level grants as a defense-in-depth boundary.
REVOKE ALL PRIVILEGES ON TABLE
  public.website_leads,
  public.cart_recovery_sessions,
  public.integration_webhook_events,
  public.website_catalog_products,
  public.website_catalog_variants,
  public.website_catalog_sync_runs
FROM anon, authenticated;

-- Supabase's current default ACLs grant every privilege on new public tables
-- to anon and authenticated. Revoke that default for the roles observed as
-- owners of the current tables and for the Supabase admin migration role.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
  REVOKE ALL PRIVILEGES ON TABLES FROM anon, authenticated;

-- Fail the migration if any API role still has direct access, or if the
-- server-only role lost the CRUD privileges required by the app.
DO $assert_privilege_boundary$
DECLARE
  table_name text;
  role_name text;
  privilege_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'website_leads',
    'cart_recovery_sessions',
    'integration_webhook_events',
    'website_catalog_products',
    'website_catalog_variants',
    'website_catalog_sync_runs'
  ] LOOP
    FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      FOREACH privilege_name IN ARRAY ARRAY[
        'SELECT', 'INSERT', 'UPDATE', 'DELETE',
        'REFERENCES', 'TRIGGER', 'TRUNCATE'
      ] LOOP
        IF has_table_privilege(
          role_name,
          format('public.%I', table_name),
          privilege_name
        ) THEN
          RAISE EXCEPTION 'Unexpected % privilege for % on public.%', privilege_name, role_name, table_name;
        END IF;
      END LOOP;
    END LOOP;

    FOREACH privilege_name IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
      IF NOT has_table_privilege(
        'service_role',
        format('public.%I', table_name),
        privilege_name
      ) THEN
        RAISE EXCEPTION 'Missing % privilege for service_role on public.%', privilege_name, table_name;
      END IF;
    END LOOP;
  END LOOP;
END;
$assert_privilege_boundary$;
