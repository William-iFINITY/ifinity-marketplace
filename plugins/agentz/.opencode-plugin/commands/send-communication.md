---
description: "Send a communication to a member — select recipient, compose or choose template, send, and log"
---

# Send Communication

Send an email or log a communication to a member in iMIS.

## Step 1: Find the Recipient

Use `imis_find_member` with the name, email, or ID from $ARGUMENTS.
If multiple matches, present them and ask which one.

Verify they have an email address on file.

## Step 2: Compose the Message

Ask the user for:
- **Subject**: Email subject line
- **Body**: Message content (HTML supported)
- **Purpose**: What type of communication (e.g., renewal reminder, welcome, follow-up)

## Step 3: Send

Use `imis_communication_message_submit`:
```
imis_communication_message_submit partyId="<party-id>" subject="<subject>" body="<body>"
```

## Step 4: Log the Interaction

Record the communication as an activity:
```
imis_contact_activity action=preview_log partyId="<party-id>" activityType="EMAIL" subject="<subject>" note="Email sent via Claude"
```

## Step 5: Confirm

Present:
- Recipient name and email
- Subject and summary of content
- Confirmation that it was sent and logged
- Any communication history context (recent emails sent to this member)
