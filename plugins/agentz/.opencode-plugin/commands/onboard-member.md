---
description: "Create a new member in iMIS — set up contact, add membership, assign groups, send welcome email"
---

# New Member Onboarding

Guide the user through creating a new member in iMIS with all required setup.

## Step 1: Gather Information

Ask for (if not provided via $ARGUMENTS):
- **First name** and **Last name** (required)
- **Email address** (required)
- **Organization** (optional)
- **Membership type** — list available types with `imis_entity action=list` on `Item` filtered to membership products, or check `imis_lookup_configuration action=list_values` with tableName "MEMBER_TYPE"

## Step 2: Check for Duplicates

Before creating, search for existing contacts:
```
imis_find_member with the email address
imis_search on Party with FirstName + LastName
```
If duplicates found, present them and ask the user whether to proceed or use an existing record.

## Step 3: Create the Contact

Use `imis_entity action=create` with entityType "Party":
- Set `$type` to `"Asi.Soa.Core.DataContracts.PersonData, Asi.Contracts"` for individuals
- Include PersonName.FirstName, PersonName.LastName
- Include Email if provided
- Include PrimaryOrganization if provided

Confirm the created PartyId.

## Step 4: Add Membership Subscription

Use `imis_manage_subscription` with:
- `action: "create"`
- `partyId` from Step 3
- `itemId` for the chosen membership type

## Step 5: Assign to Groups (if applicable)

Ask if the member should be added to any chapters or committees.
Use `imis_group_membership` with `action: "preview_add_member"` for each group.

If location-based chapter assignment is standard, suggest the appropriate chapter.

## Step 6: Send Welcome Email

Use `imis_communication_message_submit` with:
- `to`: the member's email
- `subject`: Welcome message
- `body`: Include membership details, next steps, and any login instructions

## Step 7: Verify

Use `imis_find_member` with the new PartyId to confirm everything is set up correctly. Use `imis_billing_summary` to verify the subscription was created.

Present a summary:
- Contact created (ID, name, email)
- Membership type and billing dates
- Group assignments
- Welcome email sent
