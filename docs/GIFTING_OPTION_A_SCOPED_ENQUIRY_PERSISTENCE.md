# Gifting Option A: scoped enquiry persistence (no service-role key)

The public Gifting Vercel project must never hold Core Production's
`SUPABASE_SERVICE_ROLE_KEY`. Option A persists enquiries through Core's
Gifting Enquiries receiver using a scoped Connect bearer token instead.

## Lead storage selection (`src/lib/persistence/index.server.ts`)

| Configured                                                    | Leads repository         | Durable | Notes                                                                              |
| ------------------------------------------------------------- | ------------------------ | ------- | ---------------------------------------------------------------------------------- |
| `GIFTING_ENQUIRIES_ENDPOINT` and/or `GIFTING_ENQUIRIES_TOKEN` | `core-gifting-enquiries` | yes     | Option A. Strict, unconditional precedence. Success only after a matching receipt. |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` only             | `database` (legacy)      | yes     | Used only when no scoped setting is present. Never wins over the scoped endpoint.  |
| neither                                                       | memory                   | no      | Public lead submission fails closed.                                               |

**Precedence rule (owner decision):** the scoped endpoint always wins. If either scoped
variable is set, enquiries go to the scoped repository even when legacy database
credentials are also present. An incomplete scoped pair fails closed (the enquiry is
refused) and never falls back to the database. Runtime attestation follows the same
rule, so the attested project is always the real write target. Saved-basket recovery
is a separate repository and is unchanged.

## Fail-closed behaviour

- Success requires Core's receipt: HTTP 201, JSON, `queue: "gifting_enquiries"`,
  `status: "accepted"`, `sourceLeadId` equal to the submission id, non-empty `enquiryId`.
- Missing or partial endpoint/token, non-https or credentialed endpoint, a non-matching
  receipt, any non-201 response, a timeout or a thrown request all report failure to the
  customer. There is no in-memory fallback.
- Only `contact`, `corporate`, `wedding` and `partnership` enquiries are accepted.
  Newsletter and rewards sign-ups have no scoped receiver and fail closed in this mode.
- Saved-basket links use server memory without a database (not durable).
- Payments (`PAYMENT_PROVIDER`, `RAZORPAY_*`, `STRIPE_*`) and Shiprocket remain
  fail-closed (`503` / `manual`). Covered by tests.

## Runtime attestation

In production with no database configuration, the attestation endpoint reports the Core
project ref taken from the exact `GIFTING_ENQUIRIES_ENDPOINT` host
(`https://<20-char-ref>.supabase.co/functions/v1/gifting-enquiries`, https, no credentials,
port, query or fragment) with `demoMode: false`, and only when the token is at least 32
characters. Anything else is unbootable (`503`). A half-configured database still returns 503.

## Trimmed Vercel Production environment

Required:

- `GIFTING_ENQUIRIES_ENDPOINT`
- `GIFTING_ENQUIRIES_TOKEN` (secret)
- `OASIS_CORE_SUPABASE_URL`, `OASIS_CORE_PUBLISHABLE_KEY`, `OASIS_CORE_CONNECT_TOKEN` (secret),
  `OASIS_CORE_CONNECT_CONSUMER_KEY`, `OASIS_CORE_CONNECT_ENV=production` (catalogue)
- `TORCH_ATTEST_TOKEN` (secret), plus the build's git SHA and `APP_ENVIRONMENT=production`

Must be absent: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `PAYMENT_PROVIDER`,
`RAZORPAY_*`, `STRIPE_*`.

Optional / deferred: `SITE_URL`, `APPVERSE_BASE_URL`, `CART_RECOVERY_SECRET`,
`ADMIN_DIAGNOSTICS_TOKEN`, `CATALOGUE_IMPORT_TOKEN` (its import path still needs the
service-role key and stays disabled without a token).
