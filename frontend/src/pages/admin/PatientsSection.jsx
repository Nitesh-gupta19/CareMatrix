import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { patientService } from "../../services/patientService";
import DataState from "../../components/common/DataState";
import SimpleTable from "../../components/tables/SimpleTable";
import Pagination from "../../components/common/Pagination";
import StatusBadge from "../../components/ui/StatusBadge";
import PatientForm from "./forms/PatientForm";

const PAGE_SIZE = 10;

export default function PatientsSection() {
  const [page, setPage] = useState(1);
  const { data, pagination, loading, error, refetch } = useFetch(
    () => patientService.list({ page, limit: PAGE_SIZE }),
    [page]
  );

  return (
    <section>
      <h3>Patients (active admission at this hospital)</h3>
      <DataState loading={loading} error={error} data={data} onRetry={refetch} emptyMessage="No active patients.">
        {(patients) => (
          <>
            <SimpleTable
              columns={[
                { key: "patientId", label: "Patient ID" },
                { key: "name", label: "Name" },
                { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
              ]}
              rows={patients}
            />
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </DataState>
      <PatientForm onCreated={refetch} />
    </section>
  );
}
