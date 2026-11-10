import { triageFactsSchema, type SymptomSignal } from "./triage-schema";

export const RED_FLAG_RULES = [
  "chest_pain_with_sweating_or_radiation",
  "breathing_difficulty",
  "stroke_signs",
  "severe_bleeding",
  "seizure",
  "loss_of_consciousness",
  "unresponsive_not_breathing",
  "unresponsive_breathing_normally",
  "snakebite",
  "fever_in_infant_under_3_months",
  "severe_allergic_reaction",
  "suspected_poisoning",
  "severe_dehydration",
  "suicidal_ideation",
] as const;

export type RedFlagRuleId = (typeof RED_FLAG_RULES)[number];
export type DraftUrgency = "EMERGENCY_NOW" | "UNCERTAIN";
export type SupportRoute = "emergency_services" | "crisis_support" | "uncertain";

export interface RedFlagAssessment {
  /** Not a clinical determination until rules and implementation are reviewed. */
  urgency: DraftUrgency;
  triggeredRuleIds: RedFlagRuleId[];
  supportRoute: SupportRoute;
  callActionVisible: true;
  mayAskFollowups: boolean;
  contentStatus: "DRAFT_NOT_CLINICALLY_APPROVED";
  inputValid: boolean;
}

const hasPresentSignal = (signals: Set<SymptomSignal>, signal: SymptomSignal) => signals.has(signal);

/**
 * Deterministic rule layer over normalized structured facts only. It does not parse
 * narrative or decide that a no-match is safe. A model/classifier must never downgrade it.
 */
export function evaluateRedFlags(input: unknown): RedFlagAssessment {
  const parsed = triageFactsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      urgency: "UNCERTAIN",
      triggeredRuleIds: [],
      supportRoute: "uncertain",
      callActionVisible: true,
      mayAskFollowups: false,
      contentStatus: "DRAFT_NOT_CLINICALLY_APPROVED",
      inputValid: false,
    };
  }

  const facts = parsed.data;
  const present = new Set(
    facts.observations
      .filter((observation) => observation.status === "present")
      .map((observation) => observation.signal),
  );
  const triggered: RedFlagRuleId[] = [];
  const has = (signal: SymptomSignal) => hasPresentSignal(present, signal);

  const chestWarning = [
    "chest_pressure",
    "chest_pain_severe",
    "sweating",
    "pain_radiation_arm",
    "pain_radiation_jaw",
    "pain_radiation_neck",
    "pain_radiation_epigastrium",
    "dyspnea",
    "fainting",
  ].some((signal) => has(signal as SymptomSignal));
  if ((has("chest_pain") || has("chest_pressure") || has("chest_pain_severe")) && chestWarning) {
    triggered.push("chest_pain_with_sweating_or_radiation");
  }
  if (has("breathing_difficulty")) triggered.push("breathing_difficulty");
  if (
    has("face_droop") ||
    has("arm_weakness") ||
    has("speech_difficulty") ||
    has("balance_change") ||
    has("vision_change") ||
    has("sudden_severe_headache")
  ) {
    triggered.push("stroke_signs");
  }
  if (
    has("severe_bleeding") ||
    has("pulsatile_bleeding") ||
    has("blood_pooling") ||
    has("bleeding_not_stopping") ||
    has("shock_signs")
  ) triggered.push("severe_bleeding");
  if (
    has("seizure") ||
    has("seizure_over_5_minutes") ||
    has("repeated_seizure") ||
    has("first_seizure") ||
    has("seizure_after_head_trauma")
  ) triggered.push("seizure");
  if (has("loss_of_consciousness")) triggered.push("loss_of_consciousness");
  if (has("unresponsive_not_breathing")) triggered.push("unresponsive_not_breathing");
  if (has("unresponsive_breathing_normally")) triggered.push("unresponsive_breathing_normally");
  const infantSpecificConcern =
    has("fever") || has("infant_poor_feeding") || has("infant_lethargy") || has("infant_hypothermia");
  const infantAgeAtRisk = facts.ageBand === "infant" &&
    (facts.ageInMonths === undefined || facts.ageInMonths < 3);
  const infantAgeUnclearButInfantSignsPresent = facts.ageBand === "unknown" &&
    (has("infant_poor_feeding") || has("infant_lethargy") || has("infant_hypothermia"));
  if (infantSpecificConcern && (infantAgeAtRisk || infantAgeUnclearButInfantSignsPresent)) {
    triggered.push("fever_in_infant_under_3_months");
  }
  if (
    has("severe_allergic_reaction") ||
    (has("allergic_skin_or_mucosal_change") && has("allergic_airway_or_collapse"))
  ) triggered.push("severe_allergic_reaction");
  if (has("suspected_poisoning")) triggered.push("suspected_poisoning");
  if (has("snakebite")) triggered.push("snakebite");
  if (
    has("severe_dehydration") ||
    has("dehydration_lethargy") ||
    has("cannot_drink") ||
    has("skin_pinch_slow")
  ) triggered.push("severe_dehydration");
  if (has("suicidal_ideation") || has("self_harm_attempt") || has("active_self_harm_plan")) {
    triggered.push("suicidal_ideation");
  }

  const isEmergency = triggered.length > 0;
  const crisisTriggered = triggered.includes("suicidal_ideation");

  return {
    urgency: isEmergency ? "EMERGENCY_NOW" : "UNCERTAIN",
    triggeredRuleIds: triggered,
    supportRoute: crisisTriggered
      ? "crisis_support"
      : isEmergency
        ? "emergency_services"
        : "uncertain",
    callActionVisible: true,
    mayAskFollowups: !isEmergency,
    contentStatus: "DRAFT_NOT_CLINICALLY_APPROVED",
    inputValid: true,
  };
}

/** Enforces red-flag precedence when combining with a future classifier. */
export function preserveEmergencyPrecedence(
  assessment: RedFlagAssessment,
  classifierUrgency: "EMERGENCY_NOW" | "SEE_DOCTOR_SOON" | "SELF_CARE" | "UNCERTAIN",
): DraftUrgency {
  if (assessment.triggeredRuleIds.length > 0 || classifierUrgency === "EMERGENCY_NOW") {
    return "EMERGENCY_NOW";
  }
  // The classifier is not clinically validated, so lower levels are intentionally disabled.
  return "UNCERTAIN";
}
