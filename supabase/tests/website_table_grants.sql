-- Run against the disposable website database after all migrations have been replayed.
DO $test$
DECLARE
  fixture record;
  browser_role text;
  fixture_id uuid;
  result_id uuid;
  fixtures constant jsonb := '[
    {"table_name":"website_leads","columns":"kind, dedupe_key, email, source","values_sql":"''contact'', ''ci-website-grants'', ''test@example.invalid'', ''ci''"},
    {"table_name":"cart_recovery_sessions","columns":"cart_id, token_hash, lines, expires_at","values_sql":"''ci-website-grants'', ''ci-digest'', ''[]'', now() + interval ''1 hour''"},
    {"table_name":"integration_webhook_events","columns":"provider, event_id","values_sql":"''ci'', ''website-grants''"},
    {"table_name":"website_catalog_products","columns":"id, source_product_id, slug, display_name","values_sql":"''11111111-1111-4111-8111-111111111111'', ''ci'', ''ci-website-grants'', ''CI product''"},
    {"table_name":"website_catalog_variants","columns":"product_id, source_variant_id, current_price","values_sql":"''11111111-1111-4111-8111-111111111111'', ''ci'', 100"},
    {"table_name":"website_catalog_sync_runs","columns":"provider","values_sql":"''manual''"}
  ]'::jsonb;
BEGIN
  FOR fixture IN
    SELECT * FROM jsonb_to_recordset(fixtures)
      AS f(table_name text, columns text, values_sql text)
  LOOP
    FOREACH browser_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF has_table_privilege(browser_role, format('public.%I', fixture.table_name),
          'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') THEN
        RAISE EXCEPTION '% retains table privileges on %', browser_role, fixture.table_name;
      END IF;

      EXECUTE format('SET LOCAL ROLE %I', browser_role);
      BEGIN
        EXECUTE format('SELECT id FROM public.%I LIMIT 1', fixture.table_name);
        RAISE EXCEPTION '% can read %', browser_role, fixture.table_name;
      EXCEPTION WHEN insufficient_privilege THEN
        NULL;
      END;
      EXECUTE 'RESET ROLE';
    END LOOP;

    SET LOCAL ROLE service_role;
    EXECUTE format('INSERT INTO public.%I (%s) VALUES (%s) RETURNING id',
        fixture.table_name, fixture.columns, fixture.values_sql) INTO STRICT fixture_id;
    EXECUTE format('SELECT id FROM public.%I WHERE id = $1', fixture.table_name)
      INTO STRICT result_id USING fixture_id;
    EXECUTE format('UPDATE public.%I SET id = id WHERE id = $1 RETURNING id', fixture.table_name)
      INTO STRICT result_id USING fixture_id;

    -- The variant fixture needs its product to remain present until the variant is tested.
    IF fixture.table_name <> 'website_catalog_products' THEN
      EXECUTE format('DELETE FROM public.%I WHERE id = $1 RETURNING id', fixture.table_name)
        INTO STRICT result_id USING fixture_id;
    END IF;
    RESET ROLE;
  END LOOP;

  SET LOCAL ROLE service_role;
  DELETE FROM public.website_catalog_products
    WHERE id = '11111111-1111-4111-8111-111111111111'
    RETURNING id INTO STRICT result_id;
  RESET ROLE;
END;
$test$;
