# Website Supabase migrations — controlled history

This directory contains the **authoritative, original** SQL migrations for the GFT-100 website. They must be preserved in timestamp order; do not rename or replay applied migrations to address a provider Preview error.

The isolated website staging project was imported on 16 November 2026 under different ledger version IDs. On 20 November, the four stored SQL bodies were verified **identical** to the repository migrations. Its *staging-only* history version keys were then reconciled transactionally; SQL content and application data were unchanged.

See [the evidence, exact mapping, preconditions and recovery gates](../docs/governance/STAGING_MIGRATION_HISTORY_RECOVERY_20261120.md). **Fresh Supabase Preview validation is required; historical failure status is not proof of a new result.**

This notice also makes the `supabase/` directory change visible to the existing Git-integrated Preview check, without introducing any SQL migration, configuration setting or production deployment.
