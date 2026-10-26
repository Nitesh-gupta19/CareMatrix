const mongoose = require("mongoose");

const ADMISSION_STATUSES = ["admitted", "discharged", "cancelled"];

/**
 * Admission is the central bridge between Patient and hospital context.
 * "Where is this patient?" is always answered by finding their
 * `status: 'admitted'` Admission and following its references - Patient
 * itself never stores a hospital location (see Patient.js).
 */
const admissionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Admission must reference a patient"],
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "Admission must reference a hospital"],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Admission must reference a department"],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Admission must reference a treating doctor"],
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Admission must reference a ward"],
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: [true, "Admission must reference a bed"],
    },
    admissionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dischargeDate: {
      type: Date,
      default: null,
    },
    reason: { type: String, trim: true },
    status: {
      type: String,
      enum: ADMISSION_STATUSES,
      default: "admitted",
    },
  },
  { timestamps: true }
);

/**
 * Referential-integrity validation. The heavier operational logic (bed
 * availability checks, marking the bed occupied/available, preventing two
 * active admissions on one bed) lives in services/admissionService.js
 * because it involves side effects on OTHER documents - a model hook
 * should validate its own document's consistency, not silently mutate
 * unrelated collections.
 */
admissionSchema.pre("save", async function validateRelationships(next) {
  const touchedCoreRefs =
    this.isModified("hospitalId") ||
    this.isModified("departmentId") ||
    this.isModified("doctorId") ||
    this.isModified("wardId") ||
    this.isModified("bedId");
  if (!touchedCoreRefs) return next();

  try {
    const Department = mongoose.model("Department");
    const Ward = mongoose.model("Ward");
    const Bed = mongoose.model("Bed");
    const Doctor = mongoose.model("Doctor");

    const [department, ward, bed, doctor] = await Promise.all([
      Department.findById(this.departmentId).select("hospitalId").lean(),
      Ward.findById(this.wardId).select("hospitalId").lean(),
      Bed.findById(this.bedId).select("wardId").lean(),
      Doctor.findById(this.doctorId).select("hospitalAffiliations").lean(),
    ]);

    if (!department) return next(new Error(`Department ${this.departmentId} does not exist`));
    if (String(department.hospitalId) !== String(this.hospitalId)) {
      return next(new Error("departmentId does not belong to the given hospitalId"));
    }

    if (!ward) return next(new Error(`Ward ${this.wardId} does not exist`));
    if (String(ward.hospitalId) !== String(this.hospitalId)) {
      return next(new Error("wardId does not belong to the given hospitalId"));
    }

    if (!bed) return next(new Error(`Bed ${this.bedId} does not exist`));
    if (String(bed.wardId) !== String(this.wardId)) {
      return next(new Error("bedId does not belong to the given wardId"));
    }

    if (!doctor) return next(new Error(`Doctor ${this.doctorId} does not exist`));
    const isAffiliated = (doctor.hospitalAffiliations || []).some(
      (a) => String(a.hospitalId) === String(this.hospitalId) && a.status === "active"
    );
    if (!isAffiliated) {
      return next(new Error("doctorId is not actively affiliated with the given hospitalId"));
    }

    next();
  } catch (err) {
    next(err);
  }
});

admissionSchema.index({ patientId: 1, status: 1 });
admissionSchema.index({ hospitalId: 1, status: 1 });
admissionSchema.index({ doctorId: 1, status: 1 });
admissionSchema.index({ status: 1 });
admissionSchema.index({ admissionDate: -1 });

module.exports = mongoose.model("Admission", admissionSchema);
module.exports.ADMISSION_STATUSES = ADMISSION_STATUSES;
