# iMIS Implementation Guide

Reference guide for implementation partners configuring iMIS for association clients.

## iMIS Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   iMIS EMS Cloud                     │
├──────────────┬──────────────┬───────────────────────┤
│  Staff Site  │ Public Site  │     REST API          │
│  (internal)  │   (RiSE)    │   (this plugin)       │
├──────────────┴──────────────┴───────────────────────┤
│              Core Database Engine                    │
│  Parties │ Subscriptions │ Events │ Giving │ Orders │
├─────────────────────────────────────────────────────┤
│           Business Object Layer                      │
│  Standard BOs │ Custom BOs │ Panel Sources │ IQA    │
├─────────────────────────────────────────────────────┤
│           Integration Layer                          │
│  SSO │ Payment Gateways │ Webhooks │ Automation     │
└─────────────────────────────────────────────────────┘
```

### Key Architectural Concepts
- **Staff Site**: Internal admin interface — full data access, configuration, billing, reports
- **Public Site (RiSE)**: Member-facing website — self-service, events, directories, commerce
- **REST API**: Programmatic access — this agent plugin uses the REST API for all operations
- **Business Objects**: Abstraction layer between raw database and API/IQA — all queries and API calls work through BOs
- **Document System**: Content management — pages, folders, queries, navigation all stored as Documents

## Configuration vs Customisation

| Approach | When to Use | Examples |
|----------|-------------|---------|
| **Configuration** (preferred) | Standard iMIS features cover the requirement | Billing cycles, pricing groups, security roles, IQA queries, RiSE pages |
| **Extension** | Need custom data but standard UI works | Panel Sources for custom fields, custom BOs for new data tables |
| **Customisation** | Unique business logic not covered by configuration | Custom iParts, stored procedures, webhook integrations |

**Principle**: Always try Configuration first, then Extension, then Customisation. Each step adds complexity and upgrade risk.

## Module Dependency Map

Some iMIS features depend on others being configured first:

```
Security & Roles ──→ Everything (configure first)
        │
        ▼
Lookup Tables ──→ Member Types, Event Types
        │
        ▼
Billing Cycles ──→ Membership Products ──→ Pricing Groups
        │                                        │
        ▼                                        ▼
AutoPay Config ──→ Payment Gateways ──→ Commerce / Online Store
        │
        ▼
Events ──→ Event Functions ──→ Event Pricing ──→ Registration
        │
        ▼
Fundraising ──→ Campaigns ──→ Appeals ──→ Source Codes
        │
        ▼
Communications ──→ Email Templates ──→ Notifications ──→ Automation
        │
        ▼
RiSE Website ──→ Navigation ──→ Pages ──→ iParts ──→ Theme
```

> Activity types are not a GenTable lookup — they are the **LegacyActivityType** grid (Settings>Contacts>Activity types) owned by `imis_contact_activity`, not `imis_lookup_configuration`.

### Configuration Order (Recommended)
1. **Security**: Roles, groups, admin accounts
2. **Lookup tables**: Member types, prefixes, countries (GenTable). Activity types are configured separately as the LegacyActivityType grid via `imis_contact_activity`, not as a GenTable.
3. **Billing**: Cycles, products, pricing groups
4. **Payment gateways**: Stripe/PayPal/Authorize.Net configuration
5. **Membership products**: Dues items, chapter products, pricing
6. **Events**: Event types, function types, pricing
7. **Fundraising**: Campaigns, appeals, source codes, fund codes
8. **Communications**: Email templates, notification triggers
9. **Panel Sources**: Custom data tables
10. **IQA Queries**: Reports, dashboards, data extracts
11. **RiSE Website**: Pages, navigation, iParts, theme
12. **Process Automation**: Scheduled tasks, alerts
13. **Data Migration**: Import templates, data loads

## Common Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|------------|
| Editing Quick Start themes directly | Changes overwritten on upgrade | Copy theme, edit the copy |
| Not enabling "Available in IQA" on custom fields | Fields invisible in queries | Enable during Panel Source creation |
| Mixing single and multi-instance data in one Panel Source | Can't change after creation | Plan cardinality before creating |
| Running billing in production without testing | Real invoices generated | Test in staging environment first |
| Not backing up before data migration | Data loss if import goes wrong | Export existing data before import |
| Skipping duplicate detection on public forms | Duplicate contact records | Enable duplicate checking on all forms |
| Over-customising when configuration suffices | Upgrade complexity, maintenance burden | Exhaust configuration options first |
| Not documenting custom configurations | Knowledge loss when staff change | Maintain configuration documentation |

## Relevant Skills by Area

| Configuration Area | Skill | Key Tools |
|-------------------|-------|-----------|
| Website / RiSE | `rise-website-design` | `imis_document action=browse`, `imis_document action=create`, `imis_document action=content_items` |
| Queries / Reports | `iqa-query-design` | `imis_query`, `imis_entity action=list BOEntityDefinition`, `imis_entity_discover action=schema` |
| Custom Data | `business-object-design` | `imis_panel_records`, `imis_entity action=list PanelDefinition` |
| System Setup | `system-configuration` | `imis_security_access_profile`, `imis_entity action=list LegacyBillingCycle`, `imis_import_processing` |
| Membership | `onboard-member`, `membership-renewal` | `imis_manage_subscription`, `imis_billing_summary` |
| Events | `event-management` | `imis_register_for_event`, `imis_entity action=list Event` |
| Fundraising | `fundraising` | `imis_process_gift`, `imis_entity action=list GiftInformationBatch` |
| Billing | `billing-management` | `imis_billing_summary`, `imis_create_billme_order` |
| Communications | `communications-management` | `imis_communication_message_submit`, `imis_communication_delivery` |
| Data Exploration | `data-explorer` | `imis_entity action=list`, `imis_entity_discover action=schema`, `imis_search` |
