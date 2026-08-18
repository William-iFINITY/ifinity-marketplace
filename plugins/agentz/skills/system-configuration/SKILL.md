---
name: system-configuration
description: >-
  Configure and set up iMIS system features — security, billing cycles,
  pricing, commerce, process automation, forms, data migration, and
  integrations. This skill should be used when the user says "configure
  iMIS", "set up billing", "billing cycle", "pricing rules", "payment
  gateway", "AutoPay configuration", "security roles", "user access",
  "permissions", "data migration", "iImport", "import data", "configure
  commerce", "order types", "shopping cart", "SSO", "single sign-on",
  "process automation", "scheduled task",
  "tax configuration", "promotion codes", "security groups", or when
  working with iMIS system administration and configuration. Form Builder
  authoring/placement/submission/verification belongs to the forms skill; this
  skill covers only the Settings > Forms configuration posture.
argument-hint: "[area: security|billing|pricing|commerce|automation|forms|migration|sso]"
---

# iMIS System Configuration

Configure and administer iMIS system features — security, billing, pricing, commerce, process automation, forms, data migration, and integrations.

**Documentation resource**: Use the `imis-docs` connector to search official iMIS help articles (help.imis.com) for detailed configuration steps, settings options, and UI workflows. Many system configuration tasks require the iMIS admin UI — the docs provide the exact steps.

---

## Security & Access Configuration

### System Roles
Built-in roles with specific system-level permissions:
- **SysAdmin**: Full system access — use sparingly
- **CompanyAdministrator**: Organisational admin — manages users and settings
- **OnBehalfOf**: Proxy access — act as another user
- **RemoteService**: API/integration service accounts
- **Everyone**: Default role for all authenticated users

### Security Groups
Module-specific access control. Common groups:
- **CampaignAdmin / CampaignMgr / CampaignUser**: Fundraising campaign access tiers
- **CertificationAdmin / CertificationMgr / CertificationUser**: Certification program access
- **EventUser**: Event management access
- **FRUser**: Fundraising/giving access
- **OpportunityAdmin / OpportunityCreator / OpportunityMgr**: Sales opportunity access

### Managing User Credentials
Create login credentials (approval-gated, two-step):
```
imis_security_access_setup action="preview_create" partyId={id} userName={email} password={temp}
imis_security_access_setup action="create" partyId={id} userName={email} password={temp} confirmationText="<exact text from preview>"
```

Check whether a credential exists (does not prove sign-in works):
```
imis_membership_login_setup action="list" paramsObject={"PartyId":"{id}"}
imis_membership_login_setup action="get" id={membershipLoginId}
```

Check existing security posture for a Party:
```
imis_security_access_profile action="user" partyId={id}
```

**Changing credentials**: there is a real update path — no delete-and-recreate needed:
```
imis_security_access_setup action=execute_plan executeOperation=update_username ...
imis_security_access_setup action=execute_plan executeOperation=update_password ...
```
Each is gated (preview → exact confirmationText).

### Access Configuration Guidance
- **Role hierarchy**: Assign minimum necessary roles — start restrictive, add as needed
- **Module authorisation**: Each iMIS module has its own access level (None, Read, Full)
- **Lockout policies**: Configure via iMIS Settings > Security — failed attempts, lockout duration
- **Password policies**: Minimum length, complexity, expiry — configured in iMIS admin
- **IP restrictions**: Can restrict staff site access by IP range

---

## Billing Cycle Configuration

### Billing Types

#### Dues Billing (Membership)
Generates renewal invoices for membership subscriptions:
- **Annual billing**: All members billed at same time (e.g., January 1)
- **Anniversary billing**: Each member billed on their join anniversary date
- **Customer type selection**: Bill specific member types or all
- **Chapter/section inclusion**: Include chapter and section dues on same invoice
- **Prorating**: New members joining mid-cycle can be prorated

#### Non-Dues Billing (Subscriptions)
For publications, services, and other recurring charges:
- **Individual paid-through evaluation**: Each subscription tracked independently
- **Optional product handling**: Include/exclude specific products
- **Separate from membership**: Can have different cycle than dues

### Billing Cycle Tools
List billing cycles:
```
imis_entity action=list LegacyBillingCycle limit=50
```

List billing items:
```
imis_entity action=list LegacyBillingItem limit=100
```

### AutoPay Configuration
- **All contacts**: Process everyone with stored payment method
- **AutoPay-only**: Only contacts who opted into AutoPay
- **Non-AutoPay only**: Generate invoices for manual payers
- **Accounting method**: Cash or Accrual basis

Check AutoPay status:
```
imis_autopay_summary partyId={id}
```

Review gateway accounts (tenant-level config; no party filter):
```
imis_gateway_accounts action="list"
imis_gateway_accounts action="get" accountId={id}
```

### Configuration Guidance
- **Cash vs Accrual**: Accrual recognises revenue when invoiced; Cash when paid. Choose based on accounting standards
- **Grace period design**: Typical: 30 days (standard), 60 days (lenient), 90 days (very lenient). Grace period = time after expiry before member loses access
- **Renewal reminders**: Set up 60-day, 30-day, and 7-day reminder emails before expiry
- **Billing run schedule**: Test in staging first — billing generates real invoices

---

## Pricing Configuration

### Pricing Groups
Control who can purchase products and at what price:
- Pricing groups are sets of contacts eligible for specific pricing
- A contact can belong to multiple pricing groups
- Products can have different prices for different groups

### Event Pricing
- **Multi-tier pricing**: Early bird, standard, late registration
- **Member vs non-member**: Different rates by membership status
- **Registration options**: Individual functions/sessions priced separately
- **Staff override**: Allow staff to override pricing for special circumstances

### Product Pricing Tools
List item prices:
```
imis_entity action=list ItemPrice limit=100
```

List price sheet prices:
```
imis_entity action=list PriceSheetProductPrice limit=100
```

### Special Pricing (Expression Builder)
For complex dues pricing based on member attributes:
- Revenue tier pricing (based on organisation revenue)
- Sliding scale (based on number of employees)
- Regional variations
- Uses Expression Builder BOs — calculated at billing time

### Guidance
- **Test pricing thoroughly**: Create test contacts in each pricing group and verify correct amounts
- **Document pricing logic**: Keep a spreadsheet mapping member types to pricing tiers
- **Effective dates**: Use price sheets for time-bound pricing (early bird deadlines)
- **Discount structures**: Use promotion codes for one-off discounts rather than creating price exceptions

---

## Commerce / Online Store Setup

### Product Types
- **Physical products**: Shipped goods — requires shipping configuration
- **Digital products**: PDF, video, audio, web content — delivered electronically
- **Subscriptions**: Recurring charges — tied to billing cycles
- **Events**: Event registrations (handled via Event module)
- **Donations**: Gift/giving products (handled via Fundraising module)

### Shopping Cart Configuration
- Cart timeout settings
- Guest checkout vs member-only
- Required fields at checkout
- Confirmation email templates

### Tax Configuration
- **US**: State and local sales tax rates
- **Canada**: HST, GST, PST by province
- **EU**: VAT rates by country
- **Australia/NZ**: GST flat rate
- Tax-exempt products and customer types

### Promotion Codes
- **General**: Apply to any product in cart
- **Product-specific**: Only for designated items
- **Time-limited**: Start and end dates
- **Usage limits**: Max uses per code or per customer

### Commerce Tools
List products:
```
imis_entity action=list Item limit=100
```

Create an order (gated, two-step; no per-line quantity — rejects dues/subscription/fundraising items; reverse via order return + refund):
```
imis_create_billme_order action="preview" partyId={id} itemIds=["PROD001"]
imis_create_billme_order action="submit" partyId={id} itemIds=["PROD001"] confirmationText="<exact text from preview>"
```

Read General Lookup Table (GenTable) values for a real GenTable-backed picklist:
```
imis_lookup_configuration action="list_values" tableName={GENTABLE_NAME}
```
Editing dropdown/lookup values themselves belongs to content-management; use this only to read GenTable values while configuring commerce. Not every "order types" style picklist is GenTable-backed — confirm the table exists in GenTable first.

### Guidance
- **Payment gateway**: Must be configured before accepting online payments. Common: Authorize.Net, PayPal, Stripe (via integration)
- **Order confirmation emails**: Configure templates in Communications > Email Templates
- **Shipping zones**: Define zones and rates in Commerce > Shipping before selling physical products
- **Test orders**: Always place test orders through the full checkout flow before going live

---

## Process Automation

### Scheduled Tasks
Automated jobs that run on a schedule or trigger:
- **Email tasks**: Send templated emails to a query-defined audience
- **Report-attached email**: Generate and email report PDFs
- **Stored procedure tasks**: Execute custom SQL procedures
- **Premium tasks** (requires license): Custom business logic, webhooks, external integrations

### Task Triggers
- **Manual**: Run on-demand from the task manager
- **Scheduled**: Cron-like scheduling (daily, weekly, monthly, specific time)
- **Webhook**: Triggered by external HTTP call
- **Database change**: Fires on insert, update, or delete of specific records

### Standard Alerts (Out-of-the-Box)
iMIS includes 30+ pre-built alerts:
- **Event**: Registration confirmation, cancellation, waitlist promotion
- **Membership**: Welcome new member, renewal reminder, lapse notification
- **Commerce**: Order confirmation, shipping notification
- **Fundraising**: Gift acknowledgment, pledge reminder
- **System**: Failed login, data import complete

### Process Automation Tools
Authoring, running, and diagnosing automations is owned by the **process-automation** skill (`imis_task_automation_design` for declarative create/update/delete with preview→confirm, `imis_task_automation_execution` for gated runs, `imis_workflow_runtime` for legacy queue triage). From here, view task execution history:
```
imis_task_automation_profile action="inventory" limit=20
```
(or `action="diagnostics_health"` for a failure/health packet)

List configured notifications:
```
imis_communication_setup action=list entity=NotificationSet
```
(`imis_communication_delivery action="surface"` returns only the action catalog, not the configs.)

Run a no-send FindNotifications discovery for one set and contact (both params required), planned then executed:
```
imis_communication_delivery action="plan_find_notifications" notificationSetId={id} partyId={id}
imis_communication_delivery action="find_notifications" notificationSetId={id} partyId={id} confirmationText="<exact text from plan>"
```
(or `imis_communication_delivery action="preview_communication" templatePath=...` to render a template preview)

### Guidance
- **Start with standard alerts**: Customise the 30+ built-in alerts before creating new ones
- **Test in staging**: Automated tasks generate real emails and data changes — always test first
- **Scheduling best practice**: Schedule heavy tasks during off-peak hours
- **Communication templates**: Design email templates in Communications before linking to tasks
- **Error monitoring**: Check `imis_task_automation_profile action="inventory"` (or `diagnostics_health`) regularly for failed task executions
- **Note**: Creating new custom tasks requires the iMIS Premium license. Basic task configuration is available in all editions

---

## Form Builder

### Form Capabilities
iMIS forms integrate natively with the database:
- Combine data from multiple sources (contact fields, panel sources, addresses)
- Enforce business rules (required fields, validation, conditional logic)
- Post-submission workflows (email, activity logging, group assignment)
- Responsive design for mobile

### Form Elements
- **Contact fields**: Name, email, phone, address (mapped to Party entity)
- **Address block**: Full address with country-specific formatting
- **Activity logging**: Auto-create activity records on submission
- **Document upload**: File attachment fields
- **Custom panel fields**: Fields from any Panel Source
- **HTML content**: Static text, instructions, section headers

### Post-Submission Actions
- **Button automation**: Trigger workflows on form submit
- **Email notification**: Send confirmation to submitter and/or staff
- **Conditional logic**: Show/hide fields based on other field values
- **Group assignment**: Auto-add contact to group on submit
- **Activity creation**: Log form submission as contact activity

### Form Tools

Form Builder authoring, placement, submission, and verification belong to the forms skill — this section covers only the Settings > Forms posture read. List existing forms (counts only):
```
imis_forms_inventory limit=50
```

For per-form responses, use the forms skill's reporting tool:
```
imis_form_reporting_profile ...
```

### Form Health Checks
iMIS runs automatic health checks every 24 hours:
- **Missing dropdowns**: Value list references that no longer exist
- **Field size mismatches**: Form field length vs database column length
- **Type changes**: Data type changes that affect existing form fields
- Review health in: Settings > Forms > Health Check

### Guidance
- **Duplicate checking**: Configure duplicate-check logic to prevent creating duplicate contacts on public forms
- **Styling**: Forms inherit site theme CSS — use custom CSS classes for specific form styling
- **Testing**: Test every form as both a logged-in member and an anonymous visitor
- **CAPTCHA**: Enable on public-facing forms to prevent spam submissions
- **Confirmation page**: Always configure a meaningful confirmation/thank-you page

---

## Data Migration (iImport)

### Overview
iImport is the built-in data import tool for bulk data loading:
- **Format**: Excel `.xlsx` files only
- **Max records**: 250,000 per file (recommended max: 10,000 for reliability)
- **Actions**: Insert (new records only), Update (existing only), Insert/Update (both)
- **Templates**: Reusable import templates for recurring imports

### Import Process
1. **Plan**: Map source system fields to iMIS entity fields
2. **Prepare**: Clean data in Excel — standardise formats, remove duplicates
3. **Template**: Create or select an import template mapping columns to fields
4. **Upload**: Upload Excel file and select template
5. **Preview**: Review mapping and sample records before executing
6. **Execute**: Run the import — monitor progress
7. **Verify**: Check results for errors and successful records

### Import Tools
Read import setup and batch posture:
```
imis_import_operations_profile action="inventory"
```

Post an existing import batch (gated, two-step). Upload, column mapping, and Insert/Update mode are all set when the ImportBatch is created in the iMIS UI / iImport — no MCP tool uploads the file or maps columns:
```
imis_import_processing action="plan_post_batch" batchId={id}
imis_import_processing action="post_batch" batchId={id} confirmationText="<exact text from plan>"
```

### Data Preparation Guidelines
- **Date format**: Use `YYYY-MM-DD` for international compatibility
- **Required fields**: Ensure all required fields have values (Party: LastName, MemberType at minimum)
- **Unique identifiers**: Include Party ID for updates, or use email/name matching for insert/update
- **Character encoding**: UTF-8 for international characters
- **Lookup values**: Verify all code values exist in lookup tables before import (member types, prefixes, etc.)

### Common Import Scenarios
- **Contact migration**: Names, addresses, emails, phone numbers, demographics
- **Membership history**: Subscription records with join dates, expiry dates, member types
- **Giving history**: Gift records with amounts, dates, campaign codes, fund codes
- **Event history**: Past event registrations and attendance
- **Custom data**: Panel source data for custom fields

### Guidance
- **Always back up first**: Export existing data before running large imports
- **Test with small batch**: Import 10-50 records first, verify, then run full import
- **Deduplication**: Run duplicate checking before import — iMIS has built-in duplicate detection
- **Scheduling**: Schedule large imports during off-peak hours — imports can lock tables
- **Error handling**: Download the error report after each import — fix and re-import failed records
- **Recurring imports**: Save templates for regular data loads (monthly chapter reports, quarterly giving, etc.)

---

## SSO & Integrations

### Single Sign-On (SSO)
iMIS supports industry-standard SSO protocols:
- **SAML 2.0**: Enterprise SSO standard — works with most identity providers
- **OpenID Connect (OAuth 2.0)**: Modern web standard — used by social logins and cloud providers

### Supported Identity Providers
- **Microsoft Entra ID** (formerly Azure AD): Most common for Microsoft-based organisations
- **Custom SAML providers**: Any SAML 2.0-compliant IdP
- **Social logins**: Can be configured via OpenID Connect

### SSO Configuration (Advisory)
SSO setup is done through the iMIS admin UI — not via API:
1. **Choose protocol**: SAML 2.0 or OpenID Connect based on your IdP
2. **Configure IdP**: Set up iMIS as a service provider in your identity provider
3. **Exchange metadata**: Share IdP metadata URL with iMIS, iMIS SP metadata with IdP
4. **Map user attributes**: Map IdP user profile fields to iMIS Party fields
5. **Test**: Verify login flow with a test account before rolling out
6. **TLS requirement**: TLS 1.2 or higher required for all SSO connections

### Integration Ecosystem
iMIS integrates with:
- **Cvent**: Event management sync (registrations, attendees)
- **Microsoft Outlook**: Calendar and contact sync
- **Zendesk**: Support ticket integration
- **GL Processor Cloud**: General ledger accounting sync
- **Custom integrations**: Via REST API (this agent plugin) or webhooks

### Guidance
- **No software installation**: iMIS SSO is cloud-configured — no on-premise software needed
- **User provisioning**: Decide between JIT (just-in-time) provisioning and pre-provisioned accounts
- **Fallback**: Always maintain a local admin account that doesn't use SSO (for emergency access)
- **Testing**: Test SSO with multiple browsers and devices before enabling for all users
- **Documentation**: Record all IdP configuration settings — SSO issues are hard to debug without configuration details

---

## Core System Metadata & Localization

`imis_core_system_configuration` owns the Core module's promoted configuration surface: API endpoint definitions, entity data-model shape (`action="describe_entity"`), customer/member type definitions, culture formats, and localization cultures/phrases/control types.

```
imis_core_system_configuration action="inventory"                    # what Core config exists
imis_core_system_configuration action="describe_entity" ...          # data-model shape of an entity
imis_core_system_configuration action="preview_update" ... → action="update" ... confirmationText="<exact text from preview>"
```

- Writes (customer types, localization phrases/cultures, culture formats) are preview → exact confirmation → readback where the endpoint exposes a read route.
- Route Core-adjacent entities to their owners instead: Activity types and interaction types → `imis_contact_activity` catalog actions (the Settings > Contacts > Activity types grid is NOT a lookup table); cash accounts → `imis_accounting_configuration_setup`; GenTable dropdowns → `imis_lookup_configuration`.
- Core readback proves the record changed, not that rendered UI, billing, panels, or reports consumed the change — verify the consuming surface separately (e.g. a localization phrase change is proven on the rendered page, not in the Core record).
