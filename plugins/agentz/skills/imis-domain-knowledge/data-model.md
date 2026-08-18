# iMIS Data Model Relationships

## Membership Billing
```
Party → Subscription → Invoice → Payment
```
- **Active member**: `Subscription.PaidThrough > today`
- **Lapsed member**: `Subscription.PaidThrough < today`
- Chapters are Subscriptions with `CHAPT/` prefix product codes
- Customer Type controls billing rates and eligibility

## Events
```
Event → EventFunction (sessions) → EventRegistration (attendees) → Party
```
- Registration uses `_execute` endpoint, NOT regular POST
- Composite key: `EventId~PartyId`
- EventFunction cannot be listed (get by ID only)

## Fundraising
```
Party → GiftInformationBatch (with Item, Campaign, TributeType, DonationPremium)
```
- **Soft Credits**: Attribute one gift to multiple parties
- **Pledges**: Gift with Frequency and NumberOfInstallments
- **Tributes**: Gifts in honor/memory of someone

## Groups (Committees, Chapters, Sections)
```
Group → GroupMember → Party (with Role)
```
- Composite key: `~GroupId|PartyId`
- GroupClass defines the type: Committee, Chapter, Section
- GroupClassSummary lists available classes

## Content / Document System
```
Document (folder) → Document (page) → ContentItem (iParts)
```
- All content is stored in the Document System. Use peripheral working folders such as `@/Shared Content/` for generated/custom content when present; treat `@/iCore/Content/` as system/sample content unless deliberately editing it.
- IQD Documents (the persisted IQA queries) live under the `$/` tree; the exact folder varies per tenant, so resolve a query with `imis_iqa action=surface` or `imis_document action=browse` rather than assuming a fixed path
- Pages composed of iParts (ContentHtml, PanelEditor, etc.)

## Custom Data (Panel Sources)
```
Party → PanelSource/{PanelName} (custom data tables)
```
- Panel Sources are user-defined REST endpoints
- Access via `imis_panel_records` tool
- PanelDefinition describes the layout

## Certification / Professional Development
```
CertificationProgram → CertificationProgramComponent → CertificationProgramRegistration → Party
ExperienceOffering → ExperienceUnit → Party
```
- Programs define requirements via components (courses, exams, credits)
- Registrations link members to programs (enrolment)
- ExperienceUnits track CPD/CPE credits earned for activities

## Auto-Pay / Recurring Payments
```
Party → AutoPayAccount → AutoPayInstruction → ScheduledPayment
GatewayAccount → AutoPayAccount
```
- AutoPayAccount stores the payment method on file
- AutoPayInstruction defines what gets paid and when
- ScheduledPayment tracks future-dated payments
- PartyPledgeScheduledPayment handles pledge-specific schedules

## Payment Gateways
```
GatewayAccount → PaymentMethod → PaymentMethodSet
```
- GatewayAccount configures Stripe, PayPal, etc.
- PaymentMethod defines accepted payment types (CC, ACH, Direct Debit)
- PaymentMethodSet groups payment methods together

## User Security
```
Party → UserSecurity (login credentials)
Party → MembershipLogin (legacy)
```
- UserSecurity controls login access — no update, only create/delete
- To reset credentials: delete then recreate

## UK / Gift Aid
```
Party → PanelSource/GiftAid (declaration data)
GiftInformationBatch → HMRC Gift Aid claim
LegacyVatRule → LegacyVatRuleSet
```
- Gift Aid declarations stored in panel sources (GiftAid, Gift_Aid, or GIFT_AID)
- UK tax year: 6 April – 5 April
- Gift Aid reclaim = 25% of eligible donation amount

## Data Quality
```
Party → PartyDuplicate (flagged duplicates)
OrganizationMerge (uses _execute to merge)
```
- PartyDuplicate stores system-identified duplicate pairs
- OrganizationMerge merges duplicates — irreversible

## Communications / Campaigns
```
Campaign → Appeal → Solicitation
SourceCode (tracks marketing channel)
Party → Communication (history)
NotificationSet (automated triggers)
```

## Bulk Import
```
ImportFileType → ImportBatch → ImportBatchLog
ImportBatchSummary (overview)
```

## Engagement
```
Party → EngagementScore
```
- Quantifies member involvement across activities, events, giving, groups

## Lookup Tables
```
GenTable (TableName + Code = picklist entry)
```
- Every dropdown in iMIS is driven by a GenTable
- Common tables: PREFIX, SUFFIX, MEMBER_TYPE, STATE_CODES, COUNTRY
- The Settings>Contacts>Activity types grid is NOT a GenTable — it is the **LegacyActivityType** catalog owned by `imis_contact_activity`; the GenTable `ACTIVITY_TYPE` is empty on live tenants and does not drive that grid

---

## Member Lifecycle

```
Prospect → New Member → Active → Grace Period → Lapsed → Reinstated / Cancelled
```

| State | Condition | Notes |
|-------|-----------|-------|
| **Prospect** | Party exists, no Subscription | Contact record without membership |
| **New Member** | Subscription just created | PaidThrough in the future, join date recent |
| **Active** | `Subscription.PaidThrough > today` | Current, dues-paying member |
| **Grace Period** | PaidThrough recently passed (within org-defined grace window, typically 30-90 days) | Still has access, renewal invoiced |
| **Lapsed** | PaidThrough < today, beyond grace | Lost access, needs renewal or reinstatement |
| **Reinstated** | Previously lapsed, new or extended Subscription | Within grace = extend PaidThrough; beyond grace = new Subscription |
| **Cancelled** | Subscription explicitly cancelled | Voluntary resignation or admin cancellation |

Key transitions:
- **Renewal**: PaidThrough extended → stays Active
- **Upgrade/Downgrade**: ItemId changed on Subscription → different membership tier
- **Chapter transfer**: Old chapter Subscription cancelled, new chapter Subscription created

## Event Lifecycle

```
Draft → Active → Full → Closed → Cancelled
```

| State | Condition | Notes |
|-------|-----------|-------|
| **Draft** | Event created, Status = Draft | Not visible to public, configuration in progress |
| **Active** | Status = A (Active) | Open for registration |
| **Full** | Registration count >= Capacity | Waitlist may be enabled |
| **Closed** | Status = Closed or End Date passed | No new registrations |
| **Cancelled** | Status = Cancelled | Event will not take place |

Registration states:
- **Confirmed**: Registered and confirmed
- **Waitlisted**: Capacity full, on waiting list — promote when spot opens
- **Cancelled**: Registration cancelled by attendee or admin
- **Transferred**: Moved to a different event (cancel old + register new)
