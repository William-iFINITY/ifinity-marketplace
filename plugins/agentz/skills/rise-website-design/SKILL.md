---
name: rise-website-design
description: >-
  Design and manage iMIS RiSE websites — page creation, iPart configuration,
  navigation design, theming, and content publishing. This skill should be used
  when the user says "RiSE", "website", "web design", "page builder",
  "iPart", "content item", "master page", "template", "theme", "CSS",
  "navigation menu", "mega menu", "layout", "public site", "staff site",
  "create a page", "add a widget", "website navigation", "page layout",
  "responsive design", or when working with iMIS website configuration.
when_to_use: >-
  Use for arbitrary RiSE design and implementation: custom page layouts,
  dashboard/bento sections, iPart grids, query/template/chart bindings,
  navigation/sidebar placement, themes, CSS, and publish handoffs. Prefer
  reusable declarative layout/page specs over cloned native dashboard presets.
  This skill owns website look-and-feel and design layouts; routine
  Document-System CRUD (create/update/publish/browse individual content records)
  belongs to content-management. To migrate an EXTERNAL client website INTO RiSE,
  use the imis_website_migration lane (crawl → classify → map → preview_batch →
  write_batch → rollback_batch: a durable project, robots-respecting source
  crawl, and an exact-confirmed create-only batch writer with gated rollback),
  not manual page-by-page building.
argument-hint: "[action: create-page|navigation|iparts|theme|browse]"
---

# RiSE Website Design & Management

Design, build, and manage iMIS RiSE websites — pages, iParts (content items), navigation, themes, and publishing.

**Documentation resource**: Use the `imis-docs` connector to search official iMIS help articles for iPart configuration options, theme builder steps, navigation design, page layout details, and RiSE site management (300+ articles). Use the `imis-docs-dev` connector to look up Document/ContentItem API endpoints and iPart data contracts.

**Site-infrastructure tools** (beyond page building): `imis_rise_site_infrastructure` profiles or plans the whole connected-site build graph (theme package → website layout/template → site binding → folders → navigation → pages) with a lifecycle matrix per lane; `imis_site_shell` owns website layouts (WSL), website templates (WST), and Themes records; `imis_app_theme_package` owns the actual theme ZIP/CSS/skin package lifecycle with backups and gated publish/delete; `imis_rise_shortcuts` profiles URL shortcuts/redirect rules; `imis_native_staff_audit` is a read-only audit of native staff screens with no API surface (publishing servers, content authority groups); `imis_site_package_manifest` captures a reusable site-package manifest as a durable document. Moving a built site BETWEEN tenants belongs to the configuration-packages skill.

**Custom client iParts**: every discrete custom app/runtime ZIP is a registered client iPart. `imis_client_ipart_package` (plan → validate → deploy) writes the ZIP, registers its RCT content type, and registers both `DisplayHtmlPath` and the required `ConfigHtmlPath` configuration area. Place it with `imis_page_iparts kind=clientIpart` only after deploy returns the content type. Verify the configuration area and in-page runtime with `imis_rendered_page_audit` — client iPart failures surface when iMIS injects the iPart into a real page, not in static checks. Every response returns the authoring rules (`clientIpartContract.rules`); author the package to them. `queryClient` writes are retired and always rejected. Inspect an existing query-client artifact only to migrate or remove it. Deliver client-based (HTML/JS/CSS) iParts — iMIS Cloud does not support server-side ASCX/DLL/AppCode iPart binaries, so replace those with a client-based package; the Files Manager/AppCode deploy route applies only to self-hosted/on-prem iMIS.

**Recommended authoring loop (G-036, live-proven)**: write the package files on the LOCAL filesystem, bundle them with `zip` yourself, then `validate`/`deploy` with `zipPath` — a design-contract or auth-audit rejection retry re-sends a path, not the whole package. The tool prepares both input modes identically: it injects/refreshes the provenance-stamped `design-tokens.css` and links + scopes the served runtime entry (the design scope is a wrapper element INSIDE the body — iMIS drops the package `<body>` tag at inline injection, so never rely on a body class). To consume IQA queries from the runtime, reference `/iPartSource/<pkg>.zip/ifx-query-client.js` and the tool bundles the `ifxQueryClient` helper (filtered `parameters`, complete-set `fetchAll`, and `renderQueryTemplate` for `{#query.Alias}` templates). For third-party-brand demo packages, pass `guestPalette` ({name: "#RRGGBB"}) and style with `var(--ds-x-<name>)` — literal colours stay banned in package CSS.

**Framework project scaffold**: for a new plain JavaScript, React/Vite, or Angular client iPart, load [references/client-ipart-framework-authoring.md](references/client-ipart-framework-authoring.md). Also load the selected framework reference directly: [references/client-ipart-react-vite.md](references/client-ipart-react-vite.md) or [references/client-ipart-angular.md](references/client-ipart-angular.md). Resolve AgentZ Design first and read every entry in `agentContract.requiredReading`. Then call `imis_client_ipart_package action="scaffold"` with a closed `agentz.client-ipart-project.v1` specification and an absolute empty `outputDirectory` in your workspace. The MCP tool materializes the starter project there — source files, `agentz-client-ipart.json`, and `.agentz/design-preview.css` — and returns the normalized contract plus a `scaffoldResult` readback; the write is contained to the trusted workspace root and it never writes iMIS. When the MCP server cannot write your workspace (split filesystems), omit `outputDirectory`: the response returns the project as sha256-stamped `projectZipBase64` (via the standard large-payload resource) to extract into an empty directory yourself. Build and package in that directory with your own tools (the returned `scaffoldResult.nextSteps`), then use the existing `validate` and `deploy` actions with the generated ZIP path. If the normalized project contains `guestPalette`, pass that same value to both actions so production contains the previewed guest tokens. Do not hand-copy a starter or create another package writer.

**Custom iPart configuration area and per-instance settings**: every discrete app ZIP must ship a `configFile` (default `config.html`) and register it as `ConfigHtmlPath`, including an app that exposes no business settings. iMIS renders this page inside the Page Builder Configure dialog. When the iPart has per-instance values, the page serializes them through `#JsonSettings`; iMIS stores them as a JSON string in the iPart's `Settings` element on the page document. Work with them directly:
- READ a configured instance's settings with `imis_page_iparts action="inspect"` (or `imis_document action="get"`) — the JSON is on the `ClientSideContentItem`'s `Settings` element.
- STORE them with `imis_page_iparts action="update_properties" documentId={id} contentItemKey={key} properties={"Settings":"<full JSON object>"}` (`allowInsert=true` when the instance has no `Settings` element yet) — write the whole JSON object. This persists the JSON into the page XML and an `inspect` readback confirms the stored text; it does NOT confirm the runtime parses it. A JSON `Settings` write is storage-only until a rendered audit (`imis_rendered_page_audit`) shows the iPart consuming the settings — verify before reporting success.
- A missing `configFile` or nil `ConfigHtmlPath` is an incomplete discrete-app package. Do not treat common base fields as a substitute for the app's registered configuration area.

## Key Concepts

- **RiSE**: Responsive iMIS Experience — the website builder that fuses database management with web publishing
- **Content Record**: A page in iMIS — identified by path, contains iParts in layout zones
- **iPart (Content Item)**: A dynamic widget placed on a page (query display, form, navigation, HTML, chart)
- **Layout**: Page template defining content zones (SingleColumn, OneOverTwo, TwoColumn, ThreeColumn, etc.)
- **Document System**: Hierarchical tree storing all content (pages, folders, queries, templates)
- **Master Page**: The overall page wrapper (header, footer, navigation) applied to all pages
- **Theme**: CSS + skin files + images defining the visual appearance
- **Navigation**: Primary (main menu), Secondary (sub-menus), Utility (header/footer links)

---

## Design Surface Directory

Load [references/design-surfaces-and-exhibits.md](references/design-surfaces-and-exhibits.md)
when RiSE work includes generated visual sections, custom CSS, registered client
iPart packages, retired query-client artifact migration, exhibits, or theme changes.

The short model:

- Use native iMIS iParts for native workflows and iMIS-owned rendering.
- Use designed ContentHtml for branded page sections and exhibit placement.
- Use registered client iPart packages for custom IQA-backed interfaces and all other discrete runtime widgets.
- Require the ZIP, RCT registration, and registered `config.html` configuration area for each discrete app.
- Treat `queryClient` as a retired write path. Migrate or remove existing artifacts; never deploy an unregistered runtime.
- Use app/theme package work only for explicit site/theme CSS, not embedded
  iPart styling.
- Keep embedded custom CSS under `.agentz-design`; let the writer own
  `design-tokens.css`.

---

## Page Creation Workflow

### Step 1: Discover Site Ownership and Browse Existing Structure

```
imis_site_profile scope=discovery perspectiveName="<site or portal name>"
imis_document action=browse path="@/iCore/Content"
imis_document action=browse path="@/Shared Content"
imis_document action=browse path="@" maxDepth=1        — see top-level folders
```

Understand what exists before creating new content. For an existing website, microsite, or member portal, start with `imis_site_profile scope=discovery` so the agent carries native RiSE Perspective/site ownership, website keys, content roots, and NAV roots into every later browse/write/publish step. Use `maxDepth` to control depth (1 = immediate children, 2 = two levels, 0 = full tree).

Key paths:

- `@/` — Site root
- `@/Shared Content/` — preferred workspace for generated/custom content when present
- `@/iCore/Content/` — system/sample content pages; inspect, but do not use as the default write target
- `~/` — sitemap/navigation structure (`NAV` documents; use `imis_navigation_items`)
- `$/Common/Queries/` — System IQA queries

Before changing an existing page, iPart, layout, query, or NAV item, keep `backupBeforeWrite` enabled on the relevant write primitive and include the returned `backup.snapshotId`/`backup.snapshotPath` in the handoff packet.

When running in Cowork, use `show_widget` for RiSE website audit and action boards whenever that tool is loaded. Sitemap/SEO/a11y results, rendered page checks, navigation placement findings, iPart inventories, and publish/action matrices should appear inline in chat with evidence rows and follow-up buttons. Do not make `create_artifact` the primary Cowork output for these boards; files are optional exports after the inline widget.

### Step 2: Plan the Page

Choose and prove a **layout** for the page before placing iParts:

- **SingleColumn**: Full-width, best for simple content pages
- **OneOverTwo**: One zone on top, two below — good for dashboards
- **TwoColumn**: Side-by-side zones — good for content with sidebar
- **ThreeColumn**: Three equal zones — good for feature showcases

For real dashboard/workbench pages, do not create the content record first and then pile iParts into zone 1 unless that is the intended design. Inspect an existing page/layout or create a `LAY` document, then map every iPart to a specific `layoutZone` and `sortOrder`. After writing, use `imis_page_iparts action="inspect"` and require `layoutPlacementSafe=true`; if `layout.hasLayout=false`, iMIS will stack the iParts even if the XML contains zone numbers.

For dashboards or client staff sections, prefer `imis_page_builder recipe=dashboard` over manually chaining document and iPart tools. It accepts a subject-agnostic JSON spec for pages, iParts, query/chart/template bindings, custom layouts, and optional NAV records, then returns a single delivery packet with all paths and keys. Read the returned `layoutContract` before writing or before claiming completion; it shows the chosen layout, configured zones, requested iPart placements, and whether the design is safe before write.

For any content section, not just dashboards, carry the discovered `perspectiveName`, `websiteKey`, selected parent content path, and parent navigation path into the creation/update packet so the work is tied to the real iMIS site rather than a remembered demo folder.

When a page must appear inside an existing Staff/sidebar section, match the content root used by working siblings in that sitemap branch before installing or repointing NAV. The sitemap folder name creates the `~/` route segment and `PrePublishUrl` chooses the target content, but breadcrumb/title/CSS/navigation-code fields do not attach the Staff shell. Render the final `~/` path in AgentZ and require header/sidebar DOM verification; a raw `@/` publish URL or body-only route is not acceptable evidence.

For novel layouts, use `imis_content_layouts` or the `customLayout` field on `imis_page_builder recipe=dashboard`. Do not hardcode Membership/Event dashboard presets when the requested design is arbitrary. The public layout grammar is one outer `<div>` containing unique `<p>1</p>`, `<p>2</p>` authoring tokens; the MCP serializes these as native `LAY` tokens (`{1}`, `{2}`), matching built-in layouts and preserving editable Content Designer zones. Bootstrap `col-sm-*` grids are the safest supported editor pattern; nested rows produce bento/dashboard arrangements without needing new code.

### Step 3: Create the Content Record

```
imis_document action=create name="My New Page" parentPath="@/Shared Content/AgentZ" documentTypeId="CON" isFolder=false
```

Document types you create through `imis_document action=create`:

- **CON**: Content record (page)
- **CFL**: Content folder (for organising pages in the `@/` tree)
- **FOL**: Generic folder

Do not create these through `imis_document action=create`:

- **NAV**: sitemap/sidebar navigation item in the `~/` tree — use `imis_navigation_items`
- **IQD**: IQA query definition — use `imis_iqd_query`

### Step 4: Add Content Items (iParts)

Use `imis_page_iparts` to manage iParts on pages:

For a full dashboard page set:

```
imis_page_builder recipe=dashboard action="create" dashboardName="Client_Dashboard_20260508" dashboardTitle="Client Dashboard" parentContentPath="@/Shared Content/AgentZ" installNavigation=true parentNavigationPath="~/Client" navigationCssClass="ReportsLink" pages='[{"title":"Overview","iparts":[{"type":"query_chart","title":"Contacts by type","queryPath":"$/Samples/Dashboards/Community/Contacts by type","chartType":"donut","labelColumnName":"Customer Type","dataColumnName":"Records"}]},{"title":"Detail","role":"subpage","iparts":[{"type":"query_menu","title":"Detail list","queryPath":"$/Common/Queries/..."}]}]'
```

For QueryChartViewer components, supported native-rendered chartType values are `donut`, `bar`, `barvertical`, `barhorizontal`, and `line`. Use `barvertical` (or `bar`) for vertical column charts and `barhorizontal` for horizontal bars; incoming `column` is normalized to `barvertical` because persisted `column` renders an empty series. Bind IQA Display aliases with `labelColumnName` and `dataColumnName`; add `seriesColumnName` for native series grouping; use `enableStackedSeries` for stacked compatible series; and set `seriesDataDateAsCategory` deliberately for Date/DateTime labels or generated `dateBucket` labels. Treat other chart type strings as unsupported unless the tool capabilities list them and a rendered audit confirms the output.

For native/query display verification, publish and route the page, then run `imis_rendered_page_audit` with `expectedText` markers for the visible iPart titles, query rows, or summary values. Treat `page.expectedText.missingCount=0` as the reusable rendered-text check; page load alone is not enough.

For a custom bento/grid dashboard:

```
imis_page_builder recipe=dashboard action="create" dashboardName="Client_Ops" dashboardTitle="Client Operations" parentContentPath="@/Shared Content/AgentZ" includeSubpageTabs=true subpageTabsLayoutZone="6" customLayout='{"name":"Client_Ops_Bento","parentPath":"$/Custom/Layouts","reuseExisting":true,"defaultZoneCssClass":"ClientOpsZone","layoutSpec":{"wrapperClass":"client-ops-bento","rows":[{"columns":[{"zone":1,"className":"col-sm-8"},{"zone":2,"className":"col-sm-4"}]},{"columns":[{"zone":3,"className":"col-sm-4"},{"zone":4,"className":"col-sm-4"},{"zone":5,"className":"col-sm-4"}]},{"columns":[{"zone":6,"className":"col-sm-12"}]}]}}' pages='[...]'
```

For query-backed or custom panel-backed pages, plan the cross-surface contract first:

```
imis_iqa action=content_plan goal="<page goal>" sourcesArray=["<BOOrPanelSource>"] requestedFieldsArray=["field ideas"] targetExperience="dashboard"
```

Carry the returned Display aliases, template placeholders, filter prompts, relation hints, and iPart recommendation into the page build.

For `includeSubpageTabs`, the generated Content Collection Organizer is only the tab/organizer surface. Each subpage must carry its own real content and query/chart/template iParts, and the generated shell must not be treated as end-user content. Do not expose raw `ContentDesigner.aspx` links or `@/` document paths as site content.

**List the native iPart types you can place:**

```
imis_page_iparts action="list_types"                      # ~75 registered native types with descriptions
imis_page_iparts action="list_types" ipartSearch="event"  # filter by name/category/description
```

The registry spans commerce checkout iParts, event display, donation creators, contact editors, communication preferences, and more. Place a common type with its typed `place` kind (below); place any other listed type by `capture_contract` on a working example, then `place kind=nativeIpart`.

**Inspect existing iParts:**

```
imis_page_iparts action="inspect" documentId={id}
```

Returns raw ContentItems XML plus parsed iPart summaries, `typeSpecificXml`, and `placeTemplate`. For any non-turnkey iPart, inspect a working page first and reuse `iparts[].placeTemplate` rather than guessing WCF XML.

**Read or change any iPart's configure-dialog settings in place:**

```
imis_page_iparts action="inspect" documentId={id}                              # see typeSpecificElementNames + current values
imis_page_iparts action="update_properties" documentId={id} contentItemKey={key} properties={"ListPageSize":"20","b:CssClass":"my-class"}
```

A native iPart's Configure-dialog settings are scalar elements on the iPart in the page document. `update_properties` reads and patches them by element name (generic name → value map, namespace-agnostic), and verifies the stored value by XML readback. (A custom client iPart keeps its settings as a JSON blob in one `Settings` element — see the custom-iPart settings note above, which is storage-only until a rendered audit.)

**Add HTML content:**

```
imis_page_iparts action="place" kind="html" documentId={id} html="<h2>Welcome</h2><p>Your content here.</p>" title="Welcome" layoutZone="1" sortOrder=1
```

**Add IQA table/search/export results:**

```
imis_page_iparts action="place" kind="queryIpart" queryDisplay="menu" documentId={id} queryPath="$/path/to/query-or-folder" title="Results" rowsPerPage=20 enableExport=true
```

**Add IQA Template tab cards/custom HTML:**

```
imis_page_iparts action="place" kind="queryIpart" queryDisplay="template" documentId={id} queryPath="$/path/to/template-backed-query" title="Cards" rowsPerPage=12
```

Before using Query Template Display, verify every `{#query.Alias}` placeholder matches a Display tab alias.

**Add native IQA display iParts:**

```
imis_page_iparts action="place" kind="queryIpart" queryDisplay="chart" documentId={id} queryPath="$/path/to/grouped-query" chartType="barvertical" labelColumnName="Year" dataColumnName="TotalAmount" title="Giving by year"
imis_page_iparts action="place" kind="progressTracker" documentId={id} listSourceQuery="$/path/to/count-query" title="Progress"
imis_page_iparts action="place" kind="relatedItems" documentId={id} listSourceQuery="$/path/to/related-items-query" title="Related items"
imis_page_iparts action="place" kind="summaryDisplay" documentId={id} queryPath="$/path/to/summary-query" title="Summary"
```

Use these structured kinds for QueryChartViewer, ProgressTracker, RelatedItems, and SummaryDisplay before reaching for a captured typed iPart. ProgressTracker source queries must expose native Display aliases `Sum_Total` and `Goal_Amount`, plus `End_Date` when days remaining is shown; `dataColumnName` is only the optional URL/filter column. RelatedItems source queries must expose the case-sensitive identity alias `key_Id`.

**Add any other registered iPart type after inspecting a working example:**

```
imis_page_iparts action="place" kind="nativeIpart" documentId={id} ipartType="<registered type>" typeElements="<b:...>...</b:...>"
```

`place kind=nativeIpart` inserts by layout zone and sort order because iMIS rendering follows serialized `ContentItems` order in practice. If the visual order matters, set `layoutZone` and `sortOrder` explicitly and inspect after writing. The MCP blocks non-default zone writes when the page has no bound layout; bind/create the layout first instead of forcing the iPart XML.

**Fallback raw XML path:**

```
imis_page_iparts action="place" kind="raw" documentId={id} ipartXml="<a:ContentItem i:type=\"b:QueryMenu\" ...>...</a:ContentItem>"
```

Use raw XML only when the typed helper cannot represent the captured example.

**Remove an iPart:**

```
imis_page_iparts action="remove" documentId={id} contentItemKey={guid}
```

Also available: `imis_document action=content_items` contentKey={documentId} — read-only GET of iPart metadata (simpler but less detail than inspect).

### Step 5: Configure Navigation

Options for making the page accessible:

- Auto-create navigation on publish (checkbox in page properties)
- Manually add to navigation structure
- Navigation link text + breadcrumb name

### Step 6: Publish

```
imis_document action=update documentId={id} status="Published"
```

Treat this as a publish request plus verification, not a guaranteed publish. If the response includes `publishState="user_intervention_required"`, hand off the returned packet for RiSE > Page Builder > Manage content or Page Builder Task list approval. Browser/native staff clicks through AgentZ are an accepted live-ops path when requested, especially for publish/approval flows that iMIS does not expose as clean REST writes. They still need a follow-up API/status verification before the agent says the page is live.

For page-set launches, use `imis_page_builder action=launch_existing` rather than separate ad hoc publish/NAV scripts. Set `nativeWorkflowTimeoutMs` (or `publishTimeoutMs` for older callers) on long native/browser runs; if launch returns `publish_incomplete` or `navigation_incomplete`, rerun launch against the existing content/document IDs and only retry the incomplete phase.

When publishing a page set, track every page independently. If two pages verify and two remain Working, report that exact split and keep the overall result as not fully live.

---

## iPart Reference Guide

`imis_page_iparts action="list_types"` lists all ~75 registered native types (searchable). The categories below describe the commonly-used ones:

### Content iParts

- **ContentHtml**: Static HTML content — WYSIWYG editor for text, images, embedded media
- **ContentTaggedList**: Dynamically display content records matching specific tags — great for news feeds, article lists

### Query & Data iParts

- **QueryMenu**: Display IQA query results with sorting, filtering, export (DOC/XLS/PDF/CSV/XML), and email merge. The most versatile data display iPart
  - Supports horizontal filter display (up to 3 filters per row)
  - Paging styles: Simple, Advanced, NextPrev, Slider, NextPrevAndNumeric
  - Export and address mapping capabilities
- **PanelEditor**: Display and edit panel source data — custom forms tied to business objects
- **Chart iParts**: native QueryChartViewer charts powered by IQA queries. Use the structured `queryIpart queryDisplay=chart` writer for supported chart types `donut`, `bar`, `barvertical`, `barhorizontal`, and `line`; use `barvertical`/`bar` for vertical column charts because persisted `column` is normalized to `barvertical`. Area, pie, funnel, or other strings need capability-guide support plus rendered verification before product claims. Use `imis_iqa action=content_plan` before choosing between QueryMenu, QueryTemplateDisplay, PanelEditor, and chart iParts. It turns live BO/panel metadata into aliases, prompt fields, join hints, and the safest iPart action.

### Commerce iParts

- **ProductDisplay**: Show products from the catalog
- **ShoppingCart**: Shopping cart functionality
- **OrderConfirmation**: Post-purchase confirmation display

### Community iParts

- **Registration**: Member self-service registration form
- **RosterManager**: Display member directories and rosters
- **ProfileDisplay**: Show member profile information

### Event iParts

- **EventDisplay**: List and display events
- **EventRegistrationList**: Show event registrants

### Navigation iParts

- **PrimaryNavigation**: Main site menu with mega-menu support
  - Configuration: level limiting, expand/collapse delays, skin selection
  - Path variables: `[Website]`, `[@]`, `[~]`, `[Root]`, `[Common]`, `[iMIS]`, `[Theme]`
- **SecondaryNavigation**: Sub-level navigation
- **UtilityNavigation**: Header/footer utility links
- **DashboardNavigation**: Staff site dashboard menus

### Utility iParts

- **SocialSharing**: Facebook, X (Twitter), LinkedIn share buttons
- **AlertDisplay**: Display important notifications to users

---

## Navigation Design

### Navigation Types

- **Primary**: Main horizontal menu across the top — supports mega-menus
- **Secondary**: Vertical or sub-level navigation — context-sensitive
- **Utility**: Small links in header/footer (Login, Contact Us, Search)
- **Dashboard**: Staff site internal navigation

### Navigation Structure

Navigation is a separate `~/` sitemap hierarchy of `NAV` documents. Content folders/pages live under `@/` and can be linked from navigation, but creating a `CFL` or `CON` does not automatically create a sidebar/menu item.

When creating a page, you can auto-create a navigation item:

- Navigation link text (what users see in the menu)
- Navigation location (where in the sitemap tree)
- Breadcrumb name (auto-matches navigation link text)

For agentic writes, treat navigation as proven only when `imis_navigation_items` or `imis_page_builder recipe=dashboard` returns a NAV item whose `DocumentSummary.Path` equals the intended `~/...` path and whose `Hierarchy` lookup succeeds. A Working NAV with empty `Path`/`FolderPath` is an API orphan, not a placed menu item; follow the returned `nativeEditorUrl` / Site Builder handoff packet.

### Mega-Menu Configuration

Primary Navigation supports mega-menus — large panels displaying grouped items:

- Group navigation items under parent folders
- Configure expand/collapse delays for hover behavior
- Apply custom CSS skins only as explicit navigation/theme work. Embedded
  generated iParts should use AgentZ design binding and scoped token CSS.

---

## Theme & CSS Guidance

### Theme Architecture

iMIS themes consist of:

- **Theme CSS files**: Colours, fonts, headings, button styles, link styles
- **.skin files**: Control properties for buttons, labels, grids (1-2 files)
- **Required images**: Icons, user messages, UI elements
- **Base stylesheet**: UltraWave (dynamically included by iMIS — never edit)

### Managing Themes via API

```
imis_site_shell action=profile
imis_site_shell lane=themeRecord action=preview_create themeName="Custom Theme" ...
imis_site_shell lane=themeRecord action=create themeName="Custom Theme" ... confirmationText="<exact text from preview>"
imis_site_shell lane=themeRecord action=preview_update themeId={themeId} themeName="Updated Theme" ...
imis_site_shell lane=themeRecord action=update themeId={themeId} themeName="Updated Theme" ... confirmationText="<exact text from preview>"
```

Guarded CRUD is available for the `Themes` metadata record through `imis_site_shell`; the App Theme ZIP/CSS assets, Manage Websites application, publishing, and rendered theme proof are separate lanes.

### Creating a Custom Theme

**Best practice**: Copy an existing theme as your starting point. Building from scratch is harder.

1. Create a custom `.css` file that loads after the default stylesheet
2. Override specific styles (colours, fonts, spacing, etc.)
3. DO NOT rename default `.css` files (requires full re-upload)
4. NEVER edit Quick Start Site themes directly — they're overwritten on upgrade
5. Package: theme CSS + .skin files + images folder → compress into ZIP
6. Upload: RiSE > Theme Builder > Themes (for uploading the ZIP package itself)
7. Apply: Set theme in website Look and Feel settings or via API
8. Test: Use browser developer tools (F12) to inspect and debug

### CSS Best Practices

- Develop toward W3C standards for accessibility (WCAG compliance)
- Test responsive design across screen sizes
- Use AgentZ design tokens for generated embedded artifacts; do not paste or
  replace `design-tokens.css` in iPart/runtime packages
- Scope embedded custom CSS under `.agentz-design` and use `var(--ds-*)` /
  `var(--ifx-*)`
- Keep custom overrides organised and commented
- Mobile-first approach for responsive layouts

---

## Content Management

### Content Lifecycle

Draft → Published → Archived

- **Draft/Working**: Content exists but is not visible to website visitors
- **Published**: Live and visible on the website
- **Archived**: Removed from live site but retained for history

### Version Control

iMIS supports content versioning — you can revert to earlier versions of a page.

### Content Folders

- **Core Content**: System-provided base content (don't modify directly)
- **Quick Start Sites**: Template-based starter content (copy, don't edit originals)
- **Shared Content**: Organisation-wide custom content
- **Custom Folders**: Create your own structure

### Content Properties

- **Title**: Page heading (supports dynamic page title)
- **Publish File Name**: URL-friendly identifier
- **Layout**: Template selection
- **Keywords**: SEO and internal search terms
- **Description**: Meta description for SEO
- **Tags**: Categorisation and inheritance
- **Access Settings**: Security and visibility controls
- **Cache Duration**: Default or custom per page

---

## Troubleshooting

### Page Not Appearing After Publish

- Check publish verification: `imis_document action=update` publish responses include `statusVerification`; otherwise inspect `DocumentSummary.Status` and verify it is "Published"
- If the MCP returned `userInterventionRequired`, the page still needs native iMIS publish/approval
- Sitemap may need rebuilding after navigation changes
- Check access settings — page may be restricted to specific groups
- Check cache duration — cached pages may take time to refresh
- For a fresh client-iPart registration loader error, wait and re-audit first. If it persists and an administrator deliberately chooses a manual system-cache purge, the EMS path is **Settings > About iMIS > Purge System Cache**. This is system-wide and can temporarily reduce performance; do not direct operators to a non-existent RiSE Cache management page or to recycle an application pool.

### iPart Not Displaying Data

- Verify the IQA query powering the iPart is REST-enabled
- Check query parameters and filters
- Verify the content zone placement in the layout

### Navigation Not Showing

- Navigation created from content folders (CFL type)
- Verify the folder has the right parent in the document tree
- Check navigation item visibility settings
