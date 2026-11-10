import { describe, expect, it } from "vitest";
import { evaluateRedFlags, preserveEmergencyPrecedence } from "./red-flag-rules";
import type { LanguageCode, SymptomSignal, TriageFacts } from "./triage-schema";

const facts = (
  signals: SymptomSignal[],
  overrides: Partial<TriageFacts> = {},
): TriageFacts => ({
  schemaVersion: "1.0.0",
  language: "en",
  ageBand: "adult",
  observations: signals.map((signal) => ({
    signal,
    status: "present",
    provenance: "user_reported",
  })),
  ...overrides,
});

describe("draft red-flag engine", () => {
  it.each([
    ["chest pain with sweating", ["chest_pain", "sweating"]],
    ["chest pain radiating to an arm", ["chest_pain", "pain_radiation_arm"]],
    ["chest pain radiating to the jaw", ["chest_pain", "pain_radiation_jaw"]],
    ["breathing difficulty", ["breathing_difficulty"]],
    ["face droop", ["face_droop"]],
    ["arm weakness", ["arm_weakness"]],
    ["speech difficulty", ["speech_difficulty"]],
    ["severe bleeding", ["severe_bleeding"]],
    ["seizure", ["seizure"]],
    ["loss of consciousness", ["loss_of_consciousness"]],
    ["unresponsive and not breathing normally", ["unresponsive_not_breathing"]],
    ["unresponsive but breathing normally", ["unresponsive_breathing_normally"]],
    ["suspected snakebite", ["snakebite"]],
    ["severe allergic reaction", ["severe_allergic_reaction"]],
    ["suspected poisoning", ["suspected_poisoning"]],
    ["severe dehydration", ["severe_dehydration"]],
    ["suicidal ideation", ["suicidal_ideation"]],
  ] as const)("escalates %s", (_label, signals) => {
    const result = evaluateRedFlags(facts([...signals]));
    expect(result.urgency).toBe("EMERGENCY_NOW");
    expect(result.triggeredRuleIds.length).toBeGreaterThan(0);
    expect(result.callActionVisible).toBe(true);
    expect(result.mayAskFollowups).toBe(false);
    expect(result.contentStatus).toBe("DRAFT_NOT_CLINICALLY_APPROVED");
  });

  it.each([
    ["newborn", 0],
    ["two months", 2],
    ["just under three months", 2.99],
  ] as const)("escalates fever in an infant aged %s", (_label, ageInMonths) => {
    const result = evaluateRedFlags(facts(["fever"], {
      ageBand: "infant",
      ageInMonths,
    }));
    expect(result.urgency).toBe("EMERGENCY_NOW");
    expect(result.triggeredRuleIds).toContain("fever_in_infant_under_3_months");
  });

  it("escalates infant fever conservatively when the exact infant age is unknown", () => {
    const result = evaluateRedFlags(facts(["fever"], { ageBand: "infant" }));
    expect(result.triggeredRuleIds).toContain("fever_in_infant_under_3_months");
  });

  it("keeps both unresponsive breathing states as distinct emergency triggers", () => {
    const notBreathing = evaluateRedFlags(facts(["unresponsive_not_breathing"]));
    const breathing = evaluateRedFlags(facts(["unresponsive_breathing_normally"]));
    expect(notBreathing.urgency).toBe("EMERGENCY_NOW");
    expect(notBreathing.triggeredRuleIds).toContain("unresponsive_not_breathing");
    expect(breathing.urgency).toBe("EMERGENCY_NOW");
    expect(breathing.triggeredRuleIds).toContain("unresponsive_breathing_normally");
    expect(notBreathing.triggeredRuleIds).not.toContain("unresponsive_breathing_normally");
  });

  it("does not match the under-three-month rule at three months, but remains uncertain", () => {
    const result = evaluateRedFlags(facts(["fever"], {
      ageBand: "infant",
      ageInMonths: 3,
    }));
    expect(result.urgency).toBe("UNCERTAIN");
    expect(result.triggeredRuleIds).not.toContain("fever_in_infant_under_3_months");
    expect(result.callActionVisible).toBe(true);
  });

  it("requires the chest-pain combination rather than chest pain alone", () => {
    const result = evaluateRedFlags(facts(["chest_pain"]));
    expect(result.urgency).toBe("UNCERTAIN");
    expect(result.triggeredRuleIds).not.toContain("chest_pain_with_sweating_or_radiation");
    expect(result.callActionVisible).toBe(true);
  });

  it.each([
    ["chest pressure", ["chest_pressure"]],
    ["severe chest pain", ["chest_pain_severe"]],
    ["chest pain with breathlessness", ["chest_pain", "dyspnea"]],
    ["chest pain radiating to the neck", ["chest_pain", "pain_radiation_neck"]],
  ] as const)("escalates the reviewed acute chest-pain case: %s", (_label, signals) => {
    const result = evaluateRedFlags(facts([...signals]));
    expect(result.triggeredRuleIds).toContain("chest_pain_with_sweating_or_radiation");
  });

  it.each([
    ["balance", "balance_change"],
    ["vision", "vision_change"],
    ["sudden severe headache", "sudden_severe_headache"],
  ] as const)("treats a BE-FAST %s sign as a stroke red flag", (_label, signal) => {
    const result = evaluateRedFlags(facts([signal]));
    expect(result.triggeredRuleIds).toContain("stroke_signs");
  });

  it("does not assume an unknown-age person with fever is an infant", () => {
    const result = evaluateRedFlags(facts(["fever"], { ageBand: "unknown" }));
    expect(result.urgency).toBe("UNCERTAIN");
    expect(result.triggeredRuleIds).not.toContain("fever_in_infant_under_3_months");
  });

  it("escalates infant-specific warning signs when age band is unknown", () => {
    const result = evaluateRedFlags(facts(["infant_lethargy"], { ageBand: "unknown" }));
    expect(result.triggeredRuleIds).toContain("fever_in_infant_under_3_months");
  });

  it("routes suicidal ideation to crisis support without inventing a helpline", () => {
    const result = evaluateRedFlags(facts(["suicidal_ideation"]));
    expect(result.urgency).toBe("EMERGENCY_NOW");
    expect(result.supportRoute).toBe("crisis_support");
  });

  it("collects all triggered rules and is independent of observation order/duplicates", () => {
    const first = evaluateRedFlags(facts([
      "speech_difficulty",
      "face_droop",
      "breathing_difficulty",
      "breathing_difficulty",
    ]));
    const second = evaluateRedFlags(facts([
      "breathing_difficulty",
      "face_droop",
      "speech_difficulty",
    ]));
    expect(first.urgency).toBe("EMERGENCY_NOW");
    expect(first.triggeredRuleIds).toEqual(["breathing_difficulty", "stroke_signs"]);
    expect(first.triggeredRuleIds).toEqual(second.triggeredRuleIds);
  });

  it("returns uncertainty for a valid no-match and never infers self-care", () => {
    const result = evaluateRedFlags(facts(["other_reported_symptom"]));
    expect(result.urgency).toBe("UNCERTAIN");
    expect(result.triggeredRuleIds).toEqual([]);
    expect(result.mayAskFollowups).toBe(true);
    expect(result.callActionVisible).toBe(true);
  });

  it("returns fail-safe uncertainty for invalid or unexpected input", () => {
    const result = evaluateRedFlags({ schemaVersion: "1.0.0", narrative: "hidden free text" });
    expect(result.urgency).toBe("UNCERTAIN");
    expect(result.inputValid).toBe(false);
    expect(result.mayAskFollowups).toBe(false);
    expect(result.callActionVisible).toBe(true);
  });

  it.each(["en", "hi", "bn", "or", "hinglish"] as const)(
    "applies the same normalized red-flag contract for %s-language facts",
    (language: LanguageCode) => {
      const result = evaluateRedFlags(facts(["breathing_difficulty"], { language }));
      expect(result.urgency).toBe("EMERGENCY_NOW");
      expect(result.triggeredRuleIds).toContain("breathing_difficulty");
    },
  );

  it.each(["SEE_DOCTOR_SOON", "SELF_CARE", "UNCERTAIN"] as const)(
    "does not let a classifier downgrade a matched red flag to %s",
    (classifierUrgency) => {
      const assessment = evaluateRedFlags(facts(["severe_bleeding"]));
      expect(preserveEmergencyPrecedence(assessment, classifierUrgency)).toBe("EMERGENCY_NOW");
    },
  );

  it("does not enable unvalidated lower classifier outputs when no rule matches", () => {
    const assessment = evaluateRedFlags(facts(["other_reported_symptom"]));
    expect(preserveEmergencyPrecedence(assessment, "SELF_CARE")).toBe("UNCERTAIN");
  });
});
