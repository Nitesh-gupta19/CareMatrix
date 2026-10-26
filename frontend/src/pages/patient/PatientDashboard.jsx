import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { patientService } from "../../services/patientService";
import { admissionService } from "../../services/admissionService";
import { prescriptionService } from "../../services/prescriptionService";
import { observationService } from "../../services/observationService";
import DataState from "../../components/common/DataState";
import SimpleTable from "../../components/tables/SimpleTable";
import Pagination from "../../components/common/Pagination";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import InfoList from "../../components/ui/InfoList";

const PAGE_SIZE = 10;

/**
 * IMPORTANT (unchanged from Phase 3): this page never reads a
 * "Patient.hospitalId" - that field does not exist. Current location
 * comes exclusively from GET /api/admissions?status=admitted, which the
 * backend already scopes to the authenticated patient automatically.
 * This page never accepts a patient ID from the URL or user input.
 */
export default function PatientDashboard() {
  const profileState = useFetch(() => patientService.getMyProfile(), []);
  const admissionsState = useFetch(() => admissionService.list({ status: "admitted", limit: 5 }), []);
  const [prescriptionsPage, setPrescriptionsPage] = useState(1);
  const prescriptionsState = useFetch(
    () => prescriptionService.list({ page: prescriptionsPage, limit: PAGE_SIZE }),
    [prescriptionsPage]
  );

  const currentAdmission = admissionsState.data?.[0] || null;
  const observationsState = useFetch(
    () => observationService.list({ admissionId: currentAdmission._id, limit: 50 }),
    [currentAdmission?._id],
    { enabled: Boolean(currentAdmission?._id) }
  );

  return (
    <div className="dashboard patient-dashboard">
      <DataState loading={profileState.loading} error={profileState.error} data={profileState.data} onRetry={profileState.refetch}>
        {(patient) => <PageHeader title={`Welcome, ${patient.name}`} description={`Patient ID: ${patient.patientId}`} />}
      </DataState>

      <section>
        <h3>Current Admission</h3>
        <DataState
          loading={admissionsState.loading}
          error={admissionsState.error}
          data={currentAdmission}
          onRetry={admissionsState.refetch}
          isEmpty={(d) => !d}
          emptyMessage="You have no current admission."
        >
          {(admission) => (
            <InfoList
              items={[
                { label: "Hospital", value: admission.hospitalId?.name },
                { label: "Department", value: admission.departmentId?.name },
                { label: "Doctor", value: admission.doctorId?.userId?.name },
                { label: "Ward", value: admission.wardId?.name },
                { label: "Bed", value: admission.bedId?.bedNumber },
                { label: "Admitted", value: new Date(admission.admissionDate).toLocaleDateString() },
                { label: "Reason", value: admission.reason },
              ]}
            />
          )}
        </DataState>
      </section>

      <section>
        <h3>Current Condition &amp; Nursing Observations</h3>
        {!currentAdmission ? (
          <p className="cm-muted">Nursing observations will appear here when you have an active admission.</p>
        ) : (
          <DataState
            loading={observationsState.loading}
            error={observationsState.error}
            data={observationsState.data}
            onRetry={observationsState.refetch}
            emptyMessage="No nursing observations have been recorded for this admission yet."
          >
            {(observations) => (
              <SimpleTable
                columns={[
                  { key: "observedAt", label: "Date & time", render: (r) => new Date(r.observedAt).toLocaleString() },
                  { key: "type", label: "Observation", render: (r) => String(r.type || "").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()) },
                  { key: "value", label: "Recorded value" },
                  { key: "notes", label: "Nurse notes" },
                ]}
                rows={observations}
              />
            )}
          </DataState>
        )}
      </section>

      <section>
        <h3>Prescriptions &amp; Treatment</h3>
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
                  { key: "diagnosis", label: "Diagnosis" },
                  { key: "medicines", label: "Medicines", render: (r) => r.medicines.map((m) => `${m.name} (${m.dosage})`).join(", ") },
                  { key: "instructions", label: "Instructions" },
                  { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                ]}
                rows={prescriptions}
              />
              <Pagination pagination={prescriptionsState.pagination} onPageChange={setPrescriptionsPage} />
            </>
          )}
        </DataState>
      </section>
    </div>
  );
}
