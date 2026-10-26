const mongoose = require("mongoose");

const SHIFTS = ["morning", "evening", "night", "rotational"];

const nurseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Nurse must reference a User"],
      unique: true,
    },
    employeeId: {
      type: String,
      required: [true, "Employee ID is required"],
      trim: true,
      uppercase: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "Nurse must belong to a hospital"],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Nurse must belong to a department"],
    },
    qualification: { type: String, trim: true },
    shift: {
      type: String,
      enum: SHIFTS,
      default: "rotational",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// A nurse's employeeId must be unique within their own hospital, not
// globally - two hospitals can independently number their staff "N-001".
nurseSchema.index({ hospitalId: 1, employeeId: 1 }, { unique: true });
nurseSchema.index({ hospitalId: 1 });

nurseSchema.pre("save", async function validateDepartmentBelongsToHospital(next) {
  if (!this.isModified("hospitalId") && !this.isModified("departmentId")) return next();
  try {
    const Department = mongoose.model("Department");
    const dept = await Department.findById(this.departmentId).select("hospitalId").lean();
    if (!dept) return next(new Error(`Department ${this.departmentId} does not exist`));
    if (String(dept.hospitalId) !== String(this.hospitalId)) {
      return next(
        new Error(`Department ${this.departmentId} does not belong to hospital ${this.hospitalId}`)
      );
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Nurse", nurseSchema);
module.exports.SHIFTS = SHIFTS;
