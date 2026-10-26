const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "A department must belong to a hospital"],
    },
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
    },
    description: { type: String, trim: true },
    floor: { type: String, trim: true },
    phone: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// A department code should be unique WITHIN a hospital, not globally -
// two different hospitals can both have a "CARD" code.
departmentSchema.index({ hospitalId: 1, code: 1 }, { unique: true, sparse: true });
// Every department list/lookup is scoped by hospitalId first.
departmentSchema.index({ hospitalId: 1 });

module.exports = mongoose.model("Department", departmentSchema);
