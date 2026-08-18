# iMIS Glossary

| Common Term | iMIS Term | Entity | Notes |
|-------------|-----------|--------|-------|
| Contact/Person | **Party** | `Party` | Fundamental entity. `$type` polymorphism: `PersonData` for individuals, `InstitutionData` for organizations |
| Organization | **Organization** | `Organization` | A Party with `$type` = InstitutionData |
| Member | **Party** + active **Subscription** | `Party` + `Subscription` | Membership determined by active Subscriptions (PaidThrough > today), not a flag |
| Member Type | **Customer Type** | On Subscription | Controls billing rates, chapter assignments, product eligibility |
| Membership dues | **Subscription** | `Subscription` | Billing record tying Party to product. Composite key: `PartyId~ItemId` |
| Committee/Chapter | **Group** | `Group` | `GroupClass` defines type (Committee, Chapter, Section). Members via `GroupMember` |
| Committee Member | **GroupMember** | `GroupMember` | Composite key: `~GroupId|PartyId` |
| Product | **Item** | `Item` | Dues, events, merchandise, publications |
| Custom fields | **Panel Source** | `/{PanelSourceName}` | User-defined data tables as REST endpoints |
| Report/Query | **IQA Query** | `/api/IQA?QueryName=$/path` | Primary reporting/analytics tool |
| Invoice | **InvoiceSummary** | `InvoiceSummary` | What a member owes |
| Payment | **PaymentSummary** | `PaymentSummary` | CC payments CANNOT go via API |
| Donation/Gift | **GiftInformationBatch** | `GiftInformationBatch` | Donor, amount, campaign |
| Pledge | **Pledge** | `GiftInformationBatch` | Gift with installment schedule |
| Event Session | **EventFunction** | `EventFunction` | Cannot be listed separately |
| Registration | **EventRegistration** | `EventRegistration` | `_execute` to create. Key: `EventId~PartyId` |
| Activity/Note | **ContactInteraction** | `ContactInteraction` | The logged interaction row (calls, emails, meetings). Its type comes from one of two catalogs, both read/written via `imis_contact_activity`: **LegacyActivityType** (the native Settings>Contacts>Activity types grid) and **InteractionType** (the modern interaction classification). When a user says "activity type" disambiguate which of these two they mean — the GenTable `ACTIVITY_TYPE` does not drive that grid. |
| Financial Book | **Financial Entity** | On payments/invoices | Separate accounting books |
| Content Page | **Document** | `Document` | In the Document System. Types: CON, CFL, FOL, IQD |
| Folder | **Document** (folder) | `Document` | `IsFolder: true`. Types: FOL (generic), CFL (content) |
| iPart/Widget | **ContentItem** | `ContentItem` | Building blocks of pages: ContentHtml, PanelEditor, QueryMenuContentItem |
| Dropdown values | **GenTable** | `GenTable` | General lookup tables. Key: `~TableName|Code` |
| Certification | **CertificationProgram** | `CertificationProgram` | Professional development programs with component requirements |
| CPD/CPE credits | **ExperienceUnit** | `ExperienceUnit` | Continuing Professional Development / Education credits logged against offerings |
| Auto-pay | **AutoPayInstruction** | `AutoPayInstruction` | Automatic payment rules (what gets paid, when, how) |
| Payment on file | **AutoPayAccount** | `AutoPayAccount` | Stored payment method for recurring billing |
| Scheduled payment | **ScheduledPayment** | `ScheduledPayment` | Future-dated payment queued for processing |
| Gateway | **GatewayAccount** | `GatewayAccount` | Payment processor config (Stripe, PayPal, etc.) |
| Login credentials | **UserSecurity** | `UserSecurity` | Username/password for iMIS login. No update — delete and recreate |
| Gift Aid | **Panel Source** | Custom panel | UK charity tax reclaim declaration. 25% of qualifying donations |
| VAT rule | **LegacyVatRule** | `LegacyVatRule` | UK/EU value-added tax configuration |
| Import batch | **ImportBatch** | `ImportBatch` | Bulk data import job with status tracking |
| Duplicate | **PartyDuplicate** | `PartyDuplicate` | System-flagged potential duplicate contacts |
| Merge | **OrganizationMerge** | `OrganizationMerge` | Merge duplicate orgs via `_execute`. Irreversible |
| Engagement score | **EngagementScore** | `EngagementScore` | Quantified member involvement metric |
| Campaign | **Campaign** | `Campaign` | Fundraising or marketing initiative |
| Appeal | **Appeal** | `Appeal` | Sub-segment within a campaign |
| Source code | **SourceCode** | `SourceCode` | Marketing channel tracking |
| Form | **FormDefinition** | `FormDefinition` | Survey, application, or feedback form structure |
| Form submission | **FormResponse** | `FormResponse` | Individual form response/submission |
| Notification | **NotificationSet** | `NotificationSet` | Automated email trigger configuration |
| Task log | **TaskActionLog** | `TaskActionLog` | Automated process execution log |
| Media asset | **MediaAsset** | `MediaAsset` | Publication or advertising venue |
