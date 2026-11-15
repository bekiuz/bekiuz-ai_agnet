# BEKIUZ AI Manager

Central command system for managing the user's projects and AI workers.

## Product goal

BEKIUZ AI Manager is a personal, mobile-first AI control center. The owner gives a command from a phone; the Manager understands the goal, plans the work, delegates suitable tasks to specialized agents, executes only through explicitly connected integrations, verifies results, and reports back.

This is a separate product from BEKIUZ COMPANY. BEKIUZ COMPANY remains the customer-facing company platform and will connect to this control center only through deliberate, authenticated integrations.

## Core roles

- **AI Manager** — central orchestrator; owns planning, task assignment, progress tracking, and final reporting.
- **Developer Agent** — repository inspection, code changes, tests, and deployment preparation.
- **Monitoring Agent** — health checks, availability monitoring, and incident reporting.
- **Research Agent** — research, technical comparisons, and project planning.
- **Business Agent** — customer requests, project briefs, and business summaries.
- **Support Agent** — support inbox triage and draft responses.
- **Security Agent** — permission checks, suspicious activity review, and safe-operation enforcement.

The Manager is the only agent that accepts owner-level commands. Specialist agents report to the Manager and cannot expand their own permissions.

## Product principles

1. Mobile-first control panel with text and voice input.
2. Real project registry; connect repositories and deployments explicitly.
3. Durable task history and auditable activity log.
4. Approval gates for deployments, destructive changes, secret changes, external messages, and other high-impact operations.
5. Least-privilege credentials; secrets stay server-side and are never exposed to the browser or AI prompts.
6. Every task must report what was changed, what was tested, and what remains incomplete.
7. No claim of 24/7 availability unless monitoring and hosting are configured and verified.

## Planned stack

- Cloudflare Workers for the API and orchestration entry point.
- Cloudflare Workers AI or another configured model provider for reasoning.
- Cloudflare D1 for users, projects, tasks, approvals, and audit history.
- GitHub App/OAuth for repository access with narrowly scoped permissions.
- Telegram Bot API for optional owner notifications.
- Progressive Web App (PWA) for phone and desktop access.

## Implementation stages

1. **Foundation:** mobile dashboard, API health check, project registry, task and audit data model.
2. **Manager:** authenticated chat, task planning, delegation protocol, and task status tracking.
3. **Integrations:** GitHub App, Cloudflare, Telegram, and explicitly registered project connections.
4. **Specialist agents:** developer, monitor, research, business, support, and security.
5. **Operations:** scheduled monitoring, notifications, backups, tests, and deployment workflow.
6. **BEKIUZ COMPANY integration:** customer-facing project briefs and approved lead handoff.

## Safety and access model

- No broad personal access token in frontend code.
- Prefer a GitHub App installation token with repository-level selection.
- Keep credentials in Cloudflare Worker secrets.
- Use separate permissions per integration and project.
- Read-only inspection is the default.
- Code edits are made on a work branch and reviewed/tested before merging.
- Production deployment and destructive actions require explicit owner approval.
- Log each agent action with actor, target project, timestamp, outcome, and approval reference.

## Status

This repository is being initialized. Runtime deployment is not configured yet. No project integrations or production credentials are connected yet.
