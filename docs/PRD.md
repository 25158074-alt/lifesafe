# LifeSafe Product Requirements Document

**Status:** Draft for prototype implementation. **Not clinically approved and not ready for real-world emergency use.** The supplied project brief is the source of product intent. Clinical rules, card content, translations, regional numbers, and evaluation labels require qualified review before release.

## Problem and value

People facing an urgent health event may need to contact emergency services, explain what is happening, and find approved first-aid guidance while help is on the way. LifeSafe is intended to make those next steps easier in English, Hindi, Bengali, and Hinglish. It guides and summarizes reported facts; it does not diagnose or replace emergency services.

## Users and roles

The primary user is a person seeking emergency help for themselves or another person, including caregivers of children and infants. A secondary user is an arriving paramedic or clinician who may read a one-page factual handoff. A qualified clinician/first-aid reviewer and qualified language reviewers are required to approve safety content. Any reviewer/admin account must be explicitly authorized and audited; a role model is not assumed to grant clinical authority.

The initial app role is `user`. A future `clinical_reviewer` role may review content but cannot self-approve their own changes. A separate `content_publisher` may activate only fully reviewed versions. These privileged roles and their staffing are approval-dependent and remain disabled until named reviewers are appointed.

## User journeys

1. **Immediate help, no login required:** The user can access a visible local emergency-call action and the general call-first fallback from the entry and login surfaces. For India, display `112` plus the selected state's verified ambulance number (`108` or `102`) as separately configurable contacts. A source check on 2026-11-09 confirmed official national 112, Government of India references to 108/102, and an Odisha state listing, but did not verify a complete state/UT routing database or operational coverage for any selected user. Do not assume every state has completed its transition to `112`; verify each selected state's current routing, service scope, sources and number before treating either as authoritative. Until verified, the app remains a demo and must say so.
2. **Logged-in triage:** The user chooses a language, describes what is happening in English, Hindi, Bengali, or Hinglish, and may optionally use voice input if the feature is separately approved. The model may extract facts into the shared schema only. If a deterministic red flag is already clear, ask no follow-up questions. Otherwise ask at most five targeted questions from a fixed, reviewed bank.
3. **Safe result:** Deterministic red flags force `EMERGENCY_NOW`. A clinically validated classifier may later distinguish `SEE_DOCTOR_SOON` and `SELF_CARE`; until the classifier and its labels are reviewed and validated, the app must not show `SELF_CARE` or imply that no match means safe. Low confidence, conflicting signals, unsupported inputs, missing verified content, and service failures escalate or remain explicitly uncertain with emergency access.
4. **While waiting:** The emergency number is the first actionable element. Show only a matching card whose clinical content, source/version, reviewer and language version all have `verified` status. Otherwise show only the conservative general fallback: contact emergency services, stay with the person if safe, and follow dispatcher instructions. No invented or generated instructions; no medicine/dosage advice unless exact wording is clinician-approved.
5. **Handoff:** Generate a one-page summary from structured user-reported fields only: symptoms, onset, age group, key answers, displayed urgency, and displayed card/version. Do not add diagnoses, inferred facts, or unreported details. Provide clear English plus the selected language.
6. **History and deletion:** If the user explicitly opts into saving a result, they can see only their own records and delete them. Do not persist raw narrative, audio, or model prompts by default. Data retention and consent wording require approval before database writes are enabled.
7. **Crisis support:** Suicidal thoughts/self-harm route to a separate crisis-support response and a verified region-appropriate helpline. The official Tele-MANAS site checked 2026-11-09 publishes `14416` and `1-800 891 4416` and identifies itself as an MoHFW/NHM service page updated 13 May 2026. Hours, eligibility, language coverage and operational reach are not stated in the reviewed page and must be confirmed before launch; a published number is not proof of live availability. See `research/contact-verification-2026-11-09.md`.

## Functional requirements

- Languages: English, Hindi, Bengali, and Hinglish input in Latin script. All user-facing medical translations require qualified native-speaker review before `verified` status.
- Shared, versioned symptom JSON schema with explicit unknowns, age band, onset, language, source/quality/confidence metadata, and provenance. Never store model-inferred facts as user-confirmed facts.
- Red-flag engine covers chest pain with sweating or arm/jaw radiation; difficulty breathing; stroke signs (face droop, arm weakness, speech trouble); heavy/uncontrolled bleeding; seizure; loss of consciousness; fever in infants under 3 months; severe allergic reaction; suspected poisoning; signs of severe dehydration; and suicidal ideation/crisis routing.
- The rule engine overrides every other layer. No LLM, classifier, or gate may downgrade a triggered emergency.
- Fixed question bank; at most five questions; none after a clear red flag. Ask only for unknown structured fields and stop on escalation.
- The LLM (provider not yet selected) may only extract structured facts, select question IDs, and rank existing card IDs. It must never determine urgency or create, edit, shorten, or translate guidance.
- The urgency classifier is not enabled for users until trained/evaluated on clinically reviewed labels and calibration evidence. Compare logistic regression and gradient boosting as specified by the brief.
- Safety gate may only raise urgency when confidence is low or signals conflict.
- Curated, versioned card library must cover all 23 conditions enumerated in the brief, with adult/child/infant variants where guidance differs. Only `verified` clinical and language versions can be served.
- First-aid source policy: use the specified AHA 2025, ERC 2025 (including First Aid), IFRC 2025, and Indian 2017 CPR guideline editions. Do not use older editions of these named guidelines. Record exact title, edition/version, URL and access date for each source. If editions differ, document the disagreement; a qualified clinician selects the applicable guideline. WHO Basic Emergency Care may inform triage/red-flag design only; it is not lay first-aid guidance. Use other current official fallback sources only for uncovered topics, with edition/date and jurisdiction stated.
- Maintain a source register with every cited source's version and a pre-launch re-check status. No cited research note is a card until a clinician approves its exact content and source choice.
- Handoff, session history, user export/deletion, authentication, authorization, error/loading/empty states, and emergency access without login.
- Metrics dashboard: emergency recall target >=95%; overall accuracy; over-triage; under-triage; calibration; card-selection accuracy; fairness by language, age group, and gender; proportion of verified cards. Never present an unmet target as achieved.

## Screens

Home/call-first entry; login/signup/logout; language selection; structured symptom intake; targeted follow-up; urgent result; approved guidance card; handoff summary; personal history and deletion; safety/privacy explanation; reviewer-only content status and evaluation dashboard if reviewers and access controls are approved.

## Data, security, and privacy

Use Manus OAuth rather than passwords. Require server-side authorization and owner scoping for every user record. Emergency call and safe general fallback remain accessible without authentication. Minimize data: no audio retention; no raw symptom text in logs; no raw narrative in history by default. Persist the smallest structured record only after explicit consent. Users can delete their own records. Final retention period, whether history is on by default, roles, and privacy notice require owner approval. Verify platform database encryption, access controls, backups, data residency, and deletion behavior before enabling real health-data storage.

## Integrations

- Manus OAuth for application identity.
- Managed MySQL/Drizzle only after explicit approval; development and production share the same database.
- LLM provider is unresolved. Built-in Manus LLM is an available candidate but uses project credits and sends submitted health text to the selected service; no provider call until the user approves the provider and disclosure.
- Optional voice transcription is future scope and needs provider, consent, retention, and failure review.
- Region-specific emergency and crisis-service directory sourced from public authorities; no unverified values.
- No MCP server is required for the product itself. Connect an MCP server only if an approved, documented capability genuinely needs it.

## Non-functional requirements and failure behavior

Mobile-first, keyboard accessible, WCAG-oriented contrast, screen-reader labels and focus management, reduced motion, native-script rendering. Keep emergency action available even if login, AI, database, classifier, or network fails. Validate every model response and retry invalid structured output once; on failure, do not guess urgency or card. Use short timeouts, rate limits, request IDs, privacy-preserving errors, and no sensitive data in logs. Review dependency and API security. Never publish or claim production readiness before the launch gates below.

## Success criteria and launch gates

The product brief sets an evaluation set of 80–100 clinical vignettes, emergency recall target of at least 95%, and required accuracy/over-triage/under-triage/calibration/fairness metrics. Use WHO emergency triage ETAT and IMAI plus standard triage scales as vignette-source frameworks; do not describe this as generic “WHO/IMCI-style” guidance. Public symptom datasets may be synthetic or of unknown origin and can only be proxies; they do not establish clinical validity. MIMIC-IV-ED requires credentialed access and must not be treated as freely accessible. Every emergency coverage case must surface the call action first and select the correct verified card; a missing/wrong card is a critical failure.

Before real-world use: a qualified clinician/first-aid trainer signs off the full rule list and each step/source; native-language reviewers approve every Hindi/Bengali card; emergency and crisis contacts are verified for each supported region; privacy/security review passes; authentication/ownership/deletion tests pass; evaluation gates pass; deployment and monitoring are configured; and the owner explicitly approves publication. Until then, status remains **NOT READY FOR REAL-WORLD USE**.

## Open owner decisions

1. Approve/decline one-way Server and managed Database enablement; their development and published use share the database.
2. Choose the LLM provider. The built-in Manus LLM is the no-extra-secret candidate, but consumes credits and receives health text. Any external provider needs a protected secret and separate data-processing review.
3. Approve or reject persistent history; choose consent default and retention period.
4. Name/authorize clinician and language reviewers and choose role separation.
5. Confirm supported launch regions, call numbers, crisis directories, and privacy/data-residency requirements.
6. Approve any long-lived session duration; default is to keep emergency access public and use conservative session expiry until decided.
7. Decide whether voice input is in first release or deferred.
