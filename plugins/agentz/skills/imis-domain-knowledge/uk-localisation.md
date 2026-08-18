# UK Localisation — iMIS for UK Charities & Associations

## Gift Aid

Gift Aid allows UK charities to reclaim **25% basic rate tax** on donations from UK taxpayers.

### Rules
- Donor must be a **UK taxpayer** (pays enough Income Tax or Capital Gains Tax to cover the Gift Aid amount)
- Donor must make a **Gift Aid declaration** (written, oral, or online)
- Declaration can cover past donations (up to 4 years back) and all future donations
- Charity reclaims 25p for every £1 donated (calculated as donation × 25%)
- Higher-rate taxpayers can claim the difference on their tax return

### UK Tax Year
- Runs **6 April to 5 April** (not calendar year)
- Example: 2024/25 tax year = 6 April 2024 to 5 April 2025
- Gift Aid claims are submitted per tax year

### HMRC Claims
- Submitted through **HMRC Online** or **Charities Online** (external to iMIS)
- iMIS prepares the data: eligible donors, donation amounts, declaration status
- Claims can be made up to **4 years** after the end of the tax year

### Small Donations Scheme (GASDS)
- Charities can claim Gift Aid-style top-up on cash/contactless donations up to £30
- No declaration needed, £8,000 annual limit per charity

### iMIS Implementation
- Gift Aid declarations stored in **panel sources** (custom data tables)
- Common panel names: `GiftAid`, `Gift_Aid`, `GIFT_AID` (varies by instance)
- The `imis_gift_aid` tool auto-detects the panel name

## VAT (Value Added Tax)

### Key Rules for UK Nonprofits
- **Standard rate**: 20% (most goods and services)
- **Reduced rate**: 5% (some energy supplies, children's car seats)
- **Zero rate**: 0% (most food, children's clothing, books)
- **Exempt**: No VAT charged, no input VAT reclaim (many financial services, education, health)

### Membership Subscriptions
- If the subscription provides **rights and benefits** → standard rated (20%)
- If the subscription is essentially a **donation** with minimal benefits → outside scope of VAT
- Many professional associations charge VAT on subscriptions
- Partial exemption rules may apply

### iMIS VAT Entities
- `LegacyVatRule` — defines VAT rate and application rules
- `LegacyVatRuleSet` — groups VAT rules together
- Applied to products (Items) to calculate VAT on invoices

## UK Direct Debit (BACS)

### How It Works
- Recurring collection from UK bank accounts via the **BACS** (Bankers' Automated Clearing Services) system
- Requires a **Direct Debit mandate** — the payer's authorisation
- Protected by the **Direct Debit Guarantee** (payers can get immediate refunds)
- Popular for recurring membership dues and regular giving

### iMIS Integration via Stripe
- iMIS uses **Stripe** as the payment gateway for UK Direct Debit
- Stripe handles BACS mandate creation and payment collection
- In iMIS: `GatewayAccount` (Stripe) → `AutoPayAccount` → `AutoPayInstruction`
- The `imis_uk_direct_debit` tool cross-references these entities to show mandate status

### Important Notes
- Mandate creation happens **Stripe-side** (not via iMIS API)
- It takes **3–5 business days** for BACS payments to clear
- Failed payments are retried automatically by Stripe
- Credit card data cannot be submitted via the iMIS API (PCI compliance)

## UK Address Handling
- UK postcodes follow the format: `AA9A 9AA`, `A9A 9AA`, `A9 9AA`, `A99 9AA`, `AA9 9AA`, `AA99 9AA`
- iMIS stores addresses in the Party entity with standard fields (Address1, City, StateProvince, PostalCode, CountryCode)
- CountryCode for UK: `GBR` or `GB` (depending on iMIS configuration)
