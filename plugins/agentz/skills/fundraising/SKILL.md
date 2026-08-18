---
name: fundraising
description: >-
  Manage donations, gifts, pledges, and fundraising in iMIS. This skill should
  be used when the user says "donation", "gift", "pledge", "donor", "campaign",
  "fundraising", "giving", "tribute", "memorial gift", "soft credit",
  "giving history", "record a donation", "donor report", "pledge payments",
  "thank you letter", "acknowledgment", "LYBUNT", "SYBUNT", "lapsed donors",
  "major donor", "in-kind gift", "donor cultivation", "annual fund",
  or when working with charitable giving, donor management, or fundraising
  analytics.
argument-hint: "[donor-name-or-id] [action: gift|pledge|history|report|acknowledge|tribute|major-donors]"
---

# Fundraising Management

Record donations, manage pledges, acknowledge donors, track giving history, and analyse fundraising performance in iMIS.

Boundary vs communications-management: fundraising owns gift/pledge/donor records and giving analytics. Campaign/appeal/source-code setup and the acknowledgment email itself belong to communications-management (campaign CRUD is shared via `imis_campaign_management`).

## Key Concepts

- **GiftInformationBatch**: The primary gift/donation entity — records donor, amount, date, campaign, fund
- **Pledges**: Installment-based giving commitments — created via `imis_create_pledge_installment_schedule` and settled via `imis_pay_pledge_installment`, NOT through `imis_process_gift`
- **Soft Credits**: Attribute one gift to multiple parties (e.g., spouse gets credit too)
- **Tributes**: Gifts made in honour or memory of someone
- **Campaign**: The fundraising initiative a gift is associated with (e.g., "Annual Fund 2025")
- **Appeal**: Sub-segment of a campaign targeting a specific audience
- **SourceCode**: Tracking code for the marketing channel (email, direct mail, event, etc.)
- **DonationPremium**: Thank-you gifts sent to donors who give above certain thresholds

**Receipts**: `imis_gift_receipt` owns the full receipt lifecycle — issue (with or without the email communication), void/reissue, receipted-gift date correction, guarded delete, and read-only post-send delivery status. Writes are preview → exact confirmation → readback; resend is not exposed.

**Premium/tribute setup**: `imis_fundraising_premium_setup` owns donation/gift premium records, premium rules/sets, tribute types, and the gift-adjustment audit logs, with approval-gated writes and readback.

---

## Actions

### Record a Donation

1. **Find the donor**: `imis_find_member` with name, email, or ID
2. **Gather gift details**:
   - Amount (required)
   - Fund/product code (required — the ItemId for the donation product)
   - Campaign (optional but recommended)
   - Source code (optional — how did the donor hear about this?)
   - Payment type: CASH only (`paymentMethodId` is fixed to CASH); for a check, put the check number in `referenceNumber` (<10 chars). Credit card payments CANNOT go via this tool.
   - Gift date (optional, defaults to today)
3. **Record the gift** (guarded two-step — `action=preview` validates and returns a `confirmationText`, then `action=submit` posts with that exact text):
   ```
   imis_process_gift action=preview donorId={partyId} amount=100 giftItemId="DONATION" sourceCode="EMAIL"
   imis_process_gift action=submit donorId={partyId} amount=100 giftItemId="DONATION" sourceCode="EMAIL" confirmationText="<exact text from preview>"
   ```
   The same `action=preview` → `submit` flow applies to every `imis_process_gift` call below.
4. **Acknowledge**: Always follow up with a thank-you (see Donor Acknowledgment below)

---

### Donor Acknowledgment / Thank-You

The most basic and most important fundraising follow-up. Every gift should be acknowledged promptly.

1. **Get donor and gift details**:
   - Prefer `imis_donor_360` donorPartyId={partyId} for donor name, email, address, and recent gifts in one read; the raw fallback is `imis_entity action=get entityType="Party" id={partyId}`
   - Recent gift: from the `imis_process_gift` response, or from `imis_donor_360`. The raw fallback for donor gifts is `imis_entity action=list entityType="Gift" filter="ID={partyId}"` — not `GiftInformationBatch` by `UserId` (that filters by batch owner, not donor)

2. **Compose thank-you email** with:
   - Donor's name
   - Gift amount and date
   - Fund/campaign the gift supports
   - Tax-deductibility statement (if applicable)
   - If Gift Aid eligible (UK): "We will claim an additional 25% from HMRC through Gift Aid"

3. **Send** (gated): `imis_communication_message_submit action=scaffold_email` to draft, then `action=preview_submit` to={donor_email} subject="Thank you for your generous gift" body={composed_html}, then `action=submit confirmationText="<exact text from preview_submit>"`

4. **Log the acknowledgment** (gated): `imis_contact_activity action=preview_log partyId={partyId} description="Donation acknowledgment sent — {amount}"` (optionally `details=...` and an `interactionTypeCode` resolved via `action=list_types`), then `action=log` with the returned exact `confirmationText`

5. **Timing best practice**: Acknowledge within 48 hours of receiving the gift. Major gifts (above organisational threshold) should also get a personal phone call.

---

### Record Pledge Payment Against Existing Pledge

When a donor makes a payment towards a previously committed pledge.

1. **Find existing pledges**: use `imis_donor_360` donorPartyId={partyId} (or a fundraising IQA) to find pledge commitments. The raw fallback for donor gift rows is `imis_entity action=list entityType="Gift" filter="ID={partyId}"` — not `GiftInformationBatch` by `UserId`, which filters by batch owner rather than donor.
2. **View pledge schedule**: `imis_scheduled_payments action=list` (no party filter — correlate client-side), or `imis_autopay_summary`/`imis_billing_summary partyId={partyId}` for the donor-scoped schedule.
3. **Record the payment** (gated): `imis_pay_pledge_installment action=preview` → `action=submit` with the returned exact `confirmationText`. This is the only path that advances the pledge schedule — `imis_process_gift` cannot record or link a pledge installment.
4. **Verify**: Re-read via `imis_billing_summary partyId={partyId}` (or `imis_autopay_summary`) to confirm the next installment date has advanced.
5. **Present**: Show updated pledge status — payments made, remaining balance, next due date

---

### In-Kind Gift Recording

Donations of goods, services, or property rather than cash.

1. **Determine fair market value**: Ask the user for the appraised or estimated value
   - For gifts over applicable thresholds, advise the donor to get an independent appraisal
2. **Record the gift**: `imis_process_gift` donorId={partyId} amount={fair_market_value} giftItemId={in_kind_fund_code}
3. **Log details** (gated): `imis_contact_activity action=preview_log partyId={partyId} description="In-kind donation: {description}" details="Description: {item_description}. Fair market value: {value}. Condition: {condition}."` (optionally an `interactionTypeCode` resolved via `action=list_types`), then `action=log` with the returned exact `confirmationText`
4. **Acknowledge**: Send thank-you noting the in-kind nature (do NOT state a dollar value in the thank-you letter for tax purposes — the donor determines the deduction)

---

### Complete Tribute / Memorial Gift Workflow

Gifts made "In Honour Of" or "In Memory Of" someone.

1. **Determine tribute type**:
   - "In Honour Of" — celebrating a living person (birthday, achievement, etc.)
   - "In Memory Of" — memorialising someone who has passed
   - Check available types: `imis_entity action=list entityType="TributeType"`. If it returns empty, ask the user for the type code (IMO = In Memory Of, IHO = In Honour Of).

2. **Gather details**:
   - Donor (who is giving)
   - Honouree Party (who is being honoured/memorialised — resolve their `partyId`)
   - Notification recipient (optional — family member or honoree to notify)
   - Amount, fund, campaign

3. **Record the gift** (gated `action=preview` → `submit`): `imis_process_gift donorId={partyId} amount={amount} giftItemId={fund} tributeType={type} tributePartyId={honouree_partyId}` (optional `tributeMessage`). `tributePartyId` is mandatory whenever `tributeType` is set.

4. **Send acknowledgment to donor** (gated): `imis_communication_message_submit action=preview_submit` thanking them and confirming the tribute, then `action=submit confirmationText="<exact text from preview_submit>"`

5. **Notify tribute recipient** (if requested):
   - Send a separate email/letter to the honoree or family member
   - `imis_communication_message_submit action=preview_submit` with message noting the gift was made in honour/memory (do NOT include the gift amount — that's between the donor and the organisation), then `action=submit confirmationText="<exact text from preview_submit>"`

6. **Log a contact interaction** (gated): `imis_contact_activity action=preview_log partyId={partyId} description="Tribute gift recorded"` (optionally `details=...` and an `interactionTypeCode` resolved via `action=list_types`) → `action=log` with the returned exact `confirmationText`, for the donor and (optionally) the tribute contact

---

### View Giving History

Prefer `imis_donor_360` donorPartyId={partyId} (or `imis_billing_summary partyId={partyId}`) for donor-scoped giving. The raw fallback reads the `Gift` detail rows scoped by donor Party ID:
```
imis_entity action=list entityType="Gift" filter="ID={partyId}" limit=100
```
Do NOT filter `GiftInformationBatch` by `UserId` for this — `UserId` is the batch OWNER (the staff member who entered the batch), not the donor.

Present:
- Total lifetime giving
- Giving by year (current year, last year, etc.)
- Largest single gift
- Most recent gift (date, amount, fund)
- Campaign breakdown
- Pledge status (if any active pledges)

---

### Create a Pledge

Multi-year or installment-based giving commitment. Use `imis_create_pledge_installment_schedule` (gated) — `imis_process_gift` rejects pledge params.

```
imis_create_pledge_installment_schedule action=preview partyId={partyId} giftItemId="PLEDGE" amount=1200 installmentCount=12
imis_create_pledge_installment_schedule action=submit partyId={partyId} giftItemId="PLEDGE" amount=1200 installmentCount=12 confirmationText="<exact text from preview>"
```
Optional: `firstPaymentDueDate` (ISO date; defaults to 30 days from now) and `paymentTermsId` (defaults to the tenant's Monthly payment terms — there is no frequency string param). Campaign/appeal attribution is not a parameter here; resolve the gift item first (commerce product items are rejected).

After creating:
- View schedule: `imis_scheduled_payments action=list` (no party filter — correlate client-side), or `imis_billing_summary partyId={partyId}`
- Set up auto-pay (if requested): guide to `imis_manage_autopay`
- Present: pledge total, installment amount, frequency, start date, estimated completion

---

### Campaign Analysis

```
imis_campaign_management action=list entity="CampaignSummary"
imis_campaign_management action=get entity="CampaignSummary" id="ANNUAL-2025"
```

For deeper analysis:
1. List gifts by campaign through a fundraising IQA via `imis_query` (campaign-level aggregation is a query, not a raw batch filter)
2. Discover the query with `imis_iqa action=surface` first if you do not already have the path
3. **Present**:
   - Campaign goal vs raised
   - Number of donors
   - Average gift size
   - Breakdown by appeal/source code
   - Comparison to prior campaigns

---

### LYBUNT / SYBUNT Analysis (Lapsed Donor Identification)

**LYBUNT** = Last Year But Unfortunately Not This (year) — donors who gave last year but haven't given this year.
**SYBUNT** = Some Years But Unfortunately Not This (year) — donors who gave in any prior year but not this year.

These are the most important donor retention metrics. Recapturing lapsed donors is far cheaper than acquiring new ones.

1. **Check for existing IQA query**: discover candidates with `imis_iqa action=surface` (or browse `$/Common/Queries/`) — look for donor lapse or LYBUNT queries
2. **If query exists**: `imis_query` queryPath={path} to run it
3. **If no query exists**, build the analysis manually:
   a. Pull giving history through a fundraising IQA via `imis_query` (multi-donor cohort work belongs in an IQA, not raw reads). For a single donor's raw gift rows, use `imis_entity action=list entityType="Gift" filter="ID={id}"` — do not filter `GiftInformationBatch` by `UserId` (that is the batch owner, not the donor).
   b. Group by PartyId and extract gift year
   c. Identify donors who gave in prior year(s) but NOT in the current year
   d. For each lapsed donor: get contact details via `imis_donor_360` donorPartyId={id} (raw fallback `imis_entity action=get entityType="Party" id={id}`)
4. **Present**:
   - Total LYBUNT donors (gave last year, not this year)
   - Total SYBUNT donors (gave some prior year, not this year)
   - Aggregate amount at risk (sum of their last gifts)
   - Top lapsed donors by prior giving level
   - Suggested outreach actions
5. **Recommend**: Send a re-engagement appeal to these donors via gated `imis_communication_message_submit action=scaffold_email` → `preview_submit` → `submit confirmationText="<exact>"`, or create a targeted campaign

---

### Major Donor Identification and Cultivation

Identify top donors and track cultivation activities.

1. **Define threshold**: Ask the user what constitutes a "major donor" for their organisation (common: $1,000+, $5,000+, $10,000+)
2. **Pull giving data**: run a fundraising IQA via `imis_query` for the giving cohort. For a single donor's raw gift rows, use `imis_entity action=list entityType="Gift" filter="ID={id}"` — do not filter `GiftInformationBatch` by `UserId` (that is the batch owner, not the donor).
3. **Aggregate by donor**:
   - Total lifetime giving
   - Largest single gift
   - Number of gifts (frequency)
   - Most recent gift date
   - Giving trend (increasing, decreasing, stable)
4. **Enrich profiles**: For top donors:
   - `imis_engagement action=definitions` (omit `scoreId` to list) — see what scoring MODELS are configured (e.g., event attendance, giving, volunteer hours); these are models, not per-member scores
   - `imis_engagement action=summary` partyId={id} — engagement level (activities, groups, subscriptions)
   - `imis_party_relationships` partyId={id} — connected contacts (board members, spouse, etc.)
   - `imis_entity action=list entityType="GroupMember" filter="PartyId={id}"` — committee/board involvement
5. **Present ranked list**:
   - Name | Lifetime Giving | Last Gift | Engagement Score | Key Relationships
6. **Cultivation tracking**: Use gated `imis_contact_activity action=preview_log` → `action=log` (with `description`/`details` and an optional `interactionTypeCode` from `action=list_types`) to record:
   - Phone calls, meetings, event invitations
   - Proposal discussions
   - Follow-up actions
   - Each interaction builds the cultivation history visible in the member's activity log

---

## Workflow: Complete Donor Profile

The holistic view of a donor for any fundraising conversation.

1. Find the donor: `imis_find_member` or use `imis_member_360` partyId={id} for everything at once
2. Giving history: `imis_billing_summary` partyId={id}
3. Detailed gifts: from `imis_donor_360` donorPartyId={id} (or a fundraising IQA). Raw fallback: `imis_entity action=list entityType="Gift" filter="ID={id}"` — not `GiftInformationBatch` by `UserId`, which filters by batch owner rather than donor.
4. Pledge status: `imis_billing_summary partyId={id}` (donor-scoped), or `imis_scheduled_payments action=list` (no party filter — correlate client-side)
5. Engagement: `imis_engagement action=summary` partyId={id}
6. Gift Aid (UK): `imis_gift_aid action=declaration_check partyId={id}` (partyId required; the custom Gift Aid panel is auto-detected)
7. Relationships: `imis_party_relationships` partyId={id}
8. Communication history: `imis_communication_operations_profile` partyId={id}
9. Summarise: total giving, recent gifts, pledge status, engagement level, Gift Aid status, key relationships

---

## Workflow: Fundraising Report

1. List campaigns: `imis_campaign_management action=list entity="CampaignSummary"`
2. Run a gifts query: `imis_query` with a fundraising IQA query path (discover it via `imis_iqa action=surface` if unknown)
3. Calculate totals by campaign, time period, or donor segment
4. Compare to prior periods (year-over-year)
5. Present findings with totals, averages, and trends
6. Highlight: top donors, biggest campaigns, LYBUNT risk
