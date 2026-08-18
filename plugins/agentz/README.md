# iFINITY AgentZ — iMIS Agent Plugin

iFINITY AgentZ helps associations use iMIS with more confidence by turning membership, events, finance, fundraising, reporting, digital content, and operational work into guided, evidence-backed actions that staff can understand, review, and control.

This plugin connects Claude to your iMIS EMS Cloud instance. It works in Claude Code, the Claude desktop app, and Claude Cowork.

## What It Does

AgentZ gives your team an AI working companion that understands common association tasks across:

- **Membership** — look up members, check renewal status, onboard, renew, reinstate, cancel, and review full member context across billing, groups, events, communications, and engagement
- **Events** — check registrations, attendee lists, capacity, waitlists, cancellations, and event revenue
- **Fundraising** — record donations, manage pledges, review donor history, and process Gift Aid
- **Billing and Finance** — review invoices, payments, balances, auto-pay, scheduled payments, and VAT
- **Reporting** — run existing queries, design new reports, and build dashboards
- **Content and Website** — create pages, manage navigation, configure iParts, and audit published content
- **Certification** — manage programmes, enrolments, progress, and experience logging
- **Communications** — review history, send approved emails, and track campaigns
- **Data Quality** — find duplicates, review merge candidates, and import data

AgentZ works as the signed-in user. Actions run with that user's iMIS permissions. The product is not a back door around access controls.

## Getting Started

### Prerequisites

- **Claude Code**, **Claude Desktop**, or **Claude Cowork**
- **iFINITY AgentZ** desktop app
- **iMIS EMS Cloud instance** with staff-level access

### Install in Cowork or Claude Desktop (recommended)

1. In Claude, click **Customize** then click the **+** next to Personal plugins
2. Select **Add marketplace**
3. Enter the URL `https://github.com/iFINITY-Ltd/ifinity-marketplace` and click **Sync**
4. Click **Browse plugins** → **Personal** tab → **ifinity-marketplace**
5. Click the **Ifinity imis** plugin card, then click **Install**

For step-by-step screenshots, see the [marketplace install guide](https://github.com/iFINITY-Ltd/ifinity-marketplace#install-in-cowork-or-claude-desktop).

### Install via iFINITY AgentZ

1. Download AgentZ from your organisation's iFINITY download page
2. Open AgentZ and sign in
3. Go to **Settings > Agent Plugin — Claude Code**
4. Click **Install Plugin**

AgentZ handles marketplace registration, installation, and updates automatically.

### Install via Claude Code CLI

```bash
claude plugin marketplace add iFINITY-Ltd/ifinity-marketplace
claude plugin install agentz@ifinity
```

### Connect to iMIS

1. Open **iFINITY AgentZ** and sign in to your iMIS instance
2. AgentZ acquires an access token and pushes it to the plugin automatically
3. All tools activate immediately — no manual configuration needed

Verify the connection by asking:

> "Check iMIS connection status"

## Usage

Use natural language. AgentZ auto-invokes the right skills and tools.

### Day-to-Day Examples

> "Show me the full story for this member."
>
> "Who's registered for the Annual Conference?"
>
> "Which members are due to renew in the next 30 days?"
>
> "Record a donation of £500 for Jane Smith."
>
> "Why can't this member access member-only content?"
>
> "Check Gift Aid status for donor 12345."

### Reporting and Dashboards

> "Build an active member report grouped by chapter."
>
> "Show event attendees with unpaid balances."
>
> "Prepare a board-pack view of membership, income, and engagement."

### Website and Content

> "Create a new events landing page."
>
> "Design a member dashboard showing upcoming renewals."
>
> "Audit the public site navigation structure."

## Working in Cowork

The plugin works in Cowork sessions. iFINITY AgentZ runs on your local machine and the plugin connects to it via the local bridge. Ensure AgentZ is running before starting a Cowork session.

You may need to allowlist your iMIS domain at [claude.ai/settings/capabilities](https://claude.ai/settings/capabilities) for API calls to reach iMIS from the Cowork environment.

## Safety and Governance

AgentZ is careful about the difference between "we found evidence", "we created a working item", "this is live", and "this still needs approval." That distinction matters because member data, financial records, website content, email sends, and navigation can all have real operational consequences.

- Actions run with the signed-in user's iMIS permissions
- Destructive operations require confirmation
- Query creation is guarded with a separate write confirmation
- Evidence is surfaced before changes are made
- The AgentZ desktop app provides a visible activity feed and workflow surface

## Support

For help with the plugin, contact iFINITY support through your organisation's support channel or visit the [iFINITY community](https://github.com/iFINITY-Ltd).
