import { z } from "zod";

export const LANGUAGE_CODES = ["en", "hi", "bn", "or", "hinglish"] as const;
export const languageCodeSchema = z.enum(LANGUAGE_CODES);
export type LanguageCode = z.infer<typeof languageCodeSchema>;

export const AGE_BANDS = ["infant", "child", "adult", "unknown"] as const;
export const ageBandSchema = z.enum(AGE_BANDS);
export type AgeBand = z.infer<typeof ageBandSchema>;

export const SYMPTOM_SIGNALS = [
  "chest_pain",
  "chest_pressure",
  "chest_pain_severe",
  "sweating",
  "pain_radiation_arm",
  "pain_radiation_jaw",
  "pain_radiation_neck",
  "pain_radiation_epigastrium",
  "dyspnea",
  "fainting",
  "breathing_difficulty",
  "inability_to_speak",
  "cyanosis",
  "stridor_or_grunting",
  "face_droop",
  "arm_weakness",
  "speech_difficulty",
  "balance_change",
  "vision_change",
  "sudden_severe_headache",
  "severe_bleeding",
  "pulsatile_bleeding",
  "blood_pooling",
  "bleeding_not_stopping",
  "shock_signs",
  "seizure",
  "seizure_over_5_minutes",
  "repeated_seizure",
  "first_seizure",
  "seizure_after_head_trauma",
  "loss_of_consciousness",
  "unresponsive_not_breathing",
  "unresponsive_breathing_normally",
  "fever",
  "infant_poor_feeding",
  "infant_lethargy",
  "infant_hypothermia",
  "severe_allergic_reaction",
  "allergic_skin_or_mucosal_change",
  "allergic_airway_or_collapse",
  "suspected_poisoning",
  "snakebite",
  "severe_dehydration",
  "dehydration_lethargy",
  "cannot_drink",
  "skin_pinch_slow",
  "suicidal_ideation",
  "self_harm_attempt",
  "active_self_harm_plan",
  "other_reported_symptom",
] as const;
export const symptomSignalSchema = z.enum(SYMPTOM_SIGNALS);
export type SymptomSignal = z.infer<typeof symptomSignalSchema>;

export const symptomObservationSchema = z.object({
  signal: symptomSignalSchema,
  status: z.enum(["present", "absent", "unknown"]),
  provenance: z.enum(["user_reported", "user_confirmed", "model_extracted"]),
  confidence: z.number().min(0).max(1).optional(),
}).strict();
export type SymptomObservation = z.infer<typeof symptomObservationSchema>;

/**
 * The shared clinical-data contract. It intentionally does not contain raw narrative,
 * name, email, exact birth date, provider prompt, or authentication identifiers.
 * `unknown` is explicit; absence is never interpreted as a negative finding.
 */
export const triageFactsSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  language: languageCodeSchema,
  ageBand: ageBandSchema,
  /** Used only for an infant where age below 3 months matters; not a date of birth. */
  ageInMonths: z.number().min(0).max(36).optional(),
  observations: z.array(symptomObservationSchema).max(64),
  onset: z.enum(["sudden", "gradual", "intermittent", "unknown"]).optional(),
  /** Relative timing only; no raw narrative or date/time is stored in these facts. */
  onsetMinutesAgo: z.number().int().min(0).max(525_600).optional(),
}).strict().superRefine((facts, context) => {
  if (facts.ageInMonths !== undefined && facts.ageBand !== "infant") {
    context.addIssue({
      code: "custom",
      path: ["ageInMonths"],
      message: "ageInMonths is only allowed when ageBand is infant",
    });
  }
});

export type TriageFacts = z.infer<typeof triageFactsSchema>;

/** Raw intake is transient and must never be persisted or logged by default. */
export const triageIntakeRequestSchema = z.object({
  language: languageCodeSchema,
  narrative: z.string().trim().min(1).max(3000),
  ageBand: ageBandSchema,
  ageInMonths: z.number().min(0).max(36).optional(),
  processingConsent: z.literal(true),
}).strict().superRefine((request, context) => {
  if (request.ageInMonths !== undefined && request.ageBand !== "infant") {
    context.addIssue({
      code: "custom",
      path: ["ageInMonths"],
      message: "ageInMonths is only allowed when ageBand is infant",
    });
  }
});

export type TriageIntakeRequest = z.infer<typeof triageIntakeRequestSchema>;
