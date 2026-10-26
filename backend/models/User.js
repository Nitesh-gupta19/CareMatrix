const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["ADMIN", "DOCTOR", "NURSE", "PATIENT", "RELATIVE"];
const STATUSES = ["active", "inactive", "suspended"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // never returned by default on find/findOne queries
    },
    role: {
      type: String,
      enum: ROLES,
      required: [true, "Role is required"],
    },
    phone: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String, // path/URL - populated later if uploads are implemented
      default: null,
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "active",
    },
    // DECISION (Phase 2, Section 29): an ADMIN is associated with exactly
    // one hospital. Rather than create a 14th entity just to hold one
    // reference field, that reference lives directly on User and is only
    // ever populated/read when role === 'ADMIN'. Doctor/Nurse/Patient keep
    // their real per-role data in their own dedicated profile collections
    // as before - this is a narrow, single-field exception, not a
    // reversal of "role-specific data doesn't belong in User".
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      default: null,
    },
  },
  { timestamps: true }
);

// Hash the password whenever it is set/changed - never store plaintext.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Belt-and-braces: even if a query accidentally selects +password,
// toJSON/toObject strip it from anything serialized back to a client.
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
module.exports.STATUSES = STATUSES;
