const mongoose = require("mongoose");

/**
 * A doctor may work at multiple hospitals, and their department can differ
 * per hospital (e.g. Cardiology at Hospital A, General Medicine at
 * Hospital B). A single flat `departmentId` cannot represent that, so each
 * affiliation pairs exactly one hospital with exactly one department that
 * must belong to that hospital (enforced below in the pre-save hook, and
 * re-checked at the controller layer whenever affiliations are edited).
 */
const affiliationSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor must reference a User"],
      unique: true,
    },
    doctorCode: {
      type: String,
      required: [true, "Doctor code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    specialization: { type: String, trim: true },
    qualification: { type: String, trim: true },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
    },
    experience: { type: Number, min: 0, default: 0 },
    hospitalAffiliations: {
      type: [affiliationSchema],
      default: [],
      validate: {
        validator(list) {
          // No duplicate hospital entries within the same doctor.
          const seen = new Set();
          for (const a of list) {
            const key = String(a.hospitalId);
            if (seen.has(key)) return false;
            seen.add(key);
          }
          return true;
        },
        message: "A doctor cannot have two affiliation entries for the same hospital",
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

/**
 * Cross-collection integrity check: every affiliation's departmentId must
 * actually belong to that affiliation's hospitalId. This runs on every
 * save, not just creation, so an edit that swaps in a mismatched
 * department is rejected the same way a fresh create would be.
 */
doctorSchema.pre("save", async function validateAffiliations(next) {
  if (!this.isModified("hospitalAffiliations") || this.hospitalAffiliations.length === 0) {
    return next();
  }
  try {
    const Department = mongoose.model("Department");
    for (const affiliation of this.hospitalAffiliations) {
      const dept = await Department.findById(affiliation.departmentId).select("hospitalId").lean();
      if (!dept) {
        return next(new Error(`Department ${affiliation.departmentId} does not exist`));
      }
      if (String(dept.hospitalId) !== String(affiliation.hospitalId)) {
        return next(
          new Error(
            `Department ${affiliation.departmentId} does not belong to hospital ${affiliation.hospitalId}`
          )
        );
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

doctorSchema.index({ "hospitalAffiliations.hospitalId": 1 });

module.exports = mongoose.model("Doctor", doctorSchema);
