const mongoose = require("mongoose");

/**
 * IMPORTANT: Patient intentionally has NO hospitalId field.
 * A patient's current hospital/department/doctor/ward/bed is always
 * resolved through their active Admission record (see Admission.js),
 * because a patient can be admitted to different hospitals over time.
 * Adding a permanent hospitalId here would either go stale on discharge
 * or force overwriting history on every new admission - both wrong.
 */
const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // optional - some patients never log in themselves
    },
    patientId: {
      type: String, // human-friendly ID used in the "patient access" flow
      required: [true, "patientId is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
    },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null],
      default: null,
    },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// patientId already unique via schema option; index kept explicit for clarity.
patientSchema.index({ patientId: 1 });

module.exports = mongoose.model("Patient", patientSchema);
