---
name: data-explorer
description: >-
  Discover and explore what data exists in the iMIS instance. This skill should
  be used when the user says "what entities are available", "show me the schema",
  "what custom fields exist", "explore the data model", "what panels are there",
  "list lookup tables", or when they want to understand the iMIS data structure.
  This skill discovers and reads only; create/edit lookup values belong to
  content-management, Business Objects to business-object-design, and query
  authoring/execution to iqa-query-design.
argument-hint: "[area: entities|panels|queries|lookups|all]"
---

# iMIS Data Explorer

Discover what data and configuration exists in the iMIS instance.

**Documentation resource**: Use the `imis-docs` connector to search official iMIS help articles when you need to understand what a specific entity, field, or configuration option means in context.

## Areas to Explore

Based on $ARGUMENTS, explore one or more areas:

### Entity Types
Use `imis_entity_discover action=types` to list all 200+ entity types organized by category:
- Accounting, Advertising, Cart, Certification, Commerce, Communications
- Core, Events, Fundraising, Invoice, Item, Membership
- Order Processing, Payments, Party, User Security

For any entity, use `imis_entity_discover action=schema` to see its fields, types, and relationships.

### Business Objects (Custom Entities)
Use `imis_entity action=list` with entityType "BOEntityDefinition" to discover custom business objects.
These are user-defined entities with custom fields — the backbone of iMIS customization.
This is discovery only; create/edit/prove a BO via `imis_business_object_design`.

### Panel Sources (Custom Data)
Use `imis_panel_records action=list_panel_sources` to see available panel sources (the reportable custom data tables), profile a source's fields with `imis_panel_source_contract`, and read rows with `imis_panel_records action=list_records`. `imis_entity action=list entityType=PanelDefinition` returns layout definitions only, not the data source.
Panel sources are mostly Party-scoped, but some are Standalone/Event/Invoice or multi-instance; confirm the parent entity and cardinality with `imis_panel_source_contract` before assuming a Party scope.

### IQA Queries
Use `imis_document action=browse path=$/Common/Queries maxDepth=2` to see available query folders; both IQA and IQD documents live here. Browsing does not prove a query is REST-available — run it via `imis_query` and inspect its design via `imis_iqd_query`.

### Lookup Tables (GenTable)
Use `imis_lookup_configuration action=list_tables` to enumerate GenTable names, then `action=list_values tableName=<NAME>` for one table's Code/Description rows. Common populated tables:
- `PREFIX` — Name prefixes
- `SUFFIX` — Name suffixes
- `MEMBER_TYPE` — Customer/member types
- `STATE_CODES` — State/province codes
- `COUNTRY` — Country codes
- `CHAPTER` — Chapter codes

The Settings>Contacts>Activity types grid is NOT a GenTable — it is the LegacyActivityType catalog (read via `imis_contact_activity`), distinct from the modern InteractionType classification; GenTable ACTIVITY_TYPE is empty on live tenants.

### Document System / Content
Use `imis_document action=browse` with path `@/` to explore the site structure.

## Presentation

For each area explored, present:
- What was found (counts, names, categories)
- Key items of interest
- How to access the data (which tool to use)
- Suggestions for further exploration
