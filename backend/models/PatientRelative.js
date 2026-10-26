const mongoose = require("mongoose");

const patientRelativeSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Must reference a patient"],
    },
    relativeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Must reference the relative's user account"],
    },
    relationship: {
      type: String,
      enum: ["father", "mother", "brother", "sister", "spouse", "guardian", "other"],
      required: [true, "Relationship is required"],
    },
    isPrimaryContact: {
      type: Boolean,
      default: false,
    },
    accessStatus: {
      type: String,
      enum: ["pending", "approved", "revoked"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// A relative should not have two duplicate access records for one patient.
patientRelativeSchema.index({ patientId: 1, relativeUserId: 1 }, { unique: true });
patientRelativeSchema.index({ relativeUserId: 1 });
patientRelativeSchema.index({ patientId: 1, accessStatus: 1 });

module.exports = mongoose.model("PatientRelative", patientRelativeSchema);
