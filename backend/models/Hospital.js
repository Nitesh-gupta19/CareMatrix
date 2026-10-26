const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true },
    logo: { type: String, default: null },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// registrationNumber already has a unique index via `unique: true` above.
// Index on name to support the "find your hospital" search used during
// doctor/nurse onboarding (Section 20/21 of the Phase 1 report).
hospitalSchema.index({ name: "text" });

module.exports = mongoose.model("Hospital", hospitalSchema);
