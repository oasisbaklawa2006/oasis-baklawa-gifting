# `main` protection: prepared, NOT applied

**Status (19 Nov 2026):** GitHub reports `main` as `protected: false` with no rulesets and no CODEOWNERS
(`GET /repos/{repo}/branches/main` -> `protected:false`, enforcement `off`; `GET /repos/{repo}/rulesets` -> `[]`).
Today a collaborator with write access can push directly to `main` and merge without an independent review.
Nothing in this PR changes that by itself: it prepares the controls for the owner to apply deliberately.

## Prepared mode (safe by default)
The JSON is intentionally set to `"enforcement": "evaluate"`. Installing it **does not block** direct pushes or merges. The owner must only switch it to `"active"` after verifying an eligible independent code owner, branch-matched check names, and a recoverable administrative access path. An evaluated-only ruleset is **not effective production protection**.

## What the ruleset will enforce when activated (`main-ruleset.json`)
- Pull request required; **1 approving review**, **stale approvals dismissed on every push**, approval of the
  **most recent push** required (so the author cannot self-approve their own last change), Code Owner review
  required, all review threads resolved.
- Required checks, matched to the **exact check names observed** on PR #41 at `224dc70`: CI (typecheck, lint,
  tests, build, tracked-env), `npm audit (high and critical)`, Semgrep, TruffleHog, Dependency review, CodeQL
  (JavaScript and TypeScript). Branch must be up to date before merge.
- No force pushes, no branch deletion, **no bypass actors** (admins are not exempt).

Deliberately **not** required: `Codacy`, `CodeRabbit`, Vercel and Netlify checks (rate-limited, advisory or not
present on every PR), so they cannot block unrelated merges.

## Decisions the owner must make before applying
1. **Reviewer AND Code Owner access (blocking).** The current `CODEOWNERS` catch-all names only
   `@oasisbaklawa2006`, which is also the account that authored this PR. A PR author cannot approve
   their own PR. With `require_code_owner_review=true` and `require_last_push_approval=true`, a second
   ordinary collaborator is **not sufficient**: the reviewer must also be an eligible Code Owner
   (a user or team with proper repository permissions, explicitly included in CODEOWNERS).
   Verify that a separate eligible human or team exists and amend CODEOWNERS **before activation**.
   Access for `dineshmutrejabackup-cmd` was previously not confirmed. If no independent Code Owner exists,
   activation can lock all merges. Do not disable independent approval to work around this.
2. **Bypass.** `bypass_actors` is empty on purpose. Add an actor only if you accept a path around independent review.
3. **Check names** must still match when workflows change; a renamed job silently becomes a never-satisfied requirement.

## Safe preflight (owner, repository admin)
First confirm the account has ruleset administration rights, at least one eligible independent
Code Owner has write-level access, the CODEOWNERS assignment resolves, all required check contexts
are emitted for a representative PR, and a non-destructive recovery procedure is available.

Create the ruleset in **evaluate-only** mode:
```bash
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/rulesets --method POST --input docs/governance/main-ruleset.json
```
## Verify evaluation and activate only after owner approval
Inspect the created ruleset ID and its recorded evaluation insights; test a sample PR against
all requirements. When ready, change `enforcement` from `evaluate` to `active` in the JSON
and update **that same ruleset ID** through the authenticated ruleset API (`PUT`), after a reviewed
staging rehearsal. Do not POST a second active ruleset or assume evaluation enforces anything.

Once active, verify:
```bash
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/branches/main --jq .protected      # expect true
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/rules/branches/main --jq '.[].type'  # expect the 4 rule types
```
## Roll back
```bash
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/rulesets --jq '.[].id'
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/rulesets/<id> --method DELETE
```
The checked-in JSON deliberately starts in `"enforcement": "evaluate"`. Do not activate until the independent Code Owner and required check names are verified.

*Auto-merge stays disabled (`allow_auto_merge: false`) and is not changed here.*
