# Connectors

The plugin ships with three connectors that give Claude access to your iMIS data and the iMIS documentation library.

## iMIS (agentz)

The core connector. Provides read and write access to your iMIS EMS Cloud instance.

- **Entities:** 200+ iMIS entity types across membership, events, fundraising, billing, content, certification, communications, and more
- **Tools:** 70+ operations including search, lookup, create, update, delete, query execution, and dashboard/content management
- **Authentication:** Handled automatically by the iFINITY AgentZ desktop app — no manual setup required

## iMIS Help Documentation (imis-docs)

Searchable access to 1,200+ articles from the official iMIS help site (help.imis.com). Covers product features, configuration, and step-by-step guidance for tasks across RiSE, finance, settings, community, membership, marketing, events, reports, fundraising, commerce, and more.

- **Authentication:** None required (public documentation)
- **Use case:** When Claude needs to explain how to configure something in iMIS, look up feature behaviour, or guide a user through steps that the API cannot perform directly

## iMIS Developer Documentation (imis-docs-dev)

Searchable access to the iMIS developer documentation from developer.imis.com — API reference pages, developer guides, and endpoint specifications.

- **Content:** 72 developer guides, 2,115 API reference pages, 17 API module specifications
- **Authentication:** None required (public documentation)
- **Use case:** When Claude needs to verify exact API behaviour, check field definitions, or look up data contract details

## Using Additional Connectors

You can connect other services alongside this plugin. Common pairings for association teams:

| Category | Use with iMIS for... | Examples |
|----------|---------------------|----------|
| Email | Member communications and campaigns | Microsoft 365 |
| Cloud storage | Storing exported reports and documents | Microsoft 365, Dropbox |
| Project tracking | Tracking implementation and operational tasks | Jira, Asana, Linear |
| Team chat | Notifying staff of member changes or task outcomes | Slack, Microsoft Teams |

Add connectors via Claude Code:
```bash
claude mcp add --transport http --scope user your-server-name https://your-server.com/mcp
```
