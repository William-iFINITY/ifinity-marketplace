---
name: hub-connection
description: >-
  Check and repair the iFINITY AgentZ connection for this plugin. Use when the
  user says "setup", "connect to iMIS", "AgentZ is not connected", "plugin not
  connected", "check connection", "MCP disconnected", "no token", "how do I
  sign in", or when Claude needs to verify that AgentZ has supplied
  iMIS instance and OAuth token state.
argument-hint: "[intent: check-status | guide-setup | guide-repair]"
---

# iFINITY AgentZ Connection

The iMIS plugin authenticates through the iFINITY AgentZ desktop app. There is no
manual credential entry in Claude, Cowork, or Claude Code.

This skill owns the AgentZ desktop link only. Configuring the iMIS Client
Application, security roles, or the API connection belongs to
system-configuration; classifying an iMIS task or choosing the right writer tool
belongs to imis-domain-knowledge.

The AgentZ desktop app is downloaded from the iFINITY licensing download page:

```text
https://ifinityagentz.co.uk/download
```

That page is gated by the organisation auth code or a magic-link email unlock,
and also exposes the current Claude Cowork plugin ZIP.

## Check Connection

Call `imis_connection_status`.

If connected, report:
- iMIS instance URL
- connection status (CONNECTED when AgentZ has supplied an OAuth token, else NOT_CONNECTED)

## If Not Connected

Guide the user through AgentZ path:

1. If AgentZ is not installed, download it from `https://ifinityagentz.co.uk/download`.
2. Open iFINITY AgentZ on the local machine.
3. Sign in with the iFINITY licence magic link.
4. Save iMIS credentials in Settings > iMIS Account.
5. For org admins, use Settings > API Connection to create or repair the iMIS Client Application.
6. Keep AgentZ running while using Claude Code or Cowork.

Once AgentZ connects, it pushes the iMIS instance URL and OAuth token to the plugin over the localhost WebSocket bridge.

## Verify

After the user has AgentZ running, call `imis_connection_status` again. If connected, run a low-risk read such as:

```text
imis_find_member query="test" limit=1
```

Use a small limit and avoid write operations until the connection and target iMIS instance are confirmed.
