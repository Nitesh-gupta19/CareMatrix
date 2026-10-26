const mongoose = require("mongoose");

const wardSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "Ward must belong to a hospital"],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null, // some wards (e.g. general ICU) may not map to one department
    },
    name: {
      type: String,
      required: [true, "Ward name is required"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["general", "icu", "ccu", "private", "emergency", "pediatric"],
      default: "general",
    },
    floor: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

wardSchema.index({ hospitalId: 1, departmentId: 1 });

wardSchema.pre("save", async function validateDepartmentBelongsToHospital(next) {
  if (!this.departmentId || (!this.isModified("hospitalId") && !this.isModified("departmentId"))) {
    return next();
  }
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

module.exports = mongoose.model("Ward", wardSchema);
