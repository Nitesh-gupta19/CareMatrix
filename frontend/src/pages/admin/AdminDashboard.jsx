import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { hospitalService } from "../../services/hospitalService";
import { departmentService } from "../../services/departmentService";
import { doctorService } from "../../services/doctorService";
import { nurseService } from "../../services/nurseService";
import { patientService } from "../../services/patientService";
import { wardService } from "../../services/wardService";
import { bedService } from "../../services/bedService";
import { admissionService } from "../../services/admissionService";
import StatCard from "../../components/common/StatCard";
import DataState from "../../components/common/DataState";
import SimpleTable from "../../components/tables/SimpleTable";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import {
  DepartmentIcon,
  DoctorIcon,
  NurseIcon,
  PatientIcon,
  AdmissionIcon,
  BedIcon,
} from "../../components/icons";
import DepartmentForm from "./forms/DepartmentForm";
import DoctorForm from "./forms/DoctorForm";
import NurseForm from "./forms/NurseForm";
import WardForm from "./forms/WardForm";
import BedForm from "./forms/BedForm";
import RelativeApprovalPanel from "./forms/RelativeApprovalPanel";
import PatientsSection from "./PatientsSection";
import AdmissionsSection from "./AdmissionsSection";

/**
 * PHASE 4: visual redesign only. All data-fetching, scoping, and
 * aggregation logic below is byte-for-byte the same as the Phase 3
 * version - see the original comments, preserved in full, for why bed
 * counts are computed client-side and why stat totals use
 * `pagination.total` instead of `.data.length`.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const hospitalId = user.hospitalId;

  const [state, setState] = useState({ loading: true, error: null, data: null });

  const loadAll = useCallback(async () => {
    setState({ loading: true, error: null, data: null });
    try {
      const [hospitalRes, deptRes, doctorRes, nurseRes, patientRes, wardRes, admissionRes] =
        await Promise.all([
          hospitalService.get(hospitalId),
          departmentService.list({ hospitalId, limit: 50 }),
          doctorService.list({ hospitalId, limit: 50 }),
          nurseService.list({ hospitalId, limit: 50 }),
          patientService.list({ limit: 1 }),
          wardService.list({ hospitalId, limit: 50 }),
          admissionService.list({ status: "admitted", limit: 1 }),
        ]);

      const wards = wardRes.data || [];
      const bedResults = await Promise.all(
        wards.map((ward) => bedService.list({ wardId: ward._id, limit: 100 }))
      );
      const allBeds = bedResults.flatMap((r) => r.data || []);
      const occupied = allBeds.filter((b) => b.status === "occupied").length;
      const available = allBeds.filter((b) => b.status === "available").length;

      setState({
        loading: false,
        error: null,
        data: {
          hospital: hospitalRes.data,
          departments: deptRes.data || [],
          doctors: doctorRes.data || [],
          nurses: nurseRes.data || [],
          wards,
          beds: allBeds,
          occupied,
          available,
          activePatientsTotal: patientRes.pagination?.total ?? 0,
          activeAdmissionsTotal: admissionRes.pagination?.total ?? 0,
        },
      });
    } catch (error) {
      setState({ loading: false, error, data: null });
    }
  }, [hospitalId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="dashboard admin-dashboard">
      <DataState
        loading={state.loading}
        error={state.error}
        data={state.data}
        onRetry={loadAll}
        isEmpty={() => false}
      >
        {(data) => (
          <>
            <PageHeader title={data.hospital.name} description="Hospital operations overview" />

            <div className="stat-grid">
              <StatCard label="Departments" value={data.departments.length} icon={<DepartmentIcon />} />
              <StatCard label="Doctors" value={data.doctors.length} icon={<DoctorIcon />} />
              <StatCard label="Nurses" value={data.nurses.length} icon={<NurseIcon />} />
              <StatCard label="Active Patients" value={data.activePatientsTotal} icon={<PatientIcon />} />
              <StatCard label="Active Admissions" value={data.activeAdmissionsTotal} icon={<AdmissionIcon />} />
              <StatCard label="Occupied Beds" value={data.occupied} icon={<BedIcon />} />
              <StatCard label="Available Beds" value={data.available} icon={<BedIcon />} />
            </div>

            <section>
              <h3>Departments</h3>
              {data.departments.length === 0 ? (
                <p>No departments yet.</p>
              ) : (
                <SimpleTable
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "code", label: "Code" },
                    { key: "floor", label: "Floor" },
                    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                  ]}
                  rows={data.departments}
                />
              )}
              <DepartmentForm hospitalId={hospitalId} onCreated={loadAll} />
            </section>

            <section>
              <h3>Doctors</h3>
              {data.doctors.length === 0 ? (
                <p>No doctors yet.</p>
              ) : (
                <SimpleTable
                  columns={[
                    { key: "name", label: "Name", render: (r) => r.userId?.name },
                    { key: "doctorCode", label: "Code" },
                    { key: "specialization", label: "Specialization" },
                    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                  ]}
                  rows={data.doctors}
                />
              )}
              <DoctorForm hospitalId={hospitalId} departments={data.departments} onCreated={loadAll} />
            </section>

            <section>
              <h3>Nurses</h3>
              {data.nurses.length === 0 ? (
                <p>No nurses yet.</p>
              ) : (
                <SimpleTable
                  columns={[
                    { key: "name", label: "Name", render: (r) => r.userId?.name },
                    { key: "employeeId", label: "Employee ID" },
                    { key: "shift", label: "Shift" },
                    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                  ]}
                  rows={data.nurses}
                />
              )}
              <NurseForm hospitalId={hospitalId} departments={data.departments} onCreated={loadAll} />
            </section>

            <section>
              <h3>Wards</h3>
              {data.wards.length === 0 ? (
                <p>No wards yet.</p>
              ) : (
                <SimpleTable
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "type", label: "Type" },
                    { key: "floor", label: "Floor" },
                  ]}
                  rows={data.wards}
                />
              )}
              <WardForm hospitalId={hospitalId} departments={data.departments} onCreated={loadAll} />
            </section>

            <section>
              <h3>Beds</h3>
              {data.beds.length === 0 ? (
                <p>No beds yet.</p>
              ) : (
                <SimpleTable
                  columns={[
                    { key: "bedNumber", label: "Bed #" },
                    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                  ]}
                  rows={data.beds}
                />
              )}
              <BedForm wards={data.wards} onCreated={loadAll} />
            </section>

            <PatientsSection />

            <AdmissionsSection
              hospitalId={hospitalId}
              departments={data.departments}
              doctors={data.doctors}
              wards={data.wards}
            />

            <RelativeApprovalPanel />
          </>
        )}
      </DataState>
    </div>
  );
}
