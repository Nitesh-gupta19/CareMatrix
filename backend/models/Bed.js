const mongoose = require("mongoose");

const BED_STATUSES = ["available", "occupied", "maintenance", "reserved"];

const bedSchema = new mongoose.Schema(
  {
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ward",
      required: [true, "Bed must belong to a ward"],
    },
    bedNumber: {
      type: String,
      required: [true, "Bed number is required"],
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: BED_STATUSES,
      default: "available",
    },
  },
  { timestamps: true }
);

// bedNumber only needs to be unique within its own ward.
bedSchema.index({ wardId: 1, bedNumber: 1 }, { unique: true });
// Frequent query: "find an available bed in this ward" (Section 21/34).
bedSchema.index({ wardId: 1, status: 1 });

module.exports = mongoose.model("Bed", bedSchema);
module.exports.BED_STATUSES = BED_STATUSES;
