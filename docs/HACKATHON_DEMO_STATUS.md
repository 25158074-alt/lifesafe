# LifeSafe hackathon demo status

**Status: prototype source prepared; automated checks and production build have not been verified in this packaging environment.**

This revision is intended for a controlled hackathon demonstration only. It is not a medical device, diagnostic service, or clinically validated triage product. Do not use it to decide whether a real person should delay or seek care.

## Included prototype features

- Draft interface translations for English, Hindi, Bengali, Odia, and Hinglish.
- Distinct intake signals for an unresponsive person who is not breathing normally and an unresponsive person who is breathing normally.
- A suspected snakebite signal and corresponding emergency escalation rule.
- Conservative handling of uncertain/no-match results; the app does not present a no-match result as proof that someone is safe.
- A deterministic red-flag engine with Vitest test cases.
- GitHub Pages configuration for the `LifeSafe` repository.

## Verification status

The package registry was not reachable in the environment used to prepare this ZIP, so dependencies could not be installed here. As a result, TypeScript checks, automated tests, and the production build have **not** been verified in this environment. Run the following locally before submission/deployment:

```bash
pnpm install
pnpm check
pnpm test
pnpm build
```

## Remaining requirements before any real-world use

- Independent qualified-clinician review of every rule and user-facing safety instruction.
- Qualified language review of all translations.
- Verification of emergency contacts for the exact deployment location.
- Usability, accessibility, privacy, and security review.
- Documented clinical validation and formal publication approval.

See [`CLINICAL_REVIEW_REQUIRED.md`](CLINICAL_REVIEW_REQUIRED.md). Do not present this prototype as clinically approved or safe for real-world emergency decisions.
