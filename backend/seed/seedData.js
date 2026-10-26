/**
 * CareMatrix demo/development seed script.
 *
 * IMPORTANT: this is a DEVELOPMENT-ONLY script. It clears the collections
 * listed below before reseeding. Never point it at a production database.
 *
 * Run with: npm run seed
 *
 * Design choice: admissions are created/discharged by calling
 * services/admissionService.js directly - the exact same code path the
 * live API uses - rather than writing Admission documents by hand. This
 * guarantees the seeded data can never represent a relationship the real
 * application logic wouldn't also allow (Section 4 of the spec: "do not
 * create fake/demo-only relationships that do not represent the actual
 * architecture").
 */

require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const Doctor = require("../models/Doctor");
const Nurse = require("../models/Nurse");
const Patient = require("../models/Patient");
const Ward = require("../models/Ward");
const Bed = require("../models/Bed");
const Prescription = require("../models/Prescription");
const Task = require("../models/Task");
const Observation = require("../models/Observation");
const PatientRelative = require("../models/PatientRelative");
const Admission = require("../models/Admission");

const admissionService = require("../services/admissionService");

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "Passw0rd!";

async function clearCollections() {
  console.log("[seed] Clearing existing development data...");
  await Promise.all([
    User.deleteMany({}),
    Hospital.deleteMany({}),
    Department.deleteMany({}),
    Doctor.deleteMany({}),
    Nurse.deleteMany({}),
    Patient.deleteMany({}),
    Ward.deleteMany({}),
    Bed.deleteMany({}),
    Admission.deleteMany({}),
    Prescription.deleteMany({}),
    Task.deleteMany({}),
    Observation.deleteMany({}),
    PatientRelative.deleteMany({}),
  ]);
}

async function seedHospitals() {
  const hospitalA = await Hospital.create({
    name: "CarePlus Medical Center",
    registrationNumber: "REG-CAREPLUS-001",
    address: "12 MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
    phone: "022-10000001",
    email: "info@careplus.demo",
  });

  const hospitalB = await Hospital.create({
    name: "Sunrise General Hospital",
    registrationNumber: "REG-SUNRISE-002",
    address: "45 Lake View Road",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    phone: "020-20000002",
    email: "info@sunrise.demo",
  });

  return { hospitalA, hospitalB };
}

async function seedDepartments({ hospitalA, hospitalB }) {
  // 5 total departments, matching the "3-5 departments" target.
  const [cardiology, neurology, emergencyA] = await Promise.all([
    Department.create({ hospitalId: hospitalA._id, name: "Cardiology", code: "CARD", floor: "2nd" }),
    Department.create({ hospitalId: hospitalA._id, name: "Neurology", code: "NEURO", floor: "3rd" }),
    Department.create({ hospitalId: hospitalA._id, name: "Emergency", code: "ER", floor: "Ground" }),
  ]);
  const [pediatrics, generalMedicine] = await Promise.all([
    Department.create({ hospitalId: hospitalB._id, name: "Pediatrics", code: "PEDS", floor: "1st" }),
    Department.create({ hospitalId: hospitalB._id, name: "General Medicine", code: "GEN", floor: "Ground" }),
  ]);

  return { cardiology, neurology, emergencyA, pediatrics, generalMedicine };
}

async function seedDoctors({ hospitalA, hospitalB, cardiology, neurology, emergencyA, generalMedicine, pediatrics }) {
  const doctorDefs = [
    {
      name: "Dr. Sarah Sharma",
      email: "sarah.sharma@carematrix.demo",
      doctorCode: "DOC-001",
      licenseNumber: "LIC-1001",
      specialization: "Cardiology",
      qualification: "MD, DM Cardiology",
      experience: 12,
      // Multi-hospital doctor - demonstrates Professor Question 3.
      affiliations: [
        { hospitalId: hospitalA._id, departmentId: cardiology._id },
        { hospitalId: hospitalB._id, departmentId: generalMedicine._id },
      ],
    },
    {
      name: "Dr. Aditya Rao",
      email: "aditya.rao@carematrix.demo",
      doctorCode: "DOC-002",
      licenseNumber: "LIC-1002",
      specialization: "Neurology",
      qualification: "MD, DM Neurology",
      experience: 9,
      affiliations: [{ hospitalId: hospitalA._id, departmentId: neurology._id }],
    },
    {
      name: "Dr. Meera Iyer",
      email: "meera.iyer@carematrix.demo",
      doctorCode: "DOC-003",
      licenseNumber: "LIC-1003",
      specialization: "Emergency Medicine",
      qualification: "MBBS, MD EM",
      experience: 6,
      affiliations: [{ hospitalId: hospitalA._id, departmentId: emergencyA._id }],
    },
    {
      name: "Dr. Vikram Nair",
      email: "vikram.nair@carematrix.demo",
      doctorCode: "DOC-004",
      licenseNumber: "LIC-1004",
      specialization: "Pediatrics",
      qualification: "MD Pediatrics",
      experience: 8,
      affiliations: [{ hospitalId: hospitalB._id, departmentId: pediatrics._id }],
    },
  ];

  const doctors = {};
  for (const def of doctorDefs) {
    const user = await User.create({
      name: def.name,
      email: def.email,
      password: DEMO_PASSWORD,
      role: "DOCTOR",
      phone: "9000000001",
    });
    const doctor = await Doctor.create({
      userId: user._id,
      doctorCode: def.doctorCode,
      specialization: def.specialization,
      qualification: def.qualification,
      licenseNumber: def.licenseNumber,
      experience: def.experience,
      hospitalAffiliations: def.affiliations.map((a) => ({ ...a, status: "active" })),
    });
    doctors[def.doctorCode] = { user, doctor };
  }

  return doctors;
}

async function seedNurses({ hospitalA, hospitalB, cardiology, neurology, emergencyA, generalMedicine, pediatrics }) {
  const nurseDefs = [
    { name: "Nurse John Fernandes", email: "john.fernandes@carematrix.demo", employeeId: "N-A-001", hospitalId: hospitalA._id, departmentId: cardiology._id, shift: "morning" },
    { name: "Nurse Priya Kulkarni", email: "priya.kulkarni@carematrix.demo", employeeId: "N-A-002", hospitalId: hospitalA._id, departmentId: neurology._id, shift: "evening" },
    { name: "Nurse Ravi Deshmukh", email: "ravi.deshmukh@carematrix.demo", employeeId: "N-A-003", hospitalId: hospitalA._id, departmentId: emergencyA._id, shift: "night" },
    { name: "Nurse Anjali Patil", email: "anjali.patil@carematrix.demo", employeeId: "N-B-001", hospitalId: hospitalB._id, departmentId: generalMedicine._id, shift: "morning" },
    { name: "Nurse Kavita Joshi", email: "kavita.joshi@carematrix.demo", employeeId: "N-B-002", hospitalId: hospitalB._id, departmentId: pediatrics._id, shift: "rotational" },
  ];

  const nurses = {};
  for (const def of nurseDefs) {
    const user = await User.create({
      name: def.name,
      email: def.email,
      password: DEMO_PASSWORD,
      role: "NURSE",
      phone: "9000000002",
    });
    const nurse = await Nurse.create({
      userId: user._id,
      employeeId: def.employeeId,
      hospitalId: def.hospitalId,
      departmentId: def.departmentId,
      shift: def.shift,
      qualification: "B.Sc Nursing",
    });
    nurses[def.employeeId] = { user, nurse };
  }

  return nurses;
}

async function seedPatients() {
  const names = [
    "Rahul Verma", "Anita Desai", "Suresh Menon", "Kavya Reddy", "Farhan Sheikh",
    "Neha Gupta", "Arjun Malhotra", "Pooja Nair", "Sameer Khan", "Divya Pillai",
  ];
  const patients = [];
  for (let i = 0; i < names.length; i += 1) {
    const patient = await Patient.create({
      patientId: `PT-${String(1000 + i)}`,
      name: names[i],
      dateOfBirth: new Date(1970 + i * 3, i % 12, (i % 27) + 1),
      gender: i % 2 === 0 ? "male" : "female",
      bloodGroup: ["A+", "B+", "O+", "AB+", "O-"][i % 5],
      phone: `98000000${String(i).padStart(2, "0")}`,
      address: `${i + 1} Residency Road`,
      emergencyContact: { name: "Emergency Contact", phone: "9800000099", relationship: "spouse" },
    });
    patients.push(patient);
  }
  return patients;
}

async function seedWards({ hospitalA, hospitalB, cardiology, neurology, emergencyA, generalMedicine, pediatrics }) {
  const wardDefs = [
    { hospitalId: hospitalA._id, departmentId: cardiology._id, name: "Cardiology Ward", type: "general", floor: "2nd" },
    { hospitalId: hospitalA._id, departmentId: neurology._id, name: "Neurology ICU", type: "icu", floor: "3rd" },
    { hospitalId: hospitalA._id, departmentId: emergencyA._id, name: "Emergency Ward", type: "emergency", floor: "Ground" },
    { hospitalId: hospitalB._id, departmentId: generalMedicine._id, name: "General Ward", type: "general", floor: "Ground" },
    { hospitalId: hospitalB._id, departmentId: pediatrics._id, name: "Pediatric Ward", type: "pediatric", floor: "1st" },
    { hospitalId: hospitalB._id, departmentId: generalMedicine._id, name: "Sunrise ICU", type: "icu", floor: "2nd" },
  ];
  const wards = {};
  for (const def of wardDefs) {
    const ward = await Ward.create(def);
    wards[def.name] = ward;
  }
  return wards;
}

async function seedBeds(wards) {
  const beds = {};
  for (const [wardName, ward] of Object.entries(wards)) {
    beds[wardName] = [];
    for (let i = 1; i <= 5; i += 1) {
      const bed = await Bed.create({ wardId: ward._id, bedNumber: `${ward.type.slice(0, 1).toUpperCase()}-${String(i).padStart(2, "0")}` });
      beds[wardName].push(bed);
    }
  }
  return beds;
}

async function run() {
  await connectDB();
  await clearCollections();

  const { hospitalA, hospitalB } = await seedHospitals();
  const { cardiology, neurology, emergencyA, pediatrics, generalMedicine } = await seedDepartments({
    hospitalA,
    hospitalB,
  });
  const doctors = await seedDoctors({ hospitalA, hospitalB, cardiology, neurology, emergencyA, generalMedicine, pediatrics });
  const nurses = await seedNurses({ hospitalA, hospitalB, cardiology, neurology, emergencyA, generalMedicine, pediatrics });
  const patients = await seedPatients();
  const wards = await seedWards({ hospitalA, hospitalB, cardiology, neurology, emergencyA, generalMedicine, pediatrics });
  const beds = await seedBeds(wards);

  console.log("[seed] Core entities created. Building admissions/prescriptions/tasks/observations...");

  // --- Active admissions at Hospital A (patients 0-2) ---
  const admissionCardio = await admissionService.createAdmission({
    patientId: patients[0]._id,
    hospitalId: hospitalA._id,
    departmentId: cardiology._id,
    doctorId: doctors["DOC-001"].doctor._id,
    wardId: wards["Cardiology Ward"]._id,
    bedId: beds["Cardiology Ward"][0]._id,
    reason: "Chest pain and irregular heartbeat",
  });

  const admissionNeuro = await admissionService.createAdmission({
    patientId: patients[1]._id,
    hospitalId: hospitalA._id,
    departmentId: neurology._id,
    doctorId: doctors["DOC-002"].doctor._id,
    wardId: wards["Neurology ICU"]._id,
    bedId: beds["Neurology ICU"][0]._id,
    reason: "Post-stroke observation",
  });

  const admissionEmergency = await admissionService.createAdmission({
    patientId: patients[2]._id,
    hospitalId: hospitalA._id,
    departmentId: emergencyA._id,
    doctorId: doctors["DOC-003"].doctor._id,
    wardId: wards["Emergency Ward"]._id,
    bedId: beds["Emergency Ward"][0]._id,
    reason: "Road traffic accident - observation",
  });

  // --- Active admissions at Hospital B (patients 3-4) ---
  const admissionPeds = await admissionService.createAdmission({
    patientId: patients[3]._id,
    hospitalId: hospitalB._id,
    departmentId: pediatrics._id,
    doctorId: doctors["DOC-004"].doctor._id,
    wardId: wards["Pediatric Ward"]._id,
    bedId: beds["Pediatric Ward"][0]._id,
    reason: "High fever, under observation",
  });

  const admissionGenB = await admissionService.createAdmission({
    patientId: patients[4]._id,
    hospitalId: hospitalB._id,
    departmentId: generalMedicine._id,
    doctorId: doctors["DOC-001"].doctor._id, // Dr. Sharma's Hospital B affiliation
    wardId: wards["General Ward"]._id,
    bedId: beds["General Ward"][0]._id,
    reason: "Uncontrolled hypertension",
  });

  // --- Discharged (historical) admissions (patients 5-7) ---
  const dischargedAdmissions = [];
  for (const [idx, def] of [
    { patient: patients[5], hospitalId: hospitalA._id, departmentId: cardiology._id, doctorId: doctors["DOC-001"].doctor._id, wardId: wards["Cardiology Ward"]._id, bedId: beds["Cardiology Ward"][1]._id, reason: "Routine cardiac evaluation" },
    { patient: patients[6], hospitalId: hospitalA._id, departmentId: emergencyA._id, doctorId: doctors["DOC-003"].doctor._id, wardId: wards["Emergency Ward"]._id, bedId: beds["Emergency Ward"][1]._id, reason: "Minor injury" },
    { patient: patients[7], hospitalId: hospitalB._id, departmentId: pediatrics._id, doctorId: doctors["DOC-004"].doctor._id, wardId: wards["Pediatric Ward"]._id, bedId: beds["Pediatric Ward"][1]._id, reason: "Viral infection" },
  ].map((d, i) => [i, d])) {
    const admission = await admissionService.createAdmission({
      patientId: def.patient._id,
      hospitalId: def.hospitalId,
      departmentId: def.departmentId,
      doctorId: def.doctorId,
      wardId: def.wardId,
      bedId: def.bedId,
      reason: def.reason,
    });
    await admissionService.dischargePatient(admission._id);
    dischargedAdmissions.push(admission);
  }

  // --- Patient who moved between hospitals: discharged at Hospital A,
  //     now actively admitted at Hospital B (Professor Question 4). ---
  const movedPatient = patients[8];
  const firstStay = await admissionService.createAdmission({
    patientId: movedPatient._id,
    hospitalId: hospitalA._id,
    departmentId: neurology._id,
    doctorId: doctors["DOC-002"].doctor._id,
    wardId: wards["Neurology ICU"]._id,
    bedId: beds["Neurology ICU"][1]._id,
    reason: "Initial neurological workup",
  });
  await admissionService.dischargePatient(firstStay._id);

  const secondStay = await admissionService.createAdmission({
    patientId: movedPatient._id,
    hospitalId: hospitalB._id,
    departmentId: generalMedicine._id,
    doctorId: doctors["DOC-001"].doctor._id,
    wardId: wards["General Ward"]._id,
    bedId: beds["General Ward"][1]._id,
    reason: "Follow-up care closer to home",
  });

  // patients[9] is left with no admission at all, to demonstrate the
  // "patient has no active admission" empty-state case.

  // --- Prescriptions (for active admissions) ---
  await Prescription.create({
    patientId: patients[0]._id,
    doctorId: doctors["DOC-001"].doctor._id,
    admissionId: admissionCardio._id,
    diagnosis: "Atrial fibrillation",
    medicines: [
      { name: "Metoprolol", dosage: "50mg", frequency: "Twice daily", duration: "10 days", timing: "After food" },
      { name: "Aspirin", dosage: "75mg", frequency: "Once daily", duration: "Ongoing", timing: "After breakfast" },
    ],
    instructions: "Monitor blood pressure twice daily",
  });

  await Prescription.create({
    patientId: patients[3]._id,
    doctorId: doctors["DOC-004"].doctor._id,
    admissionId: admissionPeds._id,
    diagnosis: "Viral fever",
    medicines: [{ name: "Paracetamol", dosage: "250mg", frequency: "Thrice daily", duration: "5 days", timing: "After food" }],
    instructions: "Encourage fluids, monitor temperature every 4 hours",
  });

  // --- Tasks (doctor -> nurse) ---
  await Task.create({
    title: "Check blood pressure",
    description: "Record BP every 4 hours",
    assignedBy: doctors["DOC-001"].user._id,
    assignedTo: nurses["N-A-001"].user._id,
    patientId: patients[0]._id,
    admissionId: admissionCardio._id,
    priority: "high",
    dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000),
    status: "pending",
  });

  const completedTask = await Task.create({
    title: "Administer medication",
    description: "Give scheduled Metoprolol dose",
    assignedBy: doctors["DOC-001"].user._id,
    assignedTo: nurses["N-A-001"].user._id,
    patientId: patients[0]._id,
    admissionId: admissionCardio._id,
    priority: "medium",
    dueDate: new Date(Date.now() - 60 * 60 * 1000),
    status: "completed",
    completedAt: new Date(),
  });

  await Task.create({
    title: "Monitor temperature",
    description: "Check temperature every 4 hours",
    assignedBy: doctors["DOC-004"].user._id,
    assignedTo: nurses["N-B-002"].user._id,
    patientId: patients[3]._id,
    admissionId: admissionPeds._id,
    priority: "urgent",
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    status: "pending",
  });

  // --- Observations (nurse-recorded) ---
  await Observation.create({
    patientId: patients[0]._id,
    admissionId: admissionCardio._id,
    nurseId: nurses["N-A-001"].nurse._id,
    type: "blood_pressure",
    value: "128/84",
    observedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  });
  await Observation.create({
    patientId: patients[0]._id,
    admissionId: admissionCardio._id,
    nurseId: nurses["N-A-001"].nurse._id,
    type: "heart_rate",
    value: "78 bpm",
    observedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  });
  await Observation.create({
    patientId: patients[3]._id,
    admissionId: admissionPeds._id,
    nurseId: nurses["N-B-002"].nurse._id,
    type: "temperature",
    value: "101.2°F",
    notes: "Fever persists, doctor notified",
    observedAt: new Date(Date.now() - 30 * 60 * 1000),
  });

  // --- Demo login accounts (ADMIN / PATIENT / RELATIVE) ---
  const adminUser = await User.create({
    name: "Hospital Admin (CarePlus)",
    email: "admin@carematrix.demo",
    password: DEMO_PASSWORD,
    role: "ADMIN",
    hospitalId: hospitalA._id,
  });

  const patientUser = await User.create({
    name: patients[0].name,
    email: "patient@carematrix.demo",
    password: DEMO_PASSWORD,
    role: "PATIENT",
  });
  patients[0].userId = patientUser._id;
  await patients[0].save();

  const relativeUser = await User.create({
    name: "Rohit Verma",
    email: "relative@carematrix.demo",
    password: DEMO_PASSWORD,
    role: "RELATIVE",
  });
  await PatientRelative.create({
    patientId: patients[0]._id,
    relativeUserId: relativeUser._id,
    relationship: "brother",
    isPrimaryContact: true,
    accessStatus: "approved",
  });
  // A second, still-pending request to demonstrate the approval workflow.
  const pendingRelativeUser = await User.create({
    name: "Sunita Menon",
    email: "relative.pending@carematrix.demo",
    password: DEMO_PASSWORD,
    role: "RELATIVE",
  });
  await PatientRelative.create({
    patientId: patients[2]._id,
    relativeUserId: pendingRelativeUser._id,
    relationship: "mother",
    accessStatus: "pending",
  });

  console.log("\n[seed] Done. Summary:");
  console.log(`  Hospitals: 2, Departments: 5, Doctors: 4, Nurses: 5, Patients: ${patients.length}`);
  console.log(`  Wards: ${Object.keys(wards).length}, Beds: ${Object.values(beds).flat().length}`);
  console.log(
    `  Admissions: ${5 + dischargedAdmissions.length + 2} (active: 6, discharged: ${dischargedAdmissions.length + 1})`
  );
  console.log("\n[seed] Demo accounts (password for all: " + DEMO_PASSWORD + "):");
  console.log("  ADMIN    admin@carematrix.demo            (CarePlus Medical Center)");
  console.log("  DOCTOR   sarah.sharma@carematrix.demo     (multi-hospital: CarePlus + Sunrise)");
  console.log("  DOCTOR   aditya.rao@carematrix.demo       (CarePlus / Neurology)");
  console.log("  NURSE    john.fernandes@carematrix.demo   (CarePlus / Cardiology)");
  console.log("  PATIENT  patient@carematrix.demo          (Rahul Verma - active admission at CarePlus)");
  console.log("  RELATIVE relative@carematrix.demo         (approved access to Rahul Verma)");
  console.log("  RELATIVE relative.pending@carematrix.demo (pending access - not yet approved)");

  await mongoose.connection.close();
  console.log("\n[seed] Connection closed. Exiting cleanly.");
  process.exit(0);
}

run().catch((err) => {
  console.error("[seed] Seeding failed:", err);
  process.exit(1);
});
