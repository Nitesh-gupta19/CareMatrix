require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Route modules
const authRoutes = require("./routes/authRoutes");
const hospitalRoutes = require("./routes/hospitalRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const nurseRoutes = require("./routes/nurseRoutes");
const patientRoutes = require("./routes/patientRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const wardRoutes = require("./routes/wardRoutes");
const bedRoutes = require("./routes/bedRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const taskRoutes = require("./routes/taskRoutes");
const observationRoutes = require("./routes/observationRoutes");
const relativeRoutes = require("./routes/relativeRoutes");

const app = express();

// --- Core middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health / root endpoint (the ONLY non-resource endpoint kept -
//     Section 50 explicitly removes prototype "API is working" routes) ---
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "CareMatrix API is running",
    data: { service: "carematrix-backend", status: "ok" },
  });
});
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Healthy",
    data: { uptimeSeconds: process.uptime() },
  });
});

// --- Resource routes ---
app.use("/api/auth", authRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/nurses", nurseRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/observations", observationRoutes);
app.use("/api/relatives", relativeRoutes);

// --- 404 + centralized error handling (must be mounted LAST) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] CareMatrix API listening on port ${PORT}`);
  });
}

start();

module.exports = app; // exported for potential future test tooling
