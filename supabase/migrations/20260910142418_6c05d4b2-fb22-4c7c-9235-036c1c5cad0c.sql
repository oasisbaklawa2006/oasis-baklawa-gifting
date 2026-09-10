-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================================
-- website_leads
-- =========================================================
CREATE TABLE public.website_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('newsletter','contact','corporate','wedding','rewards','partnership')),
  dedupe_key text NOT NULL,
  email text,
  phone text,
  full_name text,
  company text,
  message text,
  source text NOT NULL,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  marketing_consent boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  submission_count integer NOT NULL DEFAULT 1,
  sync_state text NOT NULL DEFAULT 'pending_sync' CHECK (sync_state IN ('pending_sync','synced','failed')),
  sync_detail text,
  synced_at timestamptz,
  last_submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT website_leads_contact_present CHECK (email IS NOT NULL OR phone IS NOT NULL),
  CONSTRAINT website_leads_dedupe_key_unique UNIQUE (dedupe_key)
);

GRANT ALL ON public.website_leads TO service_role;

ALTER TABLE public.website_leads ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: trusted server code only (service role bypasses RLS).

CREATE INDEX website_leads_sync_state_idx ON public.website_leads (sync_state, created_at DESC);
CREATE INDEX website_leads_kind_idx ON public.website_leads (kind, created_at DESC);
CREATE INDEX website_leads_email_idx ON public.website_leads (email) WHERE email IS NOT NULL;

CREATE TRIGGER website_leads_set_updated_at
BEFORE UPDATE ON public.website_leads
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- cart_recovery_sessions
-- =========================================================
CREATE TABLE public.cart_recovery_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id text NOT NULL,
  token_hash text NOT NULL,
  lines jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','cancelled')),
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  last_redeemed_at timestamptz,
  redeem_count integer NOT NULL DEFAULT 0,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_recovery_sessions_token_hash_unique UNIQUE (token_hash)
);

GRANT ALL ON public.cart_recovery_sessions TO service_role;

ALTER TABLE public.cart_recovery_sessions ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: trusted server code only.

CREATE INDEX cart_recovery_sessions_expiry_idx ON public.cart_recovery_sessions (status, expires_at);
CREATE INDEX cart_recovery_sessions_cart_idx ON public.cart_recovery_sessions (cart_id, issued_at DESC);

CREATE TRIGGER cart_recovery_sessions_set_updated_at
BEFORE UPDATE ON public.cart_recovery_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- integration_webhook_events (replay / idempotency guard)
-- =========================================================
CREATE TABLE public.integration_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','processed','failed')),
  detail text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT integration_webhook_events_unique UNIQUE (provider, event_id)
);

GRANT ALL ON public.integration_webhook_events TO service_role;

ALTER TABLE public.integration_webhook_events ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: trusted server code only.

CREATE INDEX integration_webhook_events_status_idx ON public.integration_webhook_events (status, received_at DESC);

CREATE TRIGGER integration_webhook_events_set_updated_at
BEFORE UPDATE ON public.integration_webhook_events
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- Lifecycle / cleanup helpers
-- =========================================================
CREATE OR REPLACE FUNCTION public.expire_cart_recovery_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.cart_recovery_sessions
     SET status = 'expired'
   WHERE status = 'active'
     AND expires_at < now();
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_cart_recovery_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_cart_recovery_sessions() TO service_role;

CREATE OR REPLACE FUNCTION public.purge_stale_persistence(retain_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer := 0;
  batch integer;
BEGIN
  DELETE FROM public.cart_recovery_sessions
   WHERE expires_at < now() - make_interval(days => retain_days);
  GET DIAGNOSTICS batch = ROW_COUNT;
  removed := removed + batch;

  DELETE FROM public.integration_webhook_events
   WHERE received_at < now() - make_interval(days => retain_days);
  GET DIAGNOSTICS batch = ROW_COUNT;
  removed := removed + batch;

  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_stale_persistence(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_stale_persistence(integer) TO service_role;