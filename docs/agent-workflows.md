# Agent Workflows

## The honest tooling verdict

**n8n was considered and deliberately not used.** Reasons:

1. **ReadNest already has an orchestration layer.** The Cloud Functions
   backend already runs scheduled AI insight jobs (`enqueueDailyInsightJobs`),
   AI support-case triage (`processSupportCase`), budget-capped analysis
   (`processAiAnalysisJob`), and Stripe webhooks. n8n would duplicate this
   with a second system to host, secure, and monitor.
2. **Child-data boundary.** Routing learner data through a third-party
   workflow host adds a COPPA-relevant processor for no functional gain.
3. **Deploys already flow through GitHub Actions.** Dev automation belongs
   where the code and CI already live.

n8n is a fine tool when a business needs to glue many third-party SaaS apps
together without code. If that need appears later (e.g. CRM + email + Slack
chains), revisit it — for the current stack it would only add cost and surface
area.

## What runs instead

Both workflows use [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)
and share **one secret**.

| Workflow | File | Trigger | What it does |
|---|---|---|---|
| Claude Assistant | `claude-assistant.yml` | `@claude` in any issue/PR comment | Full agent in CI: answers questions, implements fixes, pushes commits to the PR branch |
| Claude PR Review | `claude-pr-review.yml` | every non-draft PR | Reviews the diff against a ReadNest-specific checklist: COPPA/child privacy, Firestore rules scope, Stripe tier gating, dev/prod env boundaries |
| Nightly Health Agent | `nightly-health-agent.yml` | daily 6:00 AM ET + manual | Runs typecheck, unit tests, content validation, and a prod-site probe; on failure Claude diagnoses the logs, reads the involved source, and files one actionable issue (updates the existing one instead of duplicating) |

## One-time setup (required before these run)

1. Get an API key: https://console.anthropic.com/ → API keys
   (or, on a Claude Pro/Max subscription, run `claude setup-token` locally).
2. Repo → Settings → Secrets and variables → Actions → **New repository secret**
   - Name: `ANTHROPIC_API_KEY` (or `CLAUDE_CODE_OAUTH_TOKEN` — then change the
     input name in the three workflow files).
3. Test: comment `@claude summarize this PR` on any pull request, or run
   *Nightly Health Agent* from the Actions tab with **Run workflow**.

## Cost expectations

- PR review: a few cents per PR (single pass over the diff).
- Nightly agent: $0 on green nights (Claude step is skipped entirely);
  cents on red nights.
- `@claude` assistant: proportional to what you ask it to do.
