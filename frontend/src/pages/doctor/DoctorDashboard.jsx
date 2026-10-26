import { useEffect, useMemo, useState } from "react";
import { doctorService } from "../../services/doctorService";
import { admissionService } from "../../services/admissionService";
import { prescriptionService } from "../../services/prescriptionService";
import { taskService } from "../../services/taskService";
import { useFetch } from "../../hooks/useFetch";
import DataState from "../../components/common/DataState";
import SimpleTable from "../../components/tables/SimpleTable";
import Pagination from "../../components/common/Pagination";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import { HospitalIcon } from "../../components/icons";
import PrescriptionForm from "./forms/PrescriptionForm";
import TaskForm from "./forms/TaskForm";

const PAGE_SIZE = 10;

/**
 * PHASE 4: visual redesign only - the hospital-scoping behavior and its
 * documented limitation (see original comment, preserved below) are
 * unchanged. The hospital selector is now visually prominent (a labeled
 * context pill + dropdown) so it's unmistakable which hospital's data is
 * currently shown, per the Phase 4 spec's explicit emphasis on this.
 */
export default function DoctorDashboard() {
  const profileState = useFetch(() => doctorService.getMyProfile(), []);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [prescriptionsPage, setPrescriptionsPage] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);

  const affiliations = profileState.data?.hospitalAffiliations || [];

  useEffect(() => {
    if (affiliations.length > 0 && !selectedHospitalId) {
      setSelectedHospitalId(affiliations[0].hospitalId?._id || affiliations[0].hospitalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileState.data]);

  // IMPORTANT (unchanged from Phase 3): the backend does NOT accept a
  // hospitalId filter on GET /api/admissions for a DOCTOR-role request
  // (it always scopes to `doctorId: req.user`, regardless of query
  // params - verified directly against controllers/admissionController.js).
  // So the hospital selector filters the doctor's own already-fetched
  // admissions CLIENT-SIDE. This is real fetched data being narrowed for
  // display, not simulated data.
  const admissionsState = useFetch(
    () => admissionService.list({ status: "admitted", limit: 100 }),
    [profileState.data]
  );

  const admissionsAtSelectedHospital = useMemo(() => {
    if (!admissionsState.data) return [];
    if (!selectedHospitalId) return admissionsState.data;
    return admissionsState.data.filter(
      (a) => String(a.hospitalId?._id || a.hospitalId) === String(selectedHospitalId)
    );
  }, [admissionsState.data, selectedHospitalId]);

  const prescriptionsState = useFetch(
    () => prescriptionService.list({ page: prescriptionsPage, limit: PAGE_SIZE }),
    [profileState.data, prescriptionsPage]
  );
  const tasksState = useFetch(
    () => taskService.list({ page: tasksPage, limit: PAGE_SIZE }),
    [profileState.data, tasksPage]
  );

  const currentAffiliation = affiliations.find(
    (a) => String(a.hospitalId?._id || a.hospitalId) === String(selectedHospitalId)
  );

  return (
    <div className="dashboard doctor-dashboard">
      <DataState loading={profileState.loading} error={profileState.error} data={profileState.data} onRetry={profileState.refetch}>
        {(doctor) => (
          <>
            <PageHeader title={doctor.userId?.name} description={doctor.specialization} />

            <section style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: "var(--space-md)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", color: "var(--color-primary)" }}>
                <HospitalIcon size={20} />
                <strong>{currentAffiliation?.hospitalId?.name || "No hospital selected"}</strong>
                {currentAffiliation?.departmentId?.name && (
                  <span style={{ color: "var(--color-text-muted)" }}>· {currentAffiliation.departmentId.name}</span>
                )}
              </div>
              {affiliations.length > 1 && (
                <label style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                  Switch hospital:
                  <select value={selectedHospitalId || ""} onChange={(e) => setSelectedHospitalId(e.target.value)}>
                    {affiliations.map((a) => (
                      <option key={a.hospitalId?._id || a.hospitalId} value={a.hospitalId?._id || a.hospitalId}>
                        {a.hospitalId?.name} — {a.departmentId?.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>

            <section>
              <h3>Active Admissions</h3>
              <DataState
                loading={admissionsState.loading}
                error={admissionsState.error}
                data={admissionsAtSelectedHospital}
                onRetry={admissionsState.refetch}
                emptyMessage="No active admissions at this hospital."
              >
                {(admissions) => (
                  <>
                    <SimpleTable
                      columns={[
                        { key: "patient", label: "Patient", render: (r) => r.patientId?.name },
                        { key: "ward", label: "Ward", render: (r) => r.wardId?.name },
                        { key: "bed", label: "Bed", render: (r) => r.bedId?.bedNumber },
                        { key: "reason", label: "Reason" },
                      ]}
                      rows={admissions}
                    />
                    <PrescriptionForm admissions={admissions} onCreated={prescriptionsState.refetch} />
                    <TaskForm admissions={admissions} onCreated={tasksState.refetch} />
                  </>
                )}
              </DataState>
            </section>

            <section>
              <h3>My Prescriptions</h3>
              <DataState
                loading={prescriptionsState.loading}
                error={prescriptionsState.error}
                data={prescriptionsState.data}
                onRetry={prescriptionsState.refetch}
                emptyMessage="No prescriptions yet."
              >
                {(prescriptions) => (
                  <>
                    <SimpleTable
                      columns={[
                        { key: "patient", label: "Patient", render: (r) => r.patientId?.name },
                        { key: "diagnosis", label: "Diagnosis" },
                        { key: "medicines", label: "Medicines", render: (r) => r.medicines.map((m) => m.name).join(", ") },
                        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                      ]}
                      rows={prescriptions}
                    />
                    <Pagination pagination={prescriptionsState.pagination} onPageChange={setPrescriptionsPage} />
                  </>
                )}
              </DataState>
            </section>

            <section>
              <h3>Tasks I've Assigned</h3>
              <DataState
                loading={tasksState.loading}
                error={tasksState.error}
                data={tasksState.data}
                onRetry={tasksState.refetch}
                emptyMessage="No tasks yet."
              >
                {(tasks) => (
                  <>
                    <SimpleTable
                      columns={[
                        { key: "title", label: "Title" },
                        { key: "patient", label: "Patient", render: (r) => r.patientId?.name },
                        { key: "assignedTo", label: "Nurse", render: (r) => r.assignedTo?.name },
                        { key: "priority", label: "Priority", render: (r) => <StatusBadge status={r.priority} /> },
                        { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                      ]}
                      rows={tasks}
                    />
                    <Pagination pagination={tasksState.pagination} onPageChange={setTasksPage} />
                  </>
                )}
              </DataState>
            </section>
          </>
        )}
      </DataState>
    </div>
  );
}
