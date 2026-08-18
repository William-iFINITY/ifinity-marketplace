---
name: uk-localisation
description: >-
  UK-specific iMIS features — Gift Aid, VAT, UK Direct Debit, and HMRC
  compliance. This skill should be used when the user says "Gift Aid", "HMRC",
  "VAT", "Direct Debit", "UK tax", "UK charity", "Gift Aid declaration",
  "HMRC claim", "VAT rules", "BACS", "UK donations", "tax reclaim",
  "25% reclaim", or when working with UK charity regulations, tax compliance,
  or UK payment methods. Do Gift Aid, VAT, and Direct Debit configuration
  checks here; posting the gift itself goes to fundraising and payment
  gateway setup goes to billing / system-configuration.
argument-hint: "[donor-name-or-id] [action: check|declare|claim|vat]"
---

# UK Localisation — Gift Aid, VAT & Direct Debit

Manage UK-specific iMIS functionality including Gift Aid declarations, HMRC claim preparation, VAT rules, and UK Direct Debit mandates.

## Key Concepts

### Gift Aid
- UK charities can reclaim **25% tax** on donations from UK taxpayers
- Requires a valid **Gift Aid declaration** from the donor
- Claims submitted to **HMRC** — iMIS prepares the data, submission is external
- UK tax year runs **6 April to 5 April** (not calendar year)

### VAT
- UK and EU organisations must charge VAT on certain products and services
- Membership subscriptions may have **partial VAT exemption** for nonprofits
- **LegacyVatRule** and **LegacyVatRuleSet** entities manage VAT configuration

### UK Direct Debit
- BACS Direct Debit allows recurring collections from UK bank accounts
- In iMIS, collected through whichever payment gateway the tenant has configured for Direct Debit — the gateway provider varies by tenant
- **GatewayAccount** + **AutoPayAccount** + **AutoPayInstruction**
- `imis_uk_direct_debit` reads iMIS configuration state only; it does not perform a live BACS/gateway mandate check

## Actions

### Check Gift Aid Declaration
```
imis_gift_aid partyId="12345" action="declaration_check"
```
Auto-detects the Gift Aid panel source (tries GiftAid, Gift_Aid, GIFT_AID).

### Create Gift Aid Declaration
```
imis_gift_aid partyId="12345" action="declaration_create" declarationDate="2025-01-15" declarationType="written"
```

### Preview HMRC Claim
```
imis_gift_aid action="claim_preview" taxYear="2025"
```
Calculates total eligible donations and 25% reclaim for the 2024/25 tax year.

### List Gift Aid Eligible Donations
```
imis_gift_aid action="claim_list" taxYear="2025"
```

### View VAT Rules
```
imis_accounting_configuration_profile action="inventory"
imis_accounting_configuration_setup action="list" entity="LegacyVatRule"
imis_accounting_configuration_setup action="list" entity="LegacyVatRuleSet"
imis_accounting_configuration_setup action="get" entity="LegacyVatRule" id="<vat-rule-guid>"
```
`imis_accounting_configuration_profile action=inventory` reads VAT posture; `imis_accounting_configuration_setup` (gated create/update/delete) writes VAT rules.

### Check Direct Debit Mandate
```
imis_uk_direct_debit partyId="12345"
```
Cross-references the tenant's configured gateway accounts with the member's auto-pay configuration (iMIS config state only; no live BACS/gateway mandate check).

## Gift Aid Workflow

1. **Find the donor**: `imis_find_member`
2. **Check existing declaration**: `imis_gift_aid` action="declaration_check"
3. **Create declaration if needed**: `imis_gift_aid` action="declaration_create"
4. **Preview claim**: `imis_gift_aid` action="claim_preview" for the relevant tax year

## Important Notes

- Gift Aid declarations may be stored in different panel sources depending on the iMIS instance configuration
- The tool auto-detects common panel names; specify `panelSource` if using a custom name
- HMRC claims must be submitted through HMRC Online or Charities Online — iMIS prepares the data only
- VAT rules use the "Legacy" prefix in iMIS entity names but are the current implementation
