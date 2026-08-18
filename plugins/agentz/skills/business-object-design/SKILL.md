---
name: business-object-design
description: >-
  Design, create, and manage custom Business Objects and Panel Sources in iMIS.
  This skill should be used when the user says "business object", "panel
  source", "custom field", "custom data", "BO designer", "panel designer",
  "create a panel", "custom table", "extend the data model", "add a field",
  "panel source properties", "expression builder", "calculated field",
  "custom demographics", "multi-instance data", or when working with iMIS
  data model extensions.
argument-hint: "[action: design|create|list|inspect|data]"
---

# Business Object & Panel Source Design

Design, create, and manage custom Business Objects (BOs) and Panel Sources in iMIS — the mechanism for extending the iMIS data model with custom fields and tables.

**Build over MCP, not the UI.** BO/Panel **schema** creation is a proven MCP capability (see _Creating via MCP_ below) — prefer it over manual iMIS UI steps. The iMIS UI remains the path for visual/rendered panel design and anything not yet exposed over MCP.

**Documentation resource**: Use the `imis-docs` connector for official iMIS help articles (property types, expression builder syntax, panel designer workflows) and the `imis-docs-dev` connector for BO data contracts, panel source API endpoints, and field definitions.

## Key Concepts

- **Business Object (BO)**: A data model definition (schema) used by IQA, API, and iParts. Standard BOs ship with iMIS; custom BOs use `My_` prefix
- **Panel Source**: A custom data table tied to a parent type (Contact, Event, Invoice, or Standalone). Creating a Panel Source auto-generates a BO
- **Panel**: A UI layout (form/grid) that displays and edits Panel Source data
- **Rule of thumb**: Panel Source = data storage, Panel = form/layout, Business Object = schema definition
- **BO/Panel Source vs `imis_udf_design`**: use a Business Object / Panel Source for reportable custom tables or multi-field demographics; use `imis_udf_design` for a single RiSE UDF string on a CON (content record) — not for structured multi-field custom data

### Single-Instance vs Multi-Instance

- **Single-instance**: One record per parent (e.g., custom demographics for a contact). The record is created automatically
- **Multi-instance**: Multiple records per parent (e.g., certifications, employment history, education). Each record has an Ordinal
- **Cannot change** after creation — choose carefully during design

---

## Creating via MCP (preferred over the UI)

Choose the Business Object authoring lane **before** designing the fields. AgentZ exposes two underlying iMIS writers plus one governed composition action through `imis_business_object_design`:

- **Generated Panel Source** (`sourceMode` omitted or `generatedTable`) — `preview_create` / `create` writes a `BOEntityDefinition`. It provisions a new Single/Multi source and its physical SQL table in one call, so there is no separate deploy/publish step. This lane creates persisted fields; it does **not** author Expression Builder custom properties. Do not send `customExpression` or `expressionJson` through this lane, and do not treat an accepted `BOEntityDefinition` POST/PUT as expression proof because iMIS can silently drop unsupported property mutations.
- **Native Business Object Designer** (`sourceMode: "nativeDesigner"`) — `preview_native_bod` / `create_native_bod` writes a BOD authoring Document, embeds Expression Builder `CustomPropertyExpression` JSON, publishes it through native BOA, and verifies `BOEntityDefinition`, `metadata`, expected fields, and bounded query readback. Its root table/view must already be selectable in Business Object Designer; this lane does not create the underlying database source.

If the requirement combines a brand-new custom table and calculated fields, prefer `preview_generated_table_with_overlay` followed by `create_generated_table_with_overlay`. Pass the generated Single/Multi Party design as `designObject` and a **separately named, read-only Standard native BOD** as `overlayDesignObject`. The preview proves both runtime names and the overlay document path are absent, validates that every persisted/expression reference belongs to the generated table, and returns an exact confirmation bound to the tenant and normalized design. Execution creates and field-verifies the generated table first, then publishes the Standard overlay through native BOA and requires overlay definition, metadata, fields, and query readback. If the second stage fails, it reports the retained physical table and saved overlay state; it never silently drops the table.

This is one governed AgentZ operation over two iMIS definitions. The Standard BO is the expression-capable IQA/reporting source; the generated Single/Multi source remains the writable Panel Designer source.

Do not claim those two definitions are one Panel Source or try to reuse the generated source name. BOA can display an expression injected into a generated Single/Multi BOD but refuses deployment, and a clean Standard BOD cannot replace the existing Single/Multi runtime object under the same name. Use distinct names, or explain that an exact same-name writable Panel Source plus Expression Builder field is not an iMIS-supported shape. This is an object-type/ownership boundary, not a limitation in AgentZ's Expression Builder authoring.

Three tools form the custom-data triad:

- **Source** = `imis_business_object_design` — writes either the generated Panel Source or the native BOD definition, using the matching action family above.
- **Layout** = `imis_panel_definition` — writes the `PanelDefinition` (Groups → Columns → Fields over a BO). Supports server-side `_validate`; create returns a server-assigned `PanelDefinitionId`.
- **Data** = `imis_panel_records` — row CRUD (GenericEntityData envelope).

### Source lifecycle (guarded: preview → create → prove)

```
imis_business_object_design action=surface
imis_business_object_design action=list_business_objects
imis_business_object_design action=preview_create designObject=<BoDesign>          # safe dry run, returns confirmationText
imis_business_object_design action=create         designObject=<BoDesign> confirmationText="<exact text from preview>"
imis_business_object_design action=prove          designObject=<BoDesign> testPartyId="<real party id>" confirmationText="PROVE BUSINESS OBJECT My_Source"   # round-trips create→readback→table-queryable→row CRUD

# Preferred new-table + calculated-properties composition
imis_business_object_design action=preview_generated_table_with_overlay designObject=<generated Party Single/Multi design> overlayDesignObject=<distinct read-only Standard BOD rooted on generated name>
imis_business_object_design action=create_generated_table_with_overlay  designObject=<same generated design> overlayDesignObject=<same overlay design> confirmationText="<exact tenant/plan-bound text from preview>"
```

- **Single-instance Party** BOs support the complete `action=prove` lifecycle. Multi-instance Party definition plus row create/readback works through `imis_panel_records` (composite id `~ContactKey|Ordinal`), but the one-call prove/update/delete cleanup loop remains Single-only. Non-Party parents (Standalone/Event/Invoice) remain mapped but unpromoted.
- **Cardinality and parent type are immutable** after creation; `update` is additive (never drop columns holding data).

### Native BOD expression lifecycle (guarded: preview -> create/publish -> verify)

```text
imis_business_object_design action=preview_native_bod designObject={
  "name": "My_GiftSummary",
  "sourceMode": "nativeDesigner",
  "nativeSource": {
    "rootTable": "vGiftSummary",
    "whereText": "vGiftSummary.Gift > 0",
    "isReadOnly": true
  },
  "fields": [
    {
      "name": "GiftAmount",
      "type": "decimal",
      "sourceTable": "vGiftSummary",
      "sourceColumn": "Gift"
    },
    {
      "name": "GiftDate",
      "type": "date",
      "customExpression": {
        "kind": "function",
        "function": "dateOnly",
        "dbType": 31,
        "parameters": [
          {
            "kind": "property",
            "table": "vGiftSummary",
            "column": "TransactionDate",
            "dbType": 4
          }
        ]
      }
    }
  ]
}

imis_business_object_design action=create_native_bod designObject=<same object> confirmationText="<exact text from preview>"
imis_business_object_design action=verify_native_bod name="My_GiftSummary"
```

To update an existing native BOD, run `action=preview_update name="My_GiftSummary" designObject=<full replacement design>` and then execute `action=create_native_bod replaceExisting=true designObject=<same object>` with the exact `UPDATE NATIVE BOD My_GiftSummary` token returned by the preview. The create token is deliberately rejected for replacement writes.

Creation is complete only when native BOA publish succeeds and the returned field/query verification passes. A BOA HTTP 500 is an operation failure to diagnose (source selectability, document shape, action family, or tenant permissions), not evidence that AgentZ lacks Expression Builder authoring.

For generated-table overlays, prove the complete chain: write a row through the original generated source, query it through the distinct Standard BOD and a runtime-proven IQD, and verify the calculated value. That is an execution-context mismatch, not an Expression Builder authoring limitation.

### Layout lifecycle

```
imis_panel_definition action=list_panels
imis_panel_definition action=preview_create designObject=<PanelLayoutDesign over the BO>   # returns confirmationText
imis_panel_definition action=create         designObject=<PanelLayoutDesign> confirmationText="<exact text from preview>"
```

### Place the panel on a RiSE page

```
imis_page_iparts action=place kind=panel panelDefinitionId="<from imis_panel_definition>"
```

This places a `PanelEditorCommon` iPart bound to the `PanelDefinitionId`. Full custom-data loop: **BO (source) → PanelDefinition (layout) → place kind=panel → publish**. Only rendered-UI proof after publish remains a companion render-audit step.

The Panel Designer **UI steps below** remain valid for visual/rendered design or capabilities not yet exposed over MCP.

---

## Discovering Existing BOs and Panel Sources

### List All Business Objects

```
imis_business_object_design action=list_business_objects     # preferred
imis_entity action=list entityType=BOEntityDefinition limit=100   # raw alternative
```

Returns all BO definitions including custom ones. Look for `My_` prefix for custom BOs.

### Get BO Field Details

```
imis_entity_discover action=schema entityType={entityName}
imis_iqa action=source_profile source="{entityName}" requestedFieldsArray=["business field ideas"]
imis_iqa action=content_plan goal="<page or report goal>" sourcesArray=["{entityName}"] targetExperience="dashboard"  # one of: table, cards, detail, dashboard, chart, form, navigation, export, automation
```

Returns all properties (fields) with data types, required flags, descriptions, likely custom fields, IQA display/filter candidates, and content/iPart implications.

### List Panel Definitions

```
imis_panel_definition action=list_panels                     # preferred
imis_entity action=list entityType=PanelDefinition limit=100     # raw alternative
```

Shows all panel definitions — both system and custom.

### Inspect Panel Source Data

```
imis_panel_records panelSource={name} action="list_records" partyId={partyId}
```

View existing data for a specific contact's panel source records.

---

## Creating a Panel Source (Custom Data Table)

### Design Checklist

Before creating, determine:

1. **Purpose**: What data are you storing? (e.g., certifications, custom preferences, tracking data)
2. **Parent type**: Contact (most common), Event, Invoice, or Standalone
3. **Cardinality**: Single-instance (one per parent) or multi-instance (many per parent)
4. **Fields**: Name, data type, required, default values, IQA availability
5. **Naming**: Use organisation prefix to avoid conflicts (e.g., `ABC_Certifications`)

### Creation Steps (native UI fallback — prefer the MCP triad above)

Prefer MCP `action=create` for schema + table creation. These native UI steps are a fallback for visual/rendered design or capabilities not yet exposed over MCP.

1. Navigate to **RiSE > Panel Designer > Panel Sources > Add new**
2. Set the **Name**: starts with a letter, only letters/numbers/underscores
3. Select **Parent type**: Contact, Event, Invoice, or Standalone
4. Choose **Single-instance** or **Multi-instance**
5. Add properties (fields) — see Property Types below
6. Save and **Publish**
7. Verify via API:

```
imis_entity action=list entityType=BOEntityDefinition limit=100
```

Look for your new BO in the list.

### Auto-Generated Fields

Every Panel Source automatically includes:

- **ID**: Unique identifier (GUID)
- **Ordinal**: Sequence number (multi-instance only)
- **CreatedOn**: Creation timestamp
- **UpdatedOn**: Last modified timestamp
- **CreatedBy / UpdatedBy**: User who created/modified the record

---

## Panel Source Property Types

| Type     | Description    | Use For                       |
| -------- | -------------- | ----------------------------- |
| String   | Text field     | Names, descriptions, codes    |
| Integer  | Whole number   | Counts, years, quantities     |
| Numeric  | Decimal number | Amounts, percentages, scores  |
| DateTime | Date and time  | Dates, deadlines, timestamps  |
| Boolean  | True/false     | Flags, toggles, yes/no fields |

### Property Settings

- **Required**: Enforces NOT NULL — use for essential fields only
- **Length/Scale**: For String (max chars) and Numeric (precision/scale)
- **Default Value**: Pre-populated value for new records
- **Foreign Key**: Reference to another BO (creates relationship)
- **Read-only**: System-managed fields users cannot edit
- **Available in IQA**: Must be enabled for the field to appear in IQA queries
- **Values**: Freeform (any input), Query Object (dropdown from BO), or Value List (fixed options)

### Value Lists

For fields with fixed options (e.g., Status = Active/Inactive/Pending):

- Create via **Settings > General Lookup/Validation Tables** — use `imis_lookup_configuration` for General Lookup Table (GenTable) value CRUD. This skill designs the BO property that _references_ the list; the list values themselves are owned by `imis_lookup_configuration`.
- Reference in property definition as Value List type
- Users see a dropdown in the Panel UI

---

## Working with Panel Source Data via API

### List Records

```
imis_panel_records panelSource={name} action="list_records" partyId={partyId}
```

Returns all records for a contact. For multi-instance, returns array of records.

### Get Single Record

```
imis_panel_records panelSource={name} action="get_record" recordId={recordId}
```

### Create Record (gated)

```
imis_panel_records panelSource={name} action="preview_create_record" partyId={partyId} recordObject={"FieldName":"value","AnotherField":123}
imis_panel_records panelSource={name} action="create_record" partyId={partyId} recordObject={"FieldName":"value","AnotherField":123} confirmationText="<exact text from preview>"
```

For single-instance sources, this creates (or updates if it already exists) the one record.
For multi-instance, this adds a new record.

### Update Record (gated)

```
imis_panel_records panelSource={name} action="preview_update_record" recordId={recordId} recordObject={"FieldName":"new value"}
imis_panel_records panelSource={name} action="update_record" recordId={recordId} recordObject={"FieldName":"new value"} confirmationText="<exact text from preview>"
```

### Data Patterns

- **Single-instance** (e.g., custom demographics): One record per contact — create once, update thereafter
- **Multi-instance** (e.g., certifications): Multiple records — create new entries, update/delete individual records
- **Standalone** (e.g., lookup tables): Not tied to a specific contact — independent data storage

---

## Expression Builder (Calculated Fields)

Calculated fields derive values from other properties. AgentZ authors them programmatically through the **native BOD expression lifecycle above**; they are not generated Panel Source fields and do not belong in `preview_create` / `create` payloads.

The structured `customExpression` mapper currently covers property, constant, today, function, calculation, condition, and if/then/else nodes. Named function/operator support is intentionally conservative; `expressionJson` is available for a captured, proven native expression shape. The function lists below describe iMIS Expression Builder concepts, not a promise that every function name can be supplied directly to the structured mapper. Always use `preview_native_bod`, then require publish plus metadata/field/query readback.

### Expression Types

- **Calculation**: Mathematical expressions (`Price * Quantity`)
- **Constant**: Fixed value (e.g., `"Active"`, `100`)
- **If Then Else**: Conditional logic (`IF PaidThrough > Today THEN "Active" ELSE "Lapsed"`)
- **Property**: Reference another property's value
- **Today**: Current date/time

### String Functions

| Function  | Example                      | Result    |
| --------- | ---------------------------- | --------- |
| Trim      | `Trim(" hello ")`            | `"hello"` |
| Lower     | `Lower("HELLO")`             | `"hello"` |
| Upper     | `Upper("hello")`             | `"HELLO"` |
| Length    | `Length("hello")`            | `5`       |
| Left      | `Left("hello", 3)`           | `"hel"`   |
| Right     | `Right("hello", 3)`          | `"llo"`   |
| Replace   | `Replace("hello", "l", "r")` | `"herro"` |
| Substring | `Substring("hello", 1, 3)`   | `"ell"`   |

### Numeric Functions

| Function | Description                   |
| -------- | ----------------------------- |
| Round    | Round to N decimal places     |
| Floor    | Round down to nearest integer |
| Ceiling  | Round up to nearest integer   |
| Absolute | Absolute value                |

### Date Functions

| Function           | Description                                 |
| ------------------ | ------------------------------------------- |
| DateOnly           | Extract date part (no time)                 |
| TimeOnly           | Extract time part                           |
| Day / Month / Year | Extract component                           |
| EndOfMonth         | Last day of the month                       |
| DatePart           | Extract specific part (quarter, week, etc.) |

---

## Designing Panels (UI Forms)

Panels define how users interact with Panel Source data in the iMIS UI.

### Panel Types

- **Form Panel**: Standard data entry form — fields with labels, validation
- **Grid Panel**: Tabular display for multi-instance data — rows and columns
- **Mixed**: Form at top + grid below (common for single-instance header + multi-instance detail)

### Panel Design Workflow

1. **Navigate to**: RiSE > Panel Designer
2. **Select Panel Source**: Choose which data table to build a form for
3. **Drag fields**: Add properties to the layout
4. **Configure each field**: Label, width, required indicator, help text
5. **Set layout**: Column arrangement, section grouping, tab organisation
6. **Add to page**: Use PanelEditor iPart on a RiSE page to display the panel

### Panel on a RiSE Page

To display a panel on a website page:

1. Use `imis_iqa action=content_plan` to decide whether the page needs a read-only query display, card template, editable PanelEditor, or mixed layout.
2. Create or edit a content record in a peripheral workspace (see `rise-website-design` skill).
3. For read-only lists/cards, bind the generated or existing IQD with Query Menu or Query Template Display.
4. For editable panel data, place a **PanelEditor** iPart with `imis_page_iparts action="place" kind="panel"` bound to the PanelDefinitionId from `imis_panel_definition`.
5. Publish only when requested and browser/editor verification is available.

### Adding a Tab to the Contact / Staff Record

Contact/staff-record tabs are a `DynamicContentCollectionOrganizer` over a CON content folder — add a Party-scoped panel/BO via `imis_page_iparts` (PanelEditor) in the contact-record folder. There is no single "add tab" tool; compose from panel + content-folder placement.

---

## Best Practices

1. **Always use organisation prefix**: `My_OrgName_` avoids name collisions with system BOs and other customisations
2. **Design for IQA**: Enable "Available in IQA" on properties that need reporting
3. **Choose cardinality carefully**: Single vs multi-instance cannot be changed after creation
4. **Keep panel sources focused**: One concept per source (don't combine certifications and preferences in one table)
5. **Use meaningful names**: `ABC_Certifications` not `ABC_Data1`
6. **Test via API first**: Use `imis_panel_records` to verify data before building UI panels
7. **Document field purposes**: Use the Description field in property definitions
8. **Consider performance**: Indexed fields (foreign keys, frequently filtered fields) perform better in IQA queries
9. **Plan relationships**: If multiple panel sources relate to each other, use foreign key properties to link them
10. **Version control**: Document your panel source designs externally — iMIS doesn't version custom BO definitions
