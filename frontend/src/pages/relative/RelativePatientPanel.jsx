import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { admissionService } from "../../services/admissionService";
import { prescriptionService } from "../../services/prescriptionService";
import DataState from "../../components/common/DataState";
import SimpleTable from "../../components/tables/SimpleTable";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/ui/StatusBadge";
import InfoList from "../../components/ui/InfoList";

const PAGE_SIZE = 10;

export default function RelativePatientPanel({ patientId }) {
  const admissionsState = useFetch(
    () => admissionService.list({ patientId, status: "admitted", limit: 5 }),
    [patientId]
  );
  const [prescriptionsPage, setPrescriptionsPage] = useState(1);
  const prescriptionsState = useFetch(
    () => prescriptionService.list({ patientId, page: prescriptionsPage, limit: PAGE_SIZE }),
    [patientId, prescriptionsPage]
  );

  const currentAdmission = admissionsState.data?.[0] || null;

  return (
    <div>
      <h4>Current Admission</h4>
      <DataState
        loading={admissionsState.loading}
        error={admissionsState.error}
        data={currentAdmission}
        onRetry={admissionsState.refetch}
        isEmpty={(d) => !d}
        emptyMessage="No current admission."
      >
        {(admission) => (
          <InfoList
            items={[
              { label: "Hospital", value: admission.hospitalId?.name },
              { label: "Department", value: admission.departmentId?.name },
              { label: "Doctor", value: admission.doctorId?.userId?.name },
              { label: "Ward", value: admission.wardId?.name },
              { label: "Bed", value: admission.bedId?.bedNumber },
            ]}
          />
        )}
      </DataState>

      <h4>Prescriptions</h4>
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
                { key: "medicines", label: "Medicines", render: (r) => r.medicines.map((m) => m.name).join(", ") },
                { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              ]}
              rows={prescriptions}
            />
            <Pagination pagination={prescriptionsState.pagination} onPageChange={setPrescriptionsPage} />
          </>
        )}
      </DataState>
    </div>
  );
}
