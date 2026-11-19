# `main` protection: prepared, NOT applied

**Status (19 Nov 2026):** GitHub reports `main` as `protected: false` with no rulesets and no CODEOWNERS
(`GET /repos/{repo}/branches/main` -> `protected:false`, enforcement `off`; `GET /repos/{repo}/rulesets` -> `[]`).
Today a collaborator with write access can push directly to `main` and merge without an independent review.
Nothing in this PR changes that by itself: it prepares the controls for the owner to apply deliberately.

## What the ruleset enforces (`main-ruleset.json`)
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
1. **Reviewer access.** The ruleset needs a second person who can approve. This session cannot read
   collaborators, so it is unverified whether `dineshmutrejabackup-cmd` (the Core reviewer) has access to this
   repository. With zero eligible reviewers, `require_last_push_approval` plus no bypass will **lock merging**.
2. **Bypass.** `bypass_actors` is empty on purpose. Add an actor only if you accept a path around independent review.
3. **Check names** must still match when workflows change; a renamed job silently becomes a never-satisfied requirement.

## Apply (owner, repository admin)
```bash
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/rulesets --method POST --input docs/governance/main-ruleset.json
```
## Verify
```bash
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/branches/main --jq .protected      # expect true
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/rules/branches/main --jq '.[].type'  # expect the 4 rule types
```
## Roll back
```bash
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/rulesets --jq '.[].id'
gh api repos/oasisbaklawa2006/oasis-baklawa-gifting/rulesets/<id> --method DELETE
```
Set `"enforcement": "evaluate"` first to see what would be blocked without blocking it.

*Auto-merge stays disabled (`allow_auto_merge: false`) and is not changed here.*
