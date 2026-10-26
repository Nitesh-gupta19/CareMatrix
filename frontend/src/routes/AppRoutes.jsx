import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";
import AuthenticatedLayout from "../components/layout/AuthenticatedLayout";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import AdminDashboard from "../pages/admin/AdminDashboard";
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import NurseDashboard from "../pages/nurse/NurseDashboard";
import PatientDashboard from "../pages/patient/PatientDashboard";
import RelativeDashboard from "../pages/relative/RelativeDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route element={<RoleRoute allow={["ADMIN"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route element={<RoleRoute allow={["DOCTOR"]} />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
          </Route>
          <Route element={<RoleRoute allow={["NURSE"]} />}>
            <Route path="/nurse" element={<NurseDashboard />} />
          </Route>
          <Route element={<RoleRoute allow={["PATIENT"]} />}>
            <Route path="/patient" element={<PatientDashboard />} />
          </Route>
          <Route element={<RoleRoute allow={["RELATIVE"]} />}>
            <Route path="/relative" element={<RelativeDashboard />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
