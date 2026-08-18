---
description: "Enrol a member in a certification program — find member, select program, check prerequisites, enrol"
---

# Enrol Member in Certification Program

Follow these steps to enrol a member in a certification program in iMIS.

## Step 1: Find the Member

Use `imis_find_member` with the name, email, or ID from $ARGUMENTS.
If multiple matches, present them and ask which one.

## Step 2: Select the Program

If a program name is provided in $ARGUMENTS, search for it:
```
imis_certification_program_catalog action="search" search="<program-name>"
```

Otherwise, list available programs:
```
imis_certification_program_catalog action="list"
```

Present the programs and ask the user to select one.

## Step 3: Check Prerequisites

Get program details and components:
```
imis_certification_program_catalog action="get" programId="<selected-program-id>"
```

Check if the member is already enrolled:
```
imis_certification_transcript_profile partyId="<party-id>" programId="<program-id>"
```

If already enrolled, inform the user and show current progress instead.

## Step 4: Enrol

Enrollment requires a two-step guarded flow — preview first, then create using the exact confirmation from the preview:
```
imis_certification_transcript_records action="preview_enrollment" partyId="<party-id>" programId="<program-id>"
```

Review the preview details, then submit:
```
imis_certification_transcript_records action="create_enrollment" partyId="<party-id>" programId="<program-id>" confirmation="<confirmation-text-from-preview>"
```

## Step 5: Confirm

Present:
- Member name and ID
- Program name and requirements
- Enrolment date
- Next steps (what components need completing)
