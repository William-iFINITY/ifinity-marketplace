# Angular client iParts

Use the `angular` profile only after you read the common framework authoring contract.

- Use the pinned Angular application builder with AOT and browser-only output. Do not add SSR, prerendering, a Node server, source maps, or a service worker to the production ZIP.
- Keep the base starter zoneless. Do not add `zone.js` or `provideZoneChangeDetection`. A zone-based variant needs a same-page inventory and live compatibility proof.
- Start one component for each unclaimed host. Do not use one `bootstrapApplication` selector that finds only the first placement.
- Keep Angular emulated view encapsulation. Do not use `ViewEncapsulation.None` or Shadow DOM. Put reviewed AgentZ-scoped CSS in the global stylesheet.
- Do not put unreviewed component style strings in TypeScript. The package CSS audit cannot see CSS compiled into JavaScript.
- Do not use a form or `ngSubmit`. Reactive controls can use a container with `[formGroup]` and buttons with `type="button"`.
- The post-build step removes the package base element, gives emitted JavaScript/CSS package-specific names, and rewrites HTML asset URLs to the exact package base. Keep this step.
- Angular Material and CDK are optional. If used, provide an instance-owned overlay container below the owning `.agentz-design` wrapper. Remove it with the instance. Prove menus, dialogs, tooltips, focus, tokens, and stacking with two placements.

The starter uses Angular 21 because the AgentZ runtime supports Node 20.19. Angular 22 requires a newer Node runtime. Upgrade the pinned profile only when the plugin runtime and generated-project build proof both support it.
