---
description: "Check iMIS connection status and guide the user to the iFINITY AgentZ if not connected"
---

# iMIS Connection Setup

The iMIS plugin authenticates through the **iFINITY AgentZ** desktop app. There is no manual credential entry in Claude.

## Check Connection

Call the `imis_connection_status` tool to check if the AgentZ has pushed a token.

If connected, you're ready to use all iMIS tools.

## If Not Connected

Guide the user:

1. **Open the iFINITY AgentZ app** on your computer
2. **Sign in** with your iFINITY license (magic link email)
3. **Enter your iMIS credentials** in Settings > iMIS Account > Save & Sign In
4. **Set up the API connection** in Settings > Set Up API Connection (admin only, one-time)
5. AgentZ will push an OAuth token to this plugin automatically

Once AgentZ connects, all 123 iMIS tools activate immediately — no restart needed.

## Verify

> "List the first 3 contacts in iMIS"
