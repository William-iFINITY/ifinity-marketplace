# OpenCode adapter for iFINITY AgentZ

> GENERATED — do not edit by hand. Regenerate with `npm run adapter:opencode`;
> CI drift check: `npm run verify:opencode-adapter`.

This directory is a projection of the canonical plugin (`.claude-plugin/`,
`.mcp.json`, `agents/`, `commands/`, `skills/`, `hooks/hooks.json`) into
OpenCode's conventions. The installer (companion app or manual steps below)
points OpenCode at the installed plugin root; nothing is published to npm.

## Install flow

Let `<plugin-root>` be the directory this plugin is installed to. Every
occurrence of `${AGENTZ_PLUGIN_ROOT}` in `opencode.json` and
`manifest.json` must be replaced with the absolute `<plugin-root>` path at
install time.

1. **MCP servers + instructions** — merge `opencode.json` (after placeholder
   substitution) into `~/.config/opencode/opencode.json`. This registers the
   local `agentz` stdio server plus the remote iMIS docs servers, and adds the
   generated operational guard file to OpenCode's instructions.
2. **Skills** (26) — symlink each `<plugin-root>/skills/<name>` directory into
   `~/.config/opencode/skills/<name>`. OpenCode reads Claude-format SKILL.md
   natively; no conversion. Sync on update: remove links whose target skill no
   longer exists, add links for new skills.
3. **Agents** (6) — copy `agents/*.md` into `~/.config/opencode/agents/`.
4. **Commands** (10) — copy `commands/*.md` into `~/.config/opencode/commands/`.

Steps 3-4 are copies (not symlinks) because the files here are already the
translated OpenCode dialect, regenerated on every plugin update.

## Hooks mapping

The Claude plugin ships two advisory prompt hooks (`hooks/hooks.json`).
OpenCode has no LLM-evaluated prompt hooks. The adapter preserves their full
canonical prompts in `instructions.md`, which `opencode.json` loads as
always-on instructions. In practical terms:

- **`imis_entity` purpose-owner/delete guard** — generic create/update/delete
  and execute are fail-closed when a purpose-built tool owns the operation;
  raw execute is denied unless explicitly allowlisted. Delete is a two-step
  hard-delete flow: the first call returns a preview and exact token, and only
  the confirmed second call deletes. Recommended OpenCode posture: add a
  `permission` rule set to `ask` for the agentz entity tool in
  `~/.config/opencode/opencode.json` (OpenCode names MCP tools
  `agentz_imis_entity`). The generated instructions preserve the owner route
  and require explicit user authorization for the confirmed delete.
- **Design-system nudge** — resolve `imis_design_system action=get` before
  authoring visual markup. Covered by the generated instructions wired in step
  1.

## Auth

Unchanged from other clients: the MCP server reads `~/.ifinity-imis/config.json`
and broker-issued tokens from the iFINITY AgentZ companion app. No OpenCode-side
credential configuration exists or is needed.
