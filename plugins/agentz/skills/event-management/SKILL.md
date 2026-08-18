---
name: event-management
description: >-
  Manage iMIS events — create events, register attendees, cancel or transfer
  registrations, check capacity, handle waitlists, track attendance, and
  report on event revenue. This skill should be used when the user says
  "register someone for an event", "cancel registration", "create an event",
  "check capacity", "waitlist", "transfer registration", "event attendance",
  "event revenue", "bulk register", "who's registered", "event details",
  "list attendees", "check registration", "how many spots left",
  "create a session", or when working with events, conferences, or meetings.
argument-hint: "[event-id-or-name] [action: register|cancel|create|capacity|waitlist|transfer|attendance|revenue|bulk-register|list|details|sessions]"
---

# Event Management — Full Lifecycle

Manage the complete event lifecycle in iMIS: creation, registration, capacity, waitlists, transfers, attendance tracking, and revenue reporting.

Boundary: event-management reads event totals only. For revenue/attendance analytics run an existing IQA through run-query or design one in iqa-query-design; for invoice, refund, or payment work use billing-management.

For a reusable export with one row per event registration plus all program titles and all question responses, use `iqa-query-design` and the `eventRegistrationTextFolding` recipe from `imis_iqd_query action="capabilities"`. This is a supported IQD shape. Do not split it into three exports, fail on duplicate registration rows, or route it to multi-dataset SSRS only because a bare calculated `SELECT` once failed. Programs stay order-specific. Responses are event-participant data and repeat on matching duplicate rows with `ResponseScope=event-participant`.

## Canonical event tools

Route **writes** through the **guarded** event tools — they enforce preview → confirm → readback and carry proof packets:

- `imis_manage_event_setup` — create/clone/update events (`action=preview_create_from_design` → `create_from_design`, `preview_clone` → `clone`, `preview_update` → `update`).
- `imis_manage_event_registration` — three actions have a REST write: `action=preview_register` → `register`, `preview_cancel` → `cancel`, and `preview_check_in` → `check_in` (each `preview_*` returns a `confirmationText` you pass to the matching write). Three actions are **preview/planning only** with no REST submit — `preview_transfer`, `preview_change_registration`, `preview_waitlist_promotion` — because their native cart/Complete-Registration legs are not exposed over REST; complete the plan in the native Staff UI.
- `imis_manage_event_resources` — event resources and resource types.
- `imis_event_360` — consolidated read of one event (functions, registration options, add-on fees).

`imis_register_for_event` is the **lightweight guarded** registration tool (`action=preview` → `action=submit` with the returned `confirmationText`); `imis_manage_event_registration` is the fuller lifecycle surface (cancel/transfer/check-in/waitlist). Raw `imis_entity` Event/EventRegistration **reads** are fine for capacity counts and roster lists (some have no purpose-built read), but don't use `imis_entity action=create/update` for event writes that a tool above covers.

---

## Step 1: Find the Event

If an event ID is provided in $ARGUMENTS, use `imis_entity action=get entityType="Event" id={id}`.
Otherwise, search with `imis_entity action=list` Event or `imis_search` Event to find matching events.

Show: EventId, Name, Status, Start/End dates, Location, Capacity. A newly created event defaults to Status 'P'; read the current status back via `imis_event_360` and change it with `imis_manage_event_setup action=preview_update` → `update`.

For an overview of all events: `imis_entity action=list` EventSummary.

---

## Actions

### Create a New Event

Set up a new event in iMIS.

1. **Gather details** from the user:
   - Name (required)
   - EventId / code (required — typically short uppercase, e.g., "CONF2025")
   - Start and End dates
   - Location / venue
   - Capacity (max attendees)
   - Description
   - Category (check available: `imis_entity action=list` EventCategory)

2. **Create the event** (guarded): `imis_manage_event_setup action=preview_create_from_design` with the event design (returns a `confirmationText`), then `imis_manage_event_setup action=create_from_design` passing that exact text. To copy an existing event instead, use `action=preview_clone` → `clone`. Pass the design as `eventDesignJson`:
   ```json
   eventDesignJson='{
     "eventCode": "CONF2025",
     "name": "Annual Conference 2025",
     "startDateTime": "2025-09-15T09:00:00",
     "endDateTime": "2025-09-17T17:00:00",
     "location": { "name": "Convention Centre" },
     "capacity": 500,
     "description": "Our flagship annual event"
   }'
   ```
   Note: a shell created without `registrationOptions` coerces to RegistrationNotRequired. To create a registration-capable event, pass a `templateEventId` (or use `preview_clone` on an existing registration-capable event).

3. **Set up pricing** (optional): Create ItemPrice records for the event
   - `imis_item_catalog_setup action=preview_create entity=ItemPrice payloadObject={...}` then `action=create` with the exact returned `confirmationText`; include ItemId={eventId} and the intended pricing tier fields

4. **Create sessions/functions** (optional): functions come from a registration-capable template. Create the event with `imis_manage_event_setup action=preview_create_from_design templateEventId=...` → `create_from_design` (or `preview_clone` → `clone`) rather than authoring raw EventFunction rows.

5. **Verify**: `imis_event_360 eventId={newId}` (or `imis_entity action=get entityType="Event" id={newId}`) to confirm creation

---

### Register an Attendee

1. **Find the contact**: `imis_find_member` with name, email, or ID
2. **Check capacity first**: `imis_entity action=get entityType="Event" id={eventId}` — read Capacity field, then count active registrations by listing `EventRegistrationSummary` with an EventId filter (`imis_entity action=list entityType=EventRegistrationSummary filter="EventId={eventId}"`; get is by composite `EventId~PartyId`), or by running an Event Registrants IQA via `imis_query` (or the `EventRegistrantsReport`). If at capacity, offer waitlist (see Waitlist Handling below).
3. **Check for existing registration**: `imis_entity action=get entityType="EventRegistration" id="{EventId}~{PartyId}"`
   - If already registered, inform the user (don't create a duplicate)
4. **Register** (guarded): either `imis_register_for_event action=preview` → `action=submit` with the returned `confirmationText`, or the fuller `imis_manage_event_registration action=preview_register` → `register`. eventId={eventId} partyId={partyId}.
5. **Confirm**: Verify registration was created successfully
6. **Report**: Show remaining capacity after registration

---

### Cancel a Registration

1. **Find the registration**: `imis_entity action=get entityType="EventRegistration" id="{EventId}~{PartyId}"`
2. **Confirm**: Show registration details to the user and ask to confirm cancellation
3. **Cancel** (guarded): `imis_manage_event_registration action=preview_cancel` eventId={eventId} partyId={partyId} (returns `confirmationText`), then `action=cancel` with that exact text
4. **Log a contact interaction** (gated): `imis_contact_activity action=preview_log partyId={partyId} description="Event registration cancelled for {eventName}"` (optionally `details=...` and an `interactionTypeCode` resolved via `action=list_types`), then `action=log` with the returned exact `confirmationText`.
5. **Check waitlist**: If there are waitlisted registrations for this event, offer to promote the next person in line (see Waitlist Handling)
6. **Financial note**: If the member has already paid, process the refund/reversal with the gated tools (`imis_payment_adjustments` reverse, `imis_refund_returned_order_payment`, or `imis_return_order_invoice`); only a credit memo with no tool lane needs the iMIS staff site

---

### Check Capacity / Spots Remaining

1. **Get event**: `imis_entity action=get entityType="Event" id={eventId}` — read Capacity field
2. **Count registrations**: run an Event Registrants IQA via `imis_query` (or the `EventRegistrantsReport`) and count active (non-cancelled) registrations. or list `EventRegistrationSummary` directly with an EventId filter (`imis_entity action=list entityType=EventRegistrationSummary filter="EventId={eventId}"`; get is by composite `EventId~PartyId`).
3. **Calculate**: Remaining = Capacity - Active Registrations
4. **Present**:
   - Total capacity: X
   - Currently registered: Y
   - Spots remaining: Z
   - Status: "Open" / "Nearly full" (< 10%) / "Full" / "Waitlist active"

---

### Waitlist Handling

When an event is at capacity:

**Adding to waitlist:**
1. Inform the user the event is full
2. Offer to add the person to the waitlist
3. Register to the waitlist: `imis_register_for_event action=preview waitlist=true` → `action=submit` with the returned `confirmationText`
4. Log a contact interaction (gated): `imis_contact_activity action=preview_log partyId={partyId} description="Added to waitlist for {eventName}"` → `action=log` with the returned exact `confirmationText`
5. Tell the user their position (count of existing waitlisted registrations + 1)

**Promoting from waitlist (when a spot opens):**
1. List waitlisted registrations by running an Event Registrants IQA via `imis_query` (or the `EventRegistrantsReport`) and filtering for waitlisted status — or list `EventRegistrationSummary` directly with an EventId filter (`imis_entity action=list entityType=EventRegistrationSummary filter="EventId={eventId}"`; get is by composite `EventId~PartyId`)
2. Identify the next person (earliest registration date)
3. Plan the promotion: `imis_manage_event_registration action=preview_waitlist_promotion` eventId={eventId} partyId={partyId} — this is preview/planning only (no REST submit); complete the promotion in the native Staff UI
4. Notify: `imis_communication_message_submit` to the member that their spot has been confirmed
5. Log a contact interaction (gated) for the promoted member: `imis_contact_activity action=preview_log partyId={partyId} description="Promoted from waitlist for {eventName}"` → `action=log` with the returned exact `confirmationText`

---

### Transfer / Substitute a Registration

`imis_manage_event_registration action=preview_transfer` **plans** a same-event attendee substitution — moving one event's registration from `sourcePartyId` to `targetPartyId` (e.g. a colleague attending in place of the original registrant). It is **preview/planning only**: there is no `transfer` submit action, because the native cart / Complete Registration legs are not exposed over REST. The plan must be completed in the native Staff UI. It does not move a registration between two different events.

**Same-event substitution:**

1. **Find current registration**: `imis_entity action=get entityType="EventRegistration" id="{EventId}~{sourcePartyId}"`
2. **Plan the substitution**: `imis_manage_event_registration action=preview_transfer` eventId={EventId} sourcePartyId={sourcePartyId} targetPartyId={targetPartyId} — returns the planned swap.
3. **Complete it natively**: apply the planned substitution in the iMIS Staff UI; there is no REST submit for transfer.

**Moving someone to a different event** is a cross-event operation, not a transfer: run a guarded `preview_cancel` → `cancel` on the old event, then a guarded `preview_register` → `register` on the new one.

3. **Log a contact interaction** (gated): `imis_contact_activity action=preview_log partyId={PartyId} description="Registration substituted/moved for {eventName}"` → `action=log` with the returned exact `confirmationText`.
4. **Financial note**: If pricing differs between events, advise on invoice adjustments (handled in iMIS staff site)

---

### Post-Event Attendance Tracking

Record who actually attended after the event has occurred.

1. **List registrations**: run an Event Registrants IQA via `imis_query` (or the `EventRegistrantsReport`) to get all registrants — or list `EventRegistrationSummary` directly with an EventId filter (`imis_entity action=list entityType=EventRegistrationSummary filter="EventId={eventId}"`; get is by composite `EventId~PartyId`)
2. **Check attendance records**: `imis_entity action=list` LegacyEventFunctionAttendance with appropriate event filters
3. **Update attendance**: For each attendee, use `imis_manage_event_registration action=preview_check_in` then `action=check_in` with the exact returned `confirmationText`; supply the attendance row/function and `creditUnitsEarned` required by the event
4. **Summarize**:
   - Total registered: X
   - Attended: Y
   - No-shows: Z
   - Attendance rate: Y/X as percentage
5. **Log a contact interaction** (gated): `imis_contact_activity action=preview_log partyId={partyId} description="Event attendance recorded for {eventName}"` → `action=log` with the returned exact `confirmationText`

Note: Read LegacyEventFunctionAttendance directly when needed, but keep attendance writes in the guarded check-in owner so row resolution and readback are verified.

---

### Event Revenue / Financial Report

Analyse the financial performance of an event.

1. **Event details**: `imis_entity action=get entityType="Event" id={eventId}` — name, dates, capacity
2. **Pricing**: `imis_entity action=list` ItemPrice with filter `ItemId={eventId}` — registration fee tiers
3. **Registrations**: run an Event Registrants IQA via `imis_query` (or the `EventRegistrantsReport`) — count by type; or list `EventRegistrationSummary` directly with an EventId filter (`imis_entity action=list entityType=EventRegistrationSummary filter="EventId={eventId}"`; get is by composite `EventId~PartyId`)
4. **Invoices**: `imis_entity action=list` InvoiceSummary — filter by event-related items to get billed amounts
5. **Payments**: Cross-reference with PaymentSummary for collected revenue
6. **Alternative**: Use `imis_query` with a revenue-focused IQA query if one exists (check `imis_document action=browse` path `$/Common/Queries/Events/`)

**Present**:
- Total registrations and breakdown by type (early bird, regular, VIP, etc.)
- Expected revenue (registrations x price per tier)
- Invoiced amount (from InvoiceSummary)
- Collected amount (from PaymentSummary)
- Outstanding balance (invoiced - collected)
- Revenue per registrant
- Capacity utilisation percentage

---

### Bulk Registration for Multiple People

Register several people for the same event at once.

1. **Confirm event**: Verify the event ID and that it has sufficient capacity
2. **Get the list**: Ask the user for the list of people (names, emails, or IDs)
3. **For each person**:
   a. Find or verify: `imis_find_member` with their name/email/ID
   b. Check existing: `imis_entity action=get entityType="EventRegistration" id="{EventId}~{PartyId}"` (skip if already registered)
   c. Check capacity: Verify spots remaining
   d. Register: `imis_register_for_event action=preview` then `action=submit` with the returned `confirmationText`, eventId={eventId} partyId={partyId}
4. **Present summary table**:
   - Name | Status (Registered / Already Registered / Failed / Waitlisted)
   - Total successful registrations
   - Remaining capacity after all registrations

---

### List Registrations

Run an Event Registrants IQA via `imis_query` (or the `EventRegistrantsReport`) for the event.

Present a table of registrants:
- Name, Party ID, Registration Date, Status, Sessions/Functions

Note: `EventRegistrationSummary` lists the event roster through `imis_entity` with an EventId filter (`imis_entity action=list entityType=EventRegistrationSummary filter="EventId={eventId}"`; it requires that filter and gets by composite `EventId~PartyId`). An Event Registrants IQA / `EventRegistrantsReport` is the alternative when you need richer columns or status filtering.

---

### Event Details

Use `imis_entity action=get entityType="Event" id={id}` for the full event record:
- Name, description, dates (start/end), location
- Status (a newly created event defaults to 'P'; read back via `imis_event_360`, change via `imis_manage_event_setup action=preview_update` → `update`)
- Capacity and current registration count
- Pricing: `imis_entity action=list` ItemPrice with filter `ItemId={eventId}`

---

### Sessions / Functions

EventFunction entities represent sessions, tracks, or breakout rooms within an event.

- Read the functions from their parent event — `imis_event_360 eventId={id}` (functions section), or the `Functions` collection on the Event read via `imis_entity action=get entityType="Event" id={id}`. There is no useful global EventFunction list, and you should not read EventFunction rows directly by id.
- To make an event registration-capable (with functions), create it from a template: `imis_manage_event_setup action=preview_create_from_design templateEventId=...` → `create_from_design` (or `preview_clone` → `clone` an existing registration-capable event).

---

## Step 2: Summarize

Present results clearly:
- Event details with dates, location, and status
- Registration confirmation or action taken
- Capacity: X of Y spots filled (Z remaining)
- Waitlist status if applicable
- Financial impact if applicable (amount invoiced)
- Any issues encountered (full event, duplicate registration, API limitations)
- Next steps or follow-up actions needed
