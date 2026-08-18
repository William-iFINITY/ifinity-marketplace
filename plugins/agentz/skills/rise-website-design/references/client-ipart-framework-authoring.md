# Client iPart framework authoring

Use this contract for a discrete client application that iMIS will inject into a RiSE page. It applies to plain JavaScript, React/Vite, and Angular.

## Select a profile

| Profile | Use it when | Added cost |
| --- | --- | --- |
| `vanilla` | The iPart has a small interaction and does not need a component framework. | You own DOM updates and cleanup. |
| `react-vite` | The iPart has composed interactive state, reusable components, or React dependencies. | Bundle React. Manage roots, effects, and portals per iPart instance. |
| `angular` | The client already uses Angular or the iPart needs Angular dependency injection and typed application structure. | Bundle Angular. Keep it zoneless and manage each host instance explicitly. |

HTML, JavaScript, and CSS are not a fourth delivery model. They are the base browser technologies. React and Angular add a source and component model, a compiler, dependency management, and lifecycle rules. All three profiles produce the same iMIS static ZIP and use the same RCT, placement, settings, API, IQA, design, and render contracts.

Do not use a framework only to display static content. Use a native iPart or ContentHtml when iMIS or the page can own the result without a discrete application package.

## Start the project

1. Call `imis_design_system action="get"` with the required design set.
2. Read `agentContract.requiredReading`. Tokens alone are not design guidance.
3. Write an `agentz.client-ipart-project.v1` specification. Include project and package names, framework, mount key, design set, audiences, settings schema/defaults, IQA contracts, API contracts, expected render markers, and business readback contracts.
4. Call `imis_client_ipart_package action="scaffold" projectSpecObject={...} outputDirectory=<absolute empty directory inside the workspace>`. The tool materializes the starter project, `agentz-client-ipart.json`, and `.agentz/design-preview.css` into that directory (workspace-contained) and returns the normalized contract plus a `scaffoldResult` readback. If the MCP server cannot write your workspace, omit `outputDirectory` and extract the returned `projectZipBase64` into an empty directory instead.
5. Keep the returned `bootstrapContract` with the project for the deploy and proof steps.
6. Work on the project in place with your normal editing tools; the starter is now your codebase.
7. In the generated project, run `npm install` and `npm test`. Then use the build, check, and package entries in `package.json`.
8. Call `imis_client_ipart_package action="validate" zipPath="<generated ZIP>"`. If `projectSpec.guestPalette` is present, pass the same `guestPalette` value.
9. Deploy the same ZIP with `action="deploy"`. Pass the same `guestPalette` again when it is present. Place only the returned non-empty content-type key with `imis_page_iparts kind="clientIpart"`.

The scaffold refuses to overwrite a non-empty directory. Direct dependency versions are exact, and `npm install` creates the lock file locally. The local preview file stays under `.agentz/`. The build and ZIP exclude it. The package writer is the only owner of production `design-tokens.css`.

The React/Vite and Angular profiles require Node `^20.19.0 || ^22.12.0 || >=24.0.0`. This is the engine range of the selected build tools. Plain JavaScript does not add that framework build-tool constraint.

## Common iMIS runtime contract

- Put the `.agentz-design` scope on an element inside the package body. iMIS removes the package body during injection.
- Use the exact absolute base `/iPartSource/<package-name>.zip/` for scripts, styles, images, chunks, workers, and media.
- Do not use a nested form. Use a container and buttons with `type="button"`.
- Support two placements of the same RCT on one page. Keep state, identifiers, content keys, settings, and overlays inside the owning wrapper.
- Start instances that iMIS adds after the module first runs. Clean up instances that it removes.
- Keep `[x-contentKey]` and `[x-contentItemKey]` inputs inside each wrapper. Do not give them repeated fixed ids.
- Always ship `config.html`. It reads and updates `#JsonSettings` but does not call a save API. Preserve unknown settings fields.
- Validate declared settings defaults during scaffold. Validate edited and saved values against the same schema. Get runtime settings from `/api/ContentItem` with the instance keys. Unknown fields stay intact for version compatibility.
- Keep `loggedInPartyId`, `selectedPartyId`, and the requested `?ID=` Party separate. A URL Party is not authorization.
- Send same-origin credentials and `RequestVerificationToken` for iMIS `/api` calls. The adapter reads canonical id, named-input, and meta token shapes from readable parent, top, and local documents. Never send that token to another origin. Never package a bearer token or secret.
- Reference the tool-owned `ifx-query-client.js`. Do not copy its source. Use query aliases as data keys. `/api/Query` cannot add a new server sort.
- Use explicit user actions for mutations. Prevent duplicate submit. A 2xx or visible success message is not business proof; read back the iMIS domain record.
- Do not register a service worker, control the host router or history, or add global CSS.

The closed settings schema supports object properties and required fields, scalar and array types, `enum`, `const`, string lengths and patterns, numeric bounds, array item counts and item schemas, and `allOf`/`anyOf`/`oneOf`/`not`. It also accepts `title`, `description`, and `default` annotations. Bootstrap rejects other keywords. Unknown object fields are always preserved for version compatibility; `additionalProperties` is not part of this contract. Add project-specific runtime validation outside this schema when the application needs another rule.

## Design and accessibility

Follow the selected AgentZ Design identity, doctrine, components, and exhibits. Scope local CSS below `.agentz-design`. Use `var(--ds-*)` and `var(--ifx-*)`. Do not add literal colours, literal font families, `@import`, `@font-face`, operating-system dark mode, or uppercase transforms.

Use a section-level heading that fits the host page. Do not add another page `main` landmark by default. Provide visible focus, keyboard operation, loading/error/empty/success text, a live status region, non-colour status cues, image alt text, and reduced-motion behavior where motion exists.

## Completion proof

A local build proves only that the framework compiles and the ZIP meets static AgentZ checks. Completion needs ZIP and RCT readback, DisplayHtmlPath and ConfigHtmlPath, configuration-area proof, page XML, two same-page instances with different keys/settings, the published route, target-user render markers, design provenance, API/IQA results without attributable 401/403/404/500 responses, and domain readback for each write.

The `#JsonSettings` configure-dialog edit/save/render mechanism is live-proven on the active staff tenant. The live report shows the native Configure modal, parent-page save, page XML readback, published render, and scratch cleanup. Repeat this proof on the target tenant when tenant-specific behavior is material.
