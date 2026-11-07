# Oasis Gifting: Core CONNECT-2 public product projection

## Verified source contract

Core repository `oasisbaklawa2006/oasis-supabase-core`,
migration `20260927220000_connect2_consumer_channel_authority.sql` defines
`connect_authorize_and_project_v1(p_token, p_resource, p_params)`.
It requires a Core-issued, hash-backed, scoped token and a consumer/profile
binding. `website_retail_v1` permits resource `catalogue.products` and
only a public product-field allowlist sourced from `published_products_v1()`.

The Gifting implementation `src/lib/catalogue/core-connect2.server.ts` is
**server only**. It validates the profile key, consumer identity, environment,
version, row count, product IDs and every returned field. It rejects
undocumented fields, including commercial columns. `readGovernedPublicCatalogue`
exposes only the sanitized result and a safe unavailable state.

## Server-side configuration — do not use VITE_*

| Environment variable | Purpose |
| --- | --- |
| `OASIS_CORE_SUPABASE_URL` | Verified HTTPS origin for Core REST API |
| `OASIS_CORE_PUBLISHABLE_KEY` | Core publishable / anon API key (not service role) |
| `OASIS_CORE_CONNECT_TOKEN` | Core-issued least-privilege bearer token, never client-side |
| `OASIS_CORE_CONNECT_CONSUMER_KEY` | Exact issued consumer key for identity binding |
| `OASIS_CORE_CONNECT_ENV` | Exact Core binding environment: preview/staging/production |

No credentials, token or live production binding are provisioned in this PR.
The reader fails closed when any setting is missing or Core rejects authorization.
Never paste a Core service-role key into Gifting or Lovable's browser config.

## Required governance to activate

1. Confirm the CONNECT-2 migration and token/profile RPCs exist in the
   intended Core environment. Do not infer production installation from
   a committed migration.
2. Obtain owner-governed `b2c_website` consumer issuance bound to
   `website_retail_v1` and `catalogue:read`, with rate/expiry limits.
3. Provision the variables **server-side** in an approved isolated environment.
4. Validate positive and negative queries, field denial, token expiry/revocation,
   pagination, cache behavior, redacted observability and Core audit logging.
5. Reconcile returned products against approved AI Studio imagery, product
   taxonomy, pack sizes, dietary and allergen metadata. No automatic website
   publication merely because Core returns a row.
6. Only after product acceptance connect the read boundary to the visual
   website catalogue. Preserve the approved immutable product artwork.

**Not supplied by CONNECT-2:** consumer price, GST, inventory, discounts,
delivery promises, orders, payments, refunds, fulfilment, or staff login.
The existing Gifting catalogue remains presentation-only until those
authorities are separately validated.

**Status:** source contract implemented and synthetic contract tests added;
production connectivity, sync, operational end-to-end tests and launch
certification remain **NOT_TESTED**.
