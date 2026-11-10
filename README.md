# LifeSafe — Multilingual Triage Prototype

LifeSafe is a static React + TypeScript hackathon prototype demonstrating a call-first interface and deterministic red-flag rules. The interface includes English, Hindi, Bengali, Odia, and Hinglish draft translations.

> **Important: Prototype only. NOT CLINICALLY VALIDATED. NOT FOR REAL EMERGENCIES OR MEDICAL DECISIONS.** It does not diagnose or confirm that someone is safe. If someone may be in immediate danger, contact local emergency services directly.

## Tech stack

- React 19 + TypeScript
- Vite 7
- Zod
- Vitest
- Deterministic red-flag evaluation (no AI model makes urgency decisions)

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm 10+

## Run locally

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

Vite serves the application locally. The production build is generated in `dist/`.

## Deploy to GitHub Pages

This repository is configured for the GitHub project page `https://25158074-alt.github.io/LifeSafe/`. The `base` setting in `vite.config.ts` is `/LifeSafe/`. A GitHub Actions workflow in `.github/workflows/deploy.yml` builds and publishes the site when code is pushed to `main`. In the repository, set **Settings → Pages → Build and deployment → Source → GitHub Actions**.

## Safety and validation status

The red-flag rules and translations are draft software behavior. Automated tests can check implementation consistency but cannot establish clinical validity. No clinician approval is claimed in this repository. Before any real-world use, qualified clinical and language review, emergency-contact verification, privacy/security review, usability evaluation, and documented clinical validation are required. See [`docs/CLINICAL_REVIEW_REQUIRED.md`](docs/CLINICAL_REVIEW_REQUIRED.md) and [`docs/HACKATHON_DEMO_STATUS.md`](docs/HACKATHON_DEMO_STATUS.md).

## Project contents

- `src/` — application, schema, rules, and tests
- `docs/` — product/design notes and review requirements
- `research/` — draft background research and source register; not approved user-facing guidance
- `.github/workflows/` — GitHub Pages deployment workflow
