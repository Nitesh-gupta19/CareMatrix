const mongoose = require("mongoose");

const OBSERVATION_TYPES = [
  "temperature",
  "blood_pressure",
  "heart_rate",
  "oxygen_saturation",
  "respiratory_rate",
  "general_note",
];

const observationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Observation must reference a patient"],
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: [true, "Observation must reference an admission"],
    },
    nurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nurse",
      required: [true, "Observation must reference the recording nurse"],
    },
    type: {
      type: String,
      enum: OBSERVATION_TYPES,
      required: [true, "Observation type is required"],
    },
    value: {
      type: String, // kept as a flexible string (e.g. "120/80", "98.6°F")
      required: [true, "Observation value is required"],
      trim: true,
    },
    notes: { type: String, trim: true },
    observedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Observations are treated as append-only clinical records once created
// (Section 33) - no update/delete endpoints are exposed for this entity;
// a correction is recorded as a new observation with a note, not an edit.

observationSchema.index({ admissionId: 1, observedAt: -1 });
observationSchema.index({ patientId: 1 });
observationSchema.index({ nurseId: 1 });

module.exports = mongoose.model("Observation", observationSchema);
module.exports.OBSERVATION_TYPES = OBSERVATION_TYPES;
