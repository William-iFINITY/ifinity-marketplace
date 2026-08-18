---
name: communications-management
description: >-
  Manage communications, campaigns, and outreach in iMIS. This skill should be
  used when the user says "send email", "communications history", "campaign",
  "appeal", "outreach", "notification", "email history", "source code tracking",
  "solicitation", "communication log", "what emails were sent", "create a
  campaign", "set up appeals", "thank you letter", "donor acknowledgment",
  "notification trigger", "automated email", "renewal reminder",
  or when working with marketing campaigns, fundraising appeals, or member
  communications. Compose/send and read communication history here; donor and
  gift records plus campaign giving totals belong to the fundraising skill.
  Campaign/appeal/source CRUD is shared via imis_campaign_management.
argument-hint: "[member-name-or-id] [action: history|send|campaigns|create-campaign|thank-you|notifications]"
---

# Communications & Campaign Management

View communication history, manage campaigns, send communications, and configure notifications in iMIS.

## Key Concepts

- **Communication**: A record of an email, letter, or other communication sent to a contact
- **Campaign**: A fundraising or marketing initiative (e.g., "Annual Fund 2025")
- **Appeal**: A sub-segment within a campaign targeting specific audiences (e.g., "Major Donors", "Lapsed Members")
- **SourceCode**: Tracks the marketing channel or origin of a response (e.g., "EMAIL-DEC", "DIRECTMAIL")
- **Solicitation**: An outreach effort within a campaign
- **NotificationSet**: Automated email triggers (renewal reminders, registration confirmations, payment receipts)
- **ContactInteraction**: The modern interaction log — write it via `imis_contact_activity action=log`, classified by an InteractionType (resolve the code via `action=list_types`). Distinct from LegacyActivityType (the Settings>Contacts>Activity types grid).

---

## Actions

### View Communications Setup / Recipient Context
```
imis_communication_operations_profile action=inventory partyId={id}
```
This reads communication setup plus the party's preferences/recipient context — it is NOT the per-party history log.

For one party's communication history rows:
```
imis_communication_history_profile action=party partyId={id}
```

For interaction (activity) history: `imis_contact_activity action=list_interactions partyId={id}` — shows logged emails, calls, meetings, notes.

### Send an Email
Gated two-step send (scaffold, preview, then submit):
```
imis_communication_message_submit action=scaffold_email to={email} subject="Subject" body="<h1>Hello</h1><p>Your message here</p>" isHtml=true
imis_communication_message_submit action=preview_submit ...
imis_communication_message_submit action=submit ... confirmationText="<exact text from preview>"
```
HTML is supported when `isHtml=true`. A successful submit is NOT proof of delivery, open, or click. Log the send afterward with the gated `imis_contact_activity action=preview_log` → `action=log` (use `interactionTypeCode` from `action=list_types`).

### View Campaigns
```
imis_campaign_management action="inventory"
imis_campaign_management action="list" entity="CampaignSummary"
imis_campaign_management action="list" entity="AppealSummary"
imis_campaign_management action="list" entity="SourceCodeSummary"
imis_campaign_management action="list" entity="SolicitationSummary"
```

### Get Campaign Details
```
imis_campaign_management action="get" entity="CampaignSummary" id={CampaignId}
```

### View Notification Configurations
```
imis_communication_operations_profile action=inventory
imis_communication_setup action=list entity=NotificationSet
```
`imis_communication_delivery` does not list/get notification configs. It has two separate lanes, each planned then executed: the no-send NotificationSet FindNotifications discovery is `plan_find_notifications notificationSetId={id} partyId={id}` (both params required) → `find_notifications` with the returned exact `confirmationText`; the template send lane is `preview_communication` → `plan_send_communication` → `send_communication`.

---

## Campaign Creation Workflow

Set up a new fundraising or marketing campaign with appeals and tracking codes.

1. **Gather details**:
   - Campaign name/code (e.g., "ANNUAL-2025")
   - Description and purpose
   - Start and end dates
   - Goal amount (for fundraising campaigns)

2. **Create the campaign**: gated two-step via `imis_campaign_management`:
   ```
   imis_campaign_management action=preview_create entity=CampaignSummary payloadObject={
     "CampaignCode": "ANNUAL-2025",
     "Name": "Annual Fund 2025",
     "Description": "Annual fundraising campaign",
     "StartDate": "2025-01-01",
     "EndDate": "2025-12-31"
   }
   imis_campaign_management action=create entity=CampaignSummary payloadObject={...} confirmationText="<exact text from preview>"
   ```
   If the purpose-built writer reports the Summary view is read-only, do not bypass it with raw mutation. Emit the iMIS Staff campaign-setup handoff and verify the record afterward with `imis_campaign_management action=get`.

3. **Create appeals** (audience segments): `imis_campaign_management action=preview_create entity=AppealSummary` → `create` with campaign reference

4. **Create source codes** (tracking): `imis_campaign_management action=preview_create entity=SourceCodeSummary` → `create` with channel details (e.g. EMAIL, DIRECTMAIL, EVENT, PHONE)

5. **Verify**: `imis_campaign_management action=get entity=CampaignSummary id={CampaignId}`

6. **Present**: Campaign created with ID, appeals configured, source codes ready for tracking

---

## Donor Thank-You / Acknowledgment Workflow

Send a personalised thank-you after a donation.

1. **Find the donor**: `imis_find_member` with name/email/ID
2. **Get recent gift details**: `imis_donor_360 donorPartyId={id}` — use its donor-scoped recent gifts (or a verified fundraising IQA), not `GiftInformationBatch` filtered by a batch-owner field
3. **Compose the email**:
   - Address the donor by name
   - Acknowledge the specific gift amount and date
   - Mention the fund/campaign it supports
   - Include tax-deductibility language if applicable
   - For UK donors with Gift Aid: mention the 25% uplift
4. **Send through the gated single-message lane**:
   ```
   imis_communication_message_submit action=scaffold_email to={donor_email} subject="Thank you for your generous gift of {amount}" body={composed_html} isHtml=true
   imis_communication_message_submit action=preview_submit ...
   imis_communication_message_submit action=submit ... confirmationText="<exact text from preview>"
   ```
5. **Log**: gated two-step — `imis_contact_activity action=preview_log partyId={id} description="Donation acknowledgment sent — {amount}" interactionTypeCode={code}` then `action=log partyId={id} description="..." interactionTypeCode={code} confirmationText="<exact text from preview>"` (resolve `interactionTypeCode` via `action=list_types`; do not hardcode "Email")

**Best practices**:
- Acknowledge within 48 hours
- Major gifts deserve a personal phone call in addition to email
- Include the donor's cumulative giving total for the year if meaningful
- For tribute gifts, also notify the honoree/family (see fundraising skill)

---

## Notification / Trigger Email Configuration

iMIS notifications automate email sends based on system events.

### View Existing Notifications
```
imis_communication_operations_profile action=inventory
imis_communication_setup action=list entity=NotificationSet
```
Run a no-send FindNotifications discovery via `imis_communication_delivery action=plan_find_notifications notificationSetId={id} partyId={id}` (both params required), then `action=find_notifications` with the returned exact `confirmationText`.

### Common Notification Types
- **Membership renewal reminders**: Sent X days before PaidThrough date
- **Event registration confirmations**: Sent immediately after registration
- **Payment receipt confirmations**: Sent when payment is processed
- **Welcome emails**: Sent to new members
- **Lapse notifications**: Sent when membership expires
- **Order confirmations**: Sent after purchase

### Configuring Notifications
**What the API can do**: `imis_communication_setup` writes `NotificationSet` records (gated `preview_create` → `create`, `preview_update` → `update`, `preview_delete` → `delete`, entity=NotificationSet). The scheduled task/alert that FIRES a notification is Process Automation — author it with `imis_task_automation_design` (or edit natively in RiSE > Process Automation).

**Advisory workflow for implementation**:
1. Review current notifications: `imis_communication_operations_profile action=inventory`
2. Identify gaps (e.g., missing renewal reminders, no welcome email)
3. Document the required notification:
   - Trigger event (what causes it to fire)
   - Timing (immediately, X days before/after)
   - Template content
   - Recipient(s)
4. Guide the user to configure in iMIS: Settings > Communications or RiSE > Process Automation
5. After creation, verify: `imis_communication_setup action=list entity=NotificationSet` to confirm it appears

---

## Workflow: Review Member Communications

1. Find the member: `imis_find_member`
2. View communication history: `imis_communication_history_profile action=party partyId={id}`
3. View interaction log: `imis_contact_activity action=list_interactions partyId={id}`
4. Summarise:
   - Total communications sent
   - Types (email, letter, phone, etc.)
   - Most recent communication (date, subject, type)
   - Any gaps (e.g., haven't communicated in 6+ months)

---

## Workflow: Campaign Analysis

1. List campaigns: `imis_campaign_management action=inventory` (or `action=list entity=CampaignSummary`)
2. Get campaign details: `imis_campaign_management action=get entity=CampaignSummary id={CampaignId}`
3. Check associated gifts: prefer `imis_query` with a fundraising IQA over an unverified GiftInformationBatch campaign filter
4. Check appeals: `imis_campaign_management action=list entity=AppealSummary` — which audience segments performed best
5. Check sources: `imis_campaign_management action=list entity=SourceCodeSummary` — which channels drove the most responses
6. Summarise:
   - Total raised vs goal
   - Number of donors
   - Average gift size
   - Breakdown by appeal and source code
   - Comparison to prior campaigns if data available
