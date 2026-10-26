const mongoose = require("mongoose");

const PRIORITIES = ["low", "medium", "high", "urgent"];
const TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"];

/**
 * Design decision (Section 16 of the spec): assignedBy/assignedTo are both
 * User references, not Doctor/Nurse references. This keeps Task consistent
 * with the single authentication root (`req.user.userId` from the JWT maps
 * directly onto these fields with no extra lookup) while a pre-save hook
 * still enforces that assignedTo is actually a NURSE and assignedBy is
 * actually a DOCTOR - so the role constraint is real, just checked against
 * User.role rather than encoded as a separate reference type.
 */
const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: { type: String, trim: true },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must record who assigned it"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task must be assigned to someone"],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Task must reference a patient"],
    },
    admissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: [true, "Task must reference an admission"],
    },
    priority: {
      type: String,
      enum: PRIORITIES,
      default: "medium",
    },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: "pending",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.pre("save", async function validateAssigneeRoles(next) {
  if (!this.isModified("assignedBy") && !this.isModified("assignedTo")) return next();
  try {
    const User = mongoose.model("User");
    const [assigner, assignee] = await Promise.all([
      User.findById(this.assignedBy).select("role").lean(),
      User.findById(this.assignedTo).select("role").lean(),
    ]);
    if (!assigner) return next(new Error(`assignedBy user ${this.assignedBy} does not exist`));
    if (!assignee) return next(new Error(`assignedTo user ${this.assignedTo} does not exist`));
    if (assigner.role !== "DOCTOR" && assigner.role !== "ADMIN") {
      return next(new Error("assignedBy must be a DOCTOR (or ADMIN for administrative tasks)"));
    }
    if (assignee.role !== "NURSE") {
      return next(new Error("assignedTo must be a NURSE"));
    }
    next();
  } catch (err) {
    next(err);
  }
});

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ patientId: 1 });
taskSchema.index({ admissionId: 1 });

module.exports = mongoose.model("Task", taskSchema);
module.exports.PRIORITIES = PRIORITIES;
module.exports.TASK_STATUSES = TASK_STATUSES;
