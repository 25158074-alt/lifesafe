# LifeSafe design direction

**Status:** Implemented in the prototype shell. This is a visual and interaction direction, not a clinical release decision.

## Product

LifeSafe helps a person reach emergency help quickly while making the limits of automated triage visible.

## Character

Calm, direct, accountable.

## World

An emergency dispatch desk: paper forms, clear status marks, quiet surfaces, and one unmistakable alert color.

## Moments

1. The call-first strip is the primary visual anchor and stays visible before and beside the assessment.
2. A selected red flag changes the result panel to an explicit call-now state; it does not reveal invented first-aid content.

## Signature

Every decision carries a small status label. `Emergency support may be needed` is deliberately clearer than a score, badge, or reassuring color.

## Unslop passes applied

- Removed gradients, glows, decorative emoji, oversized rounded cards, noisy labels, fake success claims, and generic welcome copy.
- Replaced starter-template imports with a self-contained responsive shell that runs with the existing React entry point.
- Used a neutral paper/ink palette with teal for navigation and red only for emergency escalation.
- Kept emergency actions visible without login and made the prototype boundary explicit.
- Kept language and age selection compact, accessible, and sentence case.
- Added reduced-motion behavior, visible focus states, mobile layout, and native telephone links.

## Clinical boundary

The current deterministic rule set includes draft handling for emergency warning signs and selected escalation cases. No completed or independently authenticated clinician review is represented in this submission. The UI labels the content as draft/not clinically approved. All rules, translations, operational contacts, privacy, security, performance, and release authorization require qualified review before any real-world use.

No generated guidance card is served. When a red flag is present, the interface surfaces the call action first and names the matched rule. When no rule matches, it remains explicitly uncertain.
