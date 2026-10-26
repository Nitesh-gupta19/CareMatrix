const mongoose = require("mongoose");

// Medicines are embedded: they have no independent existence outside their
// parent prescription and are always read/written as a unit with it.
const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dosage: { type: String, trim: true },
    frequency: { type: String, trim: true },
    duration: { type: String, trim: true },
    timing: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Prescription must reference a patient"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Prescription must reference a doctor"],
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: [true, "Prescription must reference an admission"],
    },
    diagnosis: { type: String, trim: true },
    medicines: {
      type: [medicineSchema],
      default: [],
    },
    instructions: { type: String, trim: true },
    // Medical records are not hard-deleted (Section 33) - a prescription is
    // discontinued via status change, preserving the audit trail.
    status: {
      type: String,
      enum: ["active", "discontinued"],
      default: "active",
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ admissionId: 1 });
prescriptionSchema.index({ doctorId: 1 });

module.exports = mongoose.model("Prescription", prescriptionSchema);
