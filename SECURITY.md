# Security policy — Oasis Baklawa Gifting

## Reporting

Do not disclose vulnerabilities, credentials, customer data, payment details or exploitation steps in public issues or pull requests. Report privately through GitHub's **Report a vulnerability** / private vulnerability reporting interface when enabled. If unavailable, contact the repository owners using an established private business channel; do not post sensitive details in issues.

## Protected areas

Changes to payment authorization, webhook signatures and replay protection, Core catalogue/order/price authority, Supabase migrations and RLS, identity/session/roles, secret handling, CI workflows, and production deployment require independent security review and explicit owner approval. Passing automated checks alone is insufficient.

## Release gates

- Typecheck, lint, unit tests, production build and tracked environment-file check.
- CodeQL JavaScript/TypeScript security analysis (requires code-scanning availability).
- Dependency review for introduced high/critical vulnerabilities (requires dependency graph/API availability).
- Protected `main` branch with required checks, independent approval, resolved threads and no administrator bypass.
- Manual verification of payments, reconciliation, customer data boundaries and production rollback before go-live.

The workflows in this repository do **not** themselves configure GitHub rulesets or guarantee that private-repository security features are licensed. An administrator must confirm and enforce those settings.
