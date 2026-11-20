# GFT-100: Website staging migration-history reconciliation — 20 Nov 2026

**Scope:** isolated Supabase project `oasis-gifting-website-staging` (`ypeoiobkqvlalxgugtgm`), **not** production Core, live customer checkout, or production database operations.

**Source baseline:** Gifting `main` at `5d70536d1b15d89884efff8657b1160594223ffa` (all 11 earlier feature/security PRs merged). The four migration SQL bodies in this repository were compared **character-for-character** with the SQL statement stored in each staging migration-history row. Every comparison matched exactly; only ledger *version identifiers* differed.

## Source-to-staging version mapping

| Original staging version | Repository migration version | Exact SQL-body MD5 (unchanged) | Remote migration name (retained) |
|---|---|---|---|
| `20261116222759` | `20260910142418` | `74506fd8ec5d512e38f1a4445060c906` | `source_20260910142418_website_persistence` |
| `20261116222801` | `20260910142431` | `d66de88197adc6770b44407548a8e6ac` | `source_20260910142431_website_function_grants` |
| `20261116222809` | `20260910144810` | `6f9580d76ed37abdcb415ea5d21f5c84` | `source_20260910144810_website_catalogue` |
| `20261116222810` | `20261114173000` | `57ae1cc8cdae66829555f46939be06fe` | `source_20261114173000_revoke_anon_authenticated_website_table_grants` |

The original repository migration files are retained and unchanged:
`20260910142418_6c05d4b2-fb22-4c7c-9235-036c1c5cad0c.sql`,
`20260910142431_35c39670-51c7-4877-912c-dcf8d803c83a.sql`,
`20260910144810_9900e80e-c7f9-4f35-b453-3b689a37786d.sql`, and
`20261114173000_revoke_anon_authenticated_website_table_grants.sql`.

## Recorded operation and safety properties

On isolated **staging only**, a guarded atomic transaction updated the four rows' `version` keys in `supabase_migrations.schema_migrations`; it first required exactly four existing rows, the exact original version/name pairs, one SQL statement per row, the verified SQL MD5 values, and the absence of any new-version collisions. It aborted if any precondition was violated. **No SQL bodies, row names, schema migrations, RLS policies, application tables, data, or production system were changed.**

Pre-operation staging row counts: website_leads **1**, cart_recovery_sessions **0**, integration_webhook_events **0**, website_catalog_products **16**, website_catalog_variants **16**, website_catalog_sync_runs **1**. The operation did not touch these application tables.

Post-operation `list_migrations` confirms the four repository version identifiers are present in the staging ledger, retaining their original remote names. At first subsequent `list_branches`, the **existing** Git-integrated branch status still showed `MIGRATIONS_FAILED` (last update 19 Nov); that status is **not proof the new history failed**. A fresh provider run is required.

## Approved paid branch acceptance — 20 Nov 2026 (completed)

Owner expressly approved the temporary branch at the provider-quoted **US$0.01344 per hour**. The approved Supabase cost confirmation was used once to create the **nonpersistent, isolated** branch `gft100-history-replay-20261120` (`atdefogwadzkqbeycosk`, branch ID `b51f06e9-5491-41da-ac94-ee2378136c76`) from staging `ypeoiobkqvlalxgugtgm`, with **with_data=false**. It did not create a new permanent project or change Core production.

**Branch acceptance evidence (read-only queries; provider branch reported `FUNCTIONS_DEPLOYED` and its preview database `ACTIVE_HEALTHY`):**

- **4/4 expected migration version identifiers** `20260910142418`, `20260910142431`, `20260910144810`, and `20261114173000` applied and recorded on the fresh branch. No additional version rows. The branch's `statements` column contains the individual executed statements (25/4/17/3), unlike the parent staging ledger's one imported SQL-body statement per version; thus per-statement MD5s on the branch are **not directly comparable** to the original whole-file MD5s above. This is not a mismatch in version identifiers.
- All **six tables exist**, have RLS enabled, and expose **0 of 4** CRUD privileges to each of `anon` and `authenticated` while exposing **4 of 4** to `service_role`. Six `rls_enabled_no_policy` INFO notices are expected given the explicit server-only role grants and absent public policies; no other security advisor findings. Health advisors returned no findings.
- Protected maintenance functions `expire_cart_recovery_sessions()` and `purge_stale_persistence(integer)` exist; direct relevant public/authenticated function execution is denied and service_role maintenance execution is granted.
- Seeded branch rows: 16 catalogue products, 16 catalogue variants and 1 sync run. No leads, carts or webhook events copied from parent staging (as intended with `with_data=false`). Parent staging preserved its existing 1 lead and all other row counts from the earlier receipt.
- Supabase **delete_branch returned success** for the exact isolated branch ID after acceptance. A new `list_branches` confirmed that only the parent `main` remains; the temporary branch **no longer exists**. No ongoing hourly compute for that branch should accrue after deletion (billing metering/rounding remains provider-controlled).

**Remaining caveat:** The parent project's historic Git-integrated `main` branch retains an old `MIGRATIONS_FAILED` status despite the ledger repair. The GitHub `Supabase Preview` check on documentation PR #50 returned **SKIPPED** (`This git branch is not associated with any Supabase Branch`), so the separate **Git-integrated Preview check is not certified green**. A new properly associated preview check and deployment target verification are still required. The fresh paid branch's successful migration replay and RLS/security checks are verified evidence, but do not substitute for a Git-integrated check, production deploy, hosted runtime UAT or launch approval.

## Safe validation and release gates

1. Confirm the exact current Git source migration filenames and SQL bodies remain unchanged and the linked provider project is the intended isolated website staging project, **not Core production**.
2. Trigger a new Supabase Preview for a reviewed Gifting PR. Evaluate the new result, migration list and branch state together. Do not treat a green GitHub CI as a passing Supabase Preview.
3. Read-only check that all six server-only website tables keep RLS enabled, public roles `anon` / `authenticated` lack table access, and `service_role` retains CRUD; verify schema, data and any retained test records.
4. If the new Preview still fails, inspect its specific migration error and reconnect/configure the existing integration; do **not** reset branches containing data, apply SQL migrations twice, delete migration history or silently waive this check.
5. Production deployment / protected GitHub ruleset / Vercel configuration / retail Core checkout, payment and domain cutover are separate gates. All remain **NO-GO** until independently verified.

This is a staging-repair **evidence record**, not a reusable instruction to manipulate production migration metadata. The recommended general-purpose method for discrepancies is Supabase's `migration list` / `migration repair` workflow, under an authorized and backed-up target.
