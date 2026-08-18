# Forms Authoring — Elements, Design Contract, Diff, and Governed Writes

Element/field contracts for the normalized writer, new-source composition, and the diff/validate/create/update/deactivate/delete lifecycle. Loaded from the forms skill router; the two-call confirmation and readback rules in SKILL.md always apply.

### Step 3 — Element Library: Map fields to writer support

Before building forms that use contact fields, panel fields, multi-layouts, uploads, selectors, or tenant-specific controls:

```
imis_form_element_library includePanelMetadata=true panelSourceNames=["MyCustomBO"]
```

`imis_form_element_library` maps the native Form Builder element library against live tenant usage and writer support. Returns usage recipes and readback requirements for contact fields, address/activity sources, custom panel fields, multi-instance settings, signup/account controls, document uploads, custom HTML, normalized Misc/CAPTCHA, and tenant-specific selectors.

Use the returned support state, boundary, and recommended route as the current operating contract. If an element or behavior is not writable through the normalized contract, follow the returned native-capture or alternative-surface route; never approximate or silently omit it. Use the AgentZ companion’s authenticated iMIS session for native editor and rendered-runtime checks, and use the isolated audience partition required by the route rather than a Staff-cookie session.

Prefer each tool's structured `*Object`/`*Array` input over its JSON-string compatibility alias when chaining AgentZ calls. Supply only one form of a paired input; the tool rejects ambiguous duplicate representations. The same rule applies inside normalized designs: choose one canonical representation for display/contact/duplicate settings, element identity (`key`/`elementKey`/`name`), field identity (`value`/`field`/`sourceField`/`path`), lookup width, rule description, rule-action target, and rule-action value. Identical aliases are redundant; conflicting aliases are rejected before serialization. Forms tools return protocol `structuredContent` as well as text compatibility output, so pass returned evidence packets directly rather than re-parsing prose.

For normalized native controls, use the companion-proven contracts instead of captured fragments when the source path is known:

- Set `source` to `contact`, `address`, `activity`, `panel`, or `user`; the writer emits `ccontact`, `caddress`, `activity`, `panelsource`, or `userfield` respectively.
- Use `labelLocation: "Left" | "Top" | "None"`; `Right` is native only for Boolean controls. Text widths accept `None` or the exact `InputXXSmall` through `InputXXLarge` vocabulary (friendly `extra-small`-style aliases normalize to those values).
- Use `type: "integer"`, `"decimal"`/`"number"` (optionally `chartype: "DecimalN"`), `"currency"`, `"date"`, `"datetime"`, `"time"`, or `"url"`. `default`, `minimum`, `maximum`, and `decimals` map to native attributes where applicable. The compatibility `type: "field"` lane is limited to canonical scalar String/Email/URL, numeric/currency, and date/time chartypes; use the explicit Boolean, Lookup, Binary, Signup, or Multi Layout type for those specialized controls.
- Native Text, Email, and URL fields own `rows` (`2..10`), `multiline`, and `displayCounter`. String/long-text fields additionally own `counterBelow`, minimum/maximum length, and panel-source `enableHtmlEditor`/`richText`. Enabling the HTML editor implies multiline; the current native Designer makes the character counter and HTML editor mutually exclusive, so requesting both fails closed.
- Use `readOnly: true` for an operator-selected read-only field. `fieldState: "locked"` is the exact native compatibility spelling; do not supply `editable` or `read-only`. A field cannot be both required and read-only.
- Use `type: "rich-text"` for reviewed non-executable instruction/markup blocks and `type: "header"` with levels `1..9`. The bounded sanitizer rejects scripts, event handlers, active URLs, nested forms, and unsafe embeds; use exact Advanced-mode preservation only when the intended native content genuinely falls outside that safe contract.
- Boolean controls accept `loadAs: "imis-value" | "checked" | "unchecked"` (aliases `defaultValueCb`/`default`). Contact and Address fields accept `useForDuplicateCheck: true`, serialized as native `fb_duplicate="true"`; it is rejected on other or read-only fields, including Binary/upload controls.
- Native defaults are scalar strings, finite numbers, or Booleans and every accepted value is serialized. Objects, arrays, `null`, and non-finite numbers are invalid rather than silently omitted. Field properties are control-specific: checkbox load aliases belong only to Boolean controls, preferred-address metadata belongs only to `type: "preferred-address"`, and upload settings belong only to Binary/upload controls.
- Numeric/currency decimal places are native integers `0..9` (`0` means All). Regex plus `regexMessage` is supported for text, email, URL, integer, decimal/number, currency, Date, DateTime, and Time fields. Date values use `yyyy-MM-dd`, date-time `yyyy-MM-dd hh:mm tt`, time `hh:mm tt`, or `@Now` where a default/bound accepts the current instant.
- Binary/upload controls use the native `required` and `read_only` attributes, not ordinary `fb_val`; `maxDocSize` is an integer from `0..2000` MB and defaults to the native 4 MB value, while `allowDelete=true` emits `docdelete`.
- Use `type: "captcha"` for the exact native Misc/Captcha control. This owns authoring; blocked/allowed rendered submits are still required before claiming anti-spam enforcement.
- Signup `username`, `password`, and `confirm-password` controls always use the native UserFields binding. Omit `source` or set it to `user`/`userfield`; Contact, Address, Activity, and Panel sources are invalid for Signup controls rather than silently rewritten.
- Use `type: "preferred-address"` with `addressPurpose` and `preference: "mail" | "bill" | "ship"`. It is always a native Address binding: omit `source` or set it to `address`/`caddress`; Contact, Activity, Panel, and User sources are invalid. Each preference offered must appear across at least two address purposes; a lone choice is invalid, not a capture fallback.
- A placed `type: "milayout"`/`"multi-layout"` control accepts its exact layout `value` plus optional `label`, `labelLocation`, and `cssClass`. Do not attach field `source`, default, validation, multi-instance, lookup, or upload properties: configure the reusable definition through `imis_form_administration multi_layout_*`, then place its exact returned identity.
- Drop-downs, radio/option lists, and multi-selects are ALL the lookup family: there is no `dropdown`/`select`/`radio`/`multiselect` authoring type. Use `type: "lookup"` with `selector` — `multiSelect` and `repeatDirection`/`columns` cover multi-select and option-button layouts. Supplying a synonym type name fails closed with this route quoted back.
- Use `type: "lookup"` with `selector: { mode: "default" | "table" | "iqa" | "text" }`. Table mode requires `validationTable`; IQA mode requires the exact `$/...` `iqaPath` and an unprompted IQA with exactly one Display alias `Code` and one Display alias `Description`. `Code` is the persisted value and must be compatible with the target field. Optional native settings are `freeTextSearch`, `allowOther`, `sort: "code-asc" | "code-desc" | "description-asc" | "description-desc"`, `multiSelect`, `repeatDirection: "horizontal" | "vertical"`, `columns: 1..9`, and text-mode `width: "InputXXSmall" ... "InputXXLarge"`. For an eligible Activity dropdown, set `source: "activity"` and optionally `selector.autoUpdate: true`; Activity Note/Follow-up remain multiline textboxes and must not be represented as lookups. Inline option arrays, opaque query keys, and custom value/display columns are not the native persisted contract and remain capture-first.
- Multi-instance controls accept only `blank/new`, `blank/last`, `last/last`, `last/new`, or matching `where Field=Value` read/write clauses. File uploads cannot be multi-instance.
- Use `type: "submit"`, `"save"`, `"cancel"`, or `"link"`/`"hyperlink"`. Optional native redirect fields are `redirectKind`, `redirectTarget`, `parameters`, `newWindow`, and `redirectTable`. Only Submit may carry `processName`, `processTable`/`processOrdinalSource`, and `processContractFingerprint`; copy the exact normalized patch returned by `imis_form_post_processing`. Button labels cannot contain periods.
- For Company Administrator Forms, establish authority with `imis_party_relationships preview_add_organization_administrator` then `add_organization_administrator`; do not substitute a raw GroupMember role write. For represented-contact edits, pass the exact organisation relationship group and URL `ID` target to `imis_form_runtime_submit`, then require authoritative target readback. Chapter Administrator edits likewise require the exact chapter group, active administrator/member roles, the applicable chapter-roster setting, and signed-in runtime readback. URL `ID` selects the form target but does not itself change the logged-in or selected Party identity.
- Put normalized Form Rules in `rules`. The canonical shape is `{ conditions: [{ field, operator, value? }], actions: [{ target, action, value? }] }`; the convenience shape supports `when` plus `show`, `hide`, `require`, `optional`, `readOnly`, `setDefault`, `set`, and `setFromUrl`.
- Canonical operators are `equals`, `greater than`, `less than`, `greater than or equal`, `less than or equal`, `not equal`, `contains`, `does not contain`, `is one of`, `is not one of`, `is empty`, `is not empty`, `is true`, `is false`, `is visible`, and `is not visible`. Text supports the text/comparison/empty/visibility set; numeric supports comparisons and visibility; date/time adds empty/not-empty; Lookup supports equals/not-equal, one-of/not-one-of, empty/not-empty, and visibility; Boolean uses true/false; visual, document, and button controls are visibility-only.
- Canonical actions are `show`, `hide`, `set required`, `set not required`, `set read only`, `set default value`, `set value`, and `set value from URL`. Every field type supports show/hide. Text additionally supports all field-state/value actions; numeric supports required/not-required/read-only, set value, and set value from URL; date/time, Lookup, and Boolean support required/not-required/read-only, set default value, and set value. Rule values are strings, finite numbers, Booleans, or non-empty arrays of those scalars.
- Conditions inside one native rule are always `AND`; express `OR` as separate rule objects. The compiler enforces the documented operator/action matrix for each target type and binds field paths or unique `key`/`elementKey` values to companion-proven native ids. Exact-native `RuleID`/`ActionSets`, opaque rule strings, and executable `rulesScript` remain capture-first.
- Account for native inverse defaults: `Show Element` is hidden until true, `Hide Element` is shown until true, `Set Required` is optional until true, and `Set Not Required` is required until true. When several rules affect the same action/element, the last rule controls its default posture.
- Treat `CreatedByUserKey`, `UpdatedByUserKey`, `CreatedOn`, and `UpdatedOn` as read-only on every form regardless of source. An explicit request to make any of them writable must fail before validation/save.

If these native invariants are violated, expect `blocked_invalid_contract` before validation or writing. Correct the normalized design. A captured control is legal only as an explicit `type: "native-fragment"` containing exactly one structurally valid, non-executable native control; known types cannot carry fragment overrides. Multi-control, executable, or Advanced-mode graphs belong in one complete reviewed `htmlCode` or `formDesignerObject` lane.

When a Form needs a new Contact-parent source, compose the existing owners in this order; do not invent a Forms-specific schema writer:

```text
# Physical fields only
imis_business_object_design action="preview_create" designObject={<complete Single or Multi physical-table design>}
imis_business_object_design action="create" designObject={<same design>} confirmationText="<exact preview confirmation>"

# Physical fields plus calculated properties
imis_business_object_design action="preview_generated_table_with_overlay" designObject={<complete generated Single or Multi physical-table design>} overlayDesignObject={<distinctly named read-only Standard BOD rooted on the generated table, including calculated expressions>}
imis_business_object_design action="create_generated_table_with_overlay" designObject={<same generated design>} overlayDesignObject={<same distinct overlay design>} confirmationText="<exact preview confirmation>"

imis_panel_definition action="preview_create" designObject={<Contact-parent panel design over that BO>}
imis_panel_definition action="create" designObject={<same design>} confirmationText="<exact preview confirmation>"
imis_form_element_library includePanelMetadata=true panelSourceNames=["<created panel source>"]
imis_form_builder_write action="validate" simpleFormObject={<fields using source=panel and value="<panel source>.<field>">}
```

The BO and Panel Definition owners must prove their own create/readback contracts before Forms can consume the source. For a new physical table plus calculated properties, iMIS requires two native objects inside one governed composite workflow: `designObject` is the writable generated Single/Multi Party table, while `overlayDesignObject` is a **different-name, read-only Standard BOD** rooted on that table. The generated source remains the writable Panel Designer/Form source; the overlay is the calculated/IQA source. Do not put expressions into the generated design, reuse the generated name for the overlay, or report that AgentZ cannot create the combination.

### Step 4 — Diff: Compare before editing an existing form

Run a diff before updating a form that has response history:

```
imis_form_builder_diff formDesignerLibraryId="<id>" desiredFormDesignObject={...}
```

`imis_form_builder_diff` compares the current native Form Builder payload with a normalized `formDesignObject` or full `FormDesignerLibrary` payload. For an identified tenant form it reads the authoritative submission count and complete Forms-placement state, then issues an expiring single-use confirmation bound to tenant, form identity/version, current-state hash, desired-payload hash, response history, and placement hash. It produces element-support boundaries, destructive-history risk, and rollback readiness without mutating the tenant. Snapshot-only diffs do not issue an update token.

For the REST FormDefinition lane:

```
imis_form_definition_diff formId="<FormDefinitionId>" desiredDefinitionObject={...}
```

`imis_form_definition_diff` flags visible field additions/removals/type/required/writeback changes, response-history risk, notification/approval/spam changes. A saved FormDefinition shell is not a native Form Builder form; use the diff and rollback/response-history checks before changing an existing shell and keep launch claims in the FormDesignerLibrary lane.

### Step 5 — Build / Write: Author the form

**Native Form Builder lane** (`imis_form_builder_write` — the primary authoring surface):

Actions: `validate`, `create`, `update`, `deactivate`, `delete`, `get`

```
# Step 5a — validate only
imis_form_builder_write action="validate" simpleFormObject={...}

# Step 5b — request the state-bound create plan; this performs no write
imis_form_builder_write action="create" simpleFormObject={...}

# Step 5c — repeat the unchanged create with the exact returned confirmation
imis_form_builder_write action="create" simpleFormObject={...} confirmationText="<exact text from create plan>"

# Step 5d — update an existing form with the exact single-use token from Step 4
imis_form_builder_write action="update" formDesignerLibraryId="<id>" formDesignObject={...} confirmationText="<exact state-bound text from imis_form_builder_diff>"

# Step 5e — plan, then deactivate or delete through the governed lifecycle
imis_form_builder_write action="deactivate" formDesignerLibraryId="<id>"
imis_form_builder_write action="deactivate" formDesignerLibraryId="<id>" confirmationText="<exact mutationPlan text>"
```

Input options (prefer these over raw `htmlCode`):

- `simpleFormObject` — simple sections/elements spec converted to native FormHtmlCode (`simpleFormJson` is the compatibility alias)
- `formDesignObject` — normalized MCP-owned design with fields, sections, validation, source/writeback hints, display settings, and bounded conditional rules; unknown/unsupported controls, empty designs, and invalid/exact-native rule inputs fail closed
- `formDesignerObject` — full native FormDesignerLibrary payload for cloning/preserving exact FormHtmlCode, FormRules, messages, and native metadata together
- `messagesObject` — native messages where the contract is known
- `rulesObject`/`rulesJson` — compatibility inputs only; non-empty standalone rules are blocked because their element ids/contracts may not match. Put captured FormRules in the matching full `formDesignerObject` payload.
- `formStatus`: `A` (active), `D` (draft), `I` (inactive) — use `D`/`I` until launch checks pass

For each validate/create call, supply exactly one base authoring lane: `simpleFormObject`, `formDesignObject`, `formDesignerObject`, or exact Advanced-mode `htmlCode`. An update may omit a base lane for a metadata-only change, but it may never combine lanes. In particular, do not add raw `htmlCode` beside normalized rules: the raw HTML would describe a different control graph from the generated rule bindings, so AgentZ rejects the request before native validation.

The normalized writer's proven chartype, property, Lookup-selector, and Form Rules matrices are intentionally finite. Radio/inline-option controls, hidden inputs, opaque IQA keys or custom selector-column mappings, executable/unsafe markup, exact-native/unsupported Form Rules, and unknown controls must be captured/configured natively or routed to an alternative. Headers, bounded rich instruction blocks, multiline text, character counters, the panel-source HTML editor, CAPTCHA, and exact validation-table/IQA document-path Lookup selectors are normalized writer-owned. AgentZ must never let an unknown type fall through to a String field, guess a rule binding, silently accept an unused property, or turn an empty design into a placeholder form.

Verify: after create/update, call `imis_form_builder_write action="get"` on the returned `formDesignerLibraryId`. A write is usable only when the complete persisted authoring payload matches: `FormHtmlCode`, `FormRules`, `FormRulesScript`, `FormMessages`, name/description, status, and form/designer type codes. Matching element ids while an attribute, expression, rule, script, or message disappeared is an incomplete write, not success.

For an Advanced-form HTML update, saved readback is not rendered proof. Audit the actual route with `imis_form_runtime_submit action="audit"` and the intended `routeAudience`/`submissionActor`, then pass its rendered audit object with the exact `routeUrl`, audience, and actor to `imis_form_route_verify check="rendered"`. A `formDesignerLibraryId` by itself is never rendered evidence.

Every create/update/deactivate/delete writes a durable hash-bound pre-write snapshot or verified-absence record before mutation. Direct writes, predictable confirmation text, stale state, changed payload, changed response/placement state, name collision, or token reuse are rejected. A failed post-write parity check automatically removes a partial create, restores the exact captured payload, or retains the created form inactive when physical removal is unavailable. Destructive field/type/source changes with submissions require `acceptResponseHistoryRisk=true` against the same live update plan.

**REST FormDefinition lane** (`imis_form_definition_write` — controlled shell/response lane only):

Actions: `validate`, `create`, `update`, `delete`, `changelog`

```
imis_form_definition_write action="validate" definitionObject={...}
imis_form_definition_write action="create" definitionObject={...}
imis_form_definition_write action="create" definitionObject={...} confirmationText="<exact state-bound create confirmation>"
imis_form_definition_write action="update" formId="<FormDefinitionId>" definitionObject={...}
imis_form_definition_write action="update" formId="<FormDefinitionId>" definitionObject={...} confirmationText="<exact state-bound update confirmation>"
imis_form_definition_write action="changelog" formId="<FormDefinitionId>"
imis_form_definition_write action="delete" formId="<scratch FormDefinitionId>"
imis_form_definition_write action="delete" formId="<scratch FormDefinitionId>" confirmationText="<exact state-bound delete confirmation>"
```

REST-created definitions can save as top-level shells without native Form Builder sections/field index. AgentZ requires every caller-supplied definition path—not only section/field counts—to survive authoritative readback; a changed description, status, rule, section, field property, or ordering is a failed write. It removes an incomplete create and verifies absence, or restores the complete pre-write definition after update mismatch. Update/delete plans bind the full authoritative definition and complete response history; delete is blocked while any FormResponse exists because the response identities and downstream effects cannot be restored losslessly.
