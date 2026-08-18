# FAQ — iFINITY AgentZ iMIS Agent Plugin

## General

### What is iFINITY AgentZ?

An AI working companion for association teams using iMIS EMS Cloud. It connects Claude to your iMIS instance so staff can ask questions, look up members, run reports, manage events, record donations, create content, and carry out operational tasks using natural language.

### What iMIS versions does it support?

iMIS EMS Cloud (SaaS). The plugin uses the iMIS REST API, which is available on iMIS 20.x and later. On-premises iMIS with the REST API enabled should also work but is not actively tested.

### Does it work with Claude Code, the desktop app, and Cowork?

Yes. The plugin runs in Claude Code (CLI and IDE extensions), the Claude desktop app, and Claude Cowork sessions.

## Setup and Connection

### How do I set it up?

Install the **iFINITY AgentZ** desktop app, sign in to your iMIS instance, and go to Settings > Agent Plugin to install the plugin. AgentZ handles authentication, plugin installation, and updates automatically.

### Can I install without the AgentZ desktop app?

Yes, via the Claude Code CLI:

```bash
claude plugin marketplace add iFINITY-Ltd/ifinity-marketplace
claude plugin install agentz@ifinity
```

You will still need AgentZ running to authenticate with iMIS.

### How does authentication work?

The plugin authenticates exclusively through the iFINITY AgentZ desktop app. There are no manual credentials, no `.env` files, and no configuration files. AgentZ signs in to iMIS, acquires an OAuth access token, and pushes it to the plugin securely.

### Are my credentials sent to Claude or Anthropic?

No. Credentials are entered in the AgentZ desktop app, not through Claude. The plugin only receives access tokens — never usernames or passwords.

### How do I connect in Cowork?

Ensure iFINITY AgentZ is running on your local machine before starting a Cowork session. You may need to allowlist your iMIS domain at [claude.ai/settings/capabilities](https://claude.ai/settings/capabilities).

### Can I work with more than one iMIS instance?

Yes. Switch the instance URL in the AgentZ development settings. The plugin will reconnect with the new instance.

## Capabilities

### What can it do?

The plugin currently provides 126 tools covering membership, events, fundraising, billing, content management, reporting, certification, communications, forms, advertising, AgentZ Design, data quality, and system configuration. It can read, search, create, and update data across 200+ iMIS entity types.

### Can it create IQA queries?

Yes. The plugin can design, validate, and create new IQA query definitions from structured intent. It supports columns, filters, sorts, aggregation, grouping, calculated expressions, relations, and template output.

### Can it modify website content?

Yes. It can create content pages, manage document system folders, configure layouts and iParts, set up navigation, and audit published pages. Website changes are surfaced clearly and separated from publishing decisions.

### Can it send emails?

Yes, with approval. The plugin can send emails through iMIS, but this is always an explicit, approved action — never automatic.

## Safety

### Can it delete data?

The plugin has delete capability, but destructive operations are guarded by a confirmation hook. The agent operates with the signed-in user's iMIS permissions — if the user cannot delete something in iMIS, the agent cannot either.

### What safeguards are in place?

- All actions run with the signed-in user's permissions
- Delete operations require explicit confirmation
- IQA query creation requires write confirmation
- Document creation includes path and type validation
- Evidence is shown before changes are applied
- The AgentZ app provides a visible activity feed

### Is my data safe?

The plugin communicates directly with your iMIS instance over HTTPS. No iMIS data is stored by the plugin. Authentication tokens are held only in memory for the session duration.

## Connectors

### What data sources does the plugin connect to?

| Connector | Description |
|-----------|-------------|
| **iMIS** | Your iMIS EMS Cloud instance — full read/write access via REST API |
| **iMIS Help** | Searchable access to 1,200+ iMIS product help articles |
| **iMIS Developer Docs** | API reference, developer guides, and endpoint documentation |

The help and developer documentation connectors are read-only and require no authentication.

## Troubleshooting

### The plugin says it is not connected

Ensure iFINITY AgentZ is running and signed in. Ask Claude to "check iMIS connection status" to verify.

### I get permission errors

The plugin uses the signed-in user's iMIS permissions. If the user does not have access to an entity or operation in iMIS, the plugin will receive the same permission error.

### Queries or reports return no data

Check that the query source exists and that the signed-in user has access to it. Some IQA sources are restricted by iMIS security groups.
