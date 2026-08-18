# iFINITY Marketplace

Claude Code plugin marketplace for iFINITY products.

## Install in Cowork or Claude Desktop

### Step 1 — Open the plugin directory

In Claude, click **Customize** then click the **+** button next to Personal plugins. Select **Add marketplace**.

![Open Add marketplace](docs/install/01-add-marketplace-menu.png)

### Step 2 — Add the iFINITY marketplace

Enter the marketplace URL and click **Sync**:

```
https://github.com/iFINITY-Ltd/ifinity-marketplace
```

![Enter marketplace URL](docs/install/02-add-marketplace-url.png)

### Step 3 — Find the plugin

Click **Browse plugins**, then select the **Personal** tab. The iFINITY marketplace appears as a source. Click the **Agentz** plugin card.

![Browse plugins](docs/install/03-browse-marketplace.png)

### Step 4 — Review and install

The plugin detail page shows everything included — 20 skills, 6 specialist agents, 2 safety hooks, and 3 connectors. Click **Install**.

![Plugin detail and install](docs/install/04-plugin-detail.png)

### Step 5 — Connect to iMIS

Open the **iFINITY AgentZ** desktop app and sign in to your iMIS instance. AgentZ acquires an access token and pushes it to the plugin automatically. Verify the connection by asking Claude:

> "Check iMIS connection status"

## Install via Claude Code CLI

```bash
claude plugin marketplace add iFINITY-Ltd/ifinity-marketplace
claude plugin install agentz@ifinity
```

## Install via Codex CLI

```bash
codex plugin marketplace add iFINITY-Ltd/ifinity-marketplace
```

Then open the plugin directory in Codex, select the **iFINITY** marketplace, and install **iFINITY AgentZ**.

## Install via iFINITY AgentZ

Open AgentZ, go to **Settings > Agent Plugin — Claude Code**, and click **Install Plugin**. AgentZ handles marketplace registration, installation, and updates automatically.

## Plugins

| Plugin | Description |
|--------|-------------|
| [agentz](plugins/agentz/) | iMIS EMS Cloud integration — membership, events, fundraising, billing, content management, reporting, website design, query building, and system configuration |

## Source

Plugin source code lives in [ifinity-mcp](https://github.com/iFINITY-Ltd/ifinity-mcp). This marketplace repo contains only release distributions, updated automatically by the release workflow.
