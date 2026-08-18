---
name: certification-management
description: >-
  Manage certification programs, CPD/CPE credits, and professional development in
  iMIS. This skill should be used when the user says "certification", "CPD",
  "CPE", "continuing education", "credits", "professional development",
  "enrol in program", "certification progress", "log experience", "CEU",
  "continuing professional development", or when working with certification
  programs, enrolments, or experience units. This skill records ExperienceUnit
  and program registration directly; there is no automatic event-to-credit
  posting, so event registration and attendance belong to event-management.
argument-hint: "[member-name-or-id] [program-name]"
---

# Certification & Professional Development Management

Manage certification programs, enrolments, CPD/CPE credit tracking, and experience logging in iMIS.

## Key Concepts

- **CertificationProgram**: Defines a certification with requirements (components)
- **CertificationProgramComponent**: Individual requirements within a program (courses, exams, credits)
- **CertificationProgramRegistration**: Links a member to a program (enrolment)
- **ExperienceUnit**: A record of CPD/CPE credits earned for an activity
- **Experience offering**: There is no `ExperienceOffering` entity — the offering is `offeringId` (`ExperienceOfferingId`) carried on an `ExperienceUnit`

## Write gate

Every write is two-step: `preview_*` then `create_*` with the **verbatim** `confirmationText` the preview returned. The post-write readback confirms the row was written — it is **not** proof of a rendered transcript, an awarded credential, an expiry change, or any event-to-credit posting; verify those separately.

## Step 1: Understand the Request

Determine what the user needs:
- **Check programs**: List available certification programs → `imis_certification_program_catalog` with action "list"
- **Program details**: Get a specific program and its components → `imis_certification_program_catalog` with action "get"
- **Enrol member**: Register a member in a program → `imis_certification_transcript_records` (`preview_enrollment` → `create_enrollment`)
- **Check progress**: See what a member has completed → `imis_certification_transcript_profile`
- **Log credits**: Record CPD/CPE units earned → `imis_certification_transcript_records` (`preview_experience_unit` → `create_experience_unit`)
- **Program/component/group/location definitions and bulk/non-Party registration or experience-unit setup fixes**: use `imis_certification_setup` (CertificationProgramSummary and ExperienceGrade are read-only); **a single member's enrolment or experience-unit rows**: use `imis_certification_transcript_records` — it adds Party/program preview context and transcript readback

## Step 2: Find the Member (if needed)

If the user references a member by name or email, use `imis_find_member` first to get their Party ID.

## Step 3: Execute

### List/Search Programs
```
imis_certification_program_catalog action="list"
imis_certification_program_catalog action="search" search="Project Management"
```

### Get Program Details (includes components/requirements)
```
imis_certification_program_catalog action="get" programId="PMP-2024"
```

### Enrol a Member
1. Check if already enrolled: `imis_certification_transcript_profile` partyId={id} programId={programId}
2. If not enrolled, two-step gated:
```
imis_certification_transcript_records action=preview_enrollment partyId={id} programId={programId}
imis_certification_transcript_records action=create_enrollment  partyId={id} programId={programId} confirmationText="<exact text from preview>"
```

### Check Progress
```
imis_certification_transcript_profile partyId="12345"
imis_certification_transcript_profile partyId="12345" programId="PMP-2024"
```

### Log CPD/CPE Credits
```
imis_certification_transcript_records action=preview_experience_unit partyId="12345" offeringId="COURSE-101" units=5.0
imis_certification_transcript_records action=create_experience_unit  partyId="12345" offeringId="COURSE-101" units=5.0 confirmationText="CREATE EXPERIENCE UNIT ..."
```
`offeringId` maps to `ExperienceUnit.ExperienceOfferingId` (there is no `ExperienceOffering` entity).

## Step 4: Summarise

Present results clearly:
- For programs: Name, status, number of components, requirements
- For enrolments: Program name, enrolment date, components completed vs total
- For credits: Units logged, offering name, date, running total
