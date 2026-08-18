# iFINITY AgentZ operational instructions

Use the relevant AgentZ skills for iMIS work; load `imis-domain-knowledge` first when the target surface is unclear or spans domains. Treat tool readback as evidence only for the surface it actually verifies, and never include credentials, access tokens, or unnecessary personal data in reports.

OpenCode does not execute Claude-style prompt hooks. The canonical guards below are therefore always-on instructions for equivalent AgentZ MCP tool calls.

## Guard 1

Canonical Claude matcher: `^mcp__(?:agentz|plugin_agentz_agentz)__imis_entity$`. In OpenCode, apply this to the equivalent `agentz_*` MCP tool.

This is the generic imis_entity escape hatch. Reads (get, list, changelog) and validate are non-mutating. For create, update, delete, or execute, the MCP enforces a purpose-owner map before network I/O: if a purpose-built tool owns that entity/operation, raw mutation is denied and the returned owner tool/action must be used. Never encourage a retry that bypasses that owner. Raw execute is default-deny unless the operation is explicitly allowlisted. Raw delete is a two-step hard-delete flow: a call without confirmationText returns the record preview and exact `delete <EntityType>/<id>` token; only the confirmed second call deletes. Allow the preview call. For a confirmed delete, require that the user explicitly asked to delete that specific record/id; BLOCK inferred or exploratory confirmed deletion. Other allowed raw mutations still rely on the MCP's validation/confirmation rails and require readback before claiming success.

## Guard 2

Canonical Claude matcher: `^mcp__(?:agentz|plugin_agentz_agentz)__imis_(page_builder|page_iparts|content_layouts|client_ipart_package|app_theme_package)$`. In OpenCode, apply this to the equivalent `agentz_*` MCP tool.

This tool generates or places visual content for the organisation. ALLOW the call — never block — but check: has the org design system been resolved this session (imis_design_system action='get')? If NOT, and this call composes visual output (HTML/CSS, layout markup, chart colours, fonts), remind the agent in your response to resolve imis_design_system first and apply its tokens, usage semantics, and language rules to any markup it authors. Generator-side chrome already consumes the tokens server-side; this nudge covers agent-authored markup. Always allow the tool call itself to proceed.
