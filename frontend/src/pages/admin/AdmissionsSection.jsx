import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { admissionService } from "../../services/admissionService";
import { useToast } from "../../context/ToastContext";
import DataState from "../../components/common/DataState";
import SimpleTable from "../../components/tables/SimpleTable";
import Pagination from "../../components/common/Pagination";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import AdmissionForm from "./forms/AdmissionForm";
import TransferForm from "./forms/TransferForm";

const PAGE_SIZE = 10;

export default function AdmissionsSection({ hospitalId, departments, doctors, wards }) {
  const [page, setPage] = useState(1);
  const [transferringId, setTransferringId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [confirmingDischarge, setConfirmingDischarge] = useState(null); // admission row, or null
  const [discharging, setDischarging] = useState(false);
  const { push } = useToast();
  const { data, pagination, loading, error, refetch } = useFetch(
    () => admissionService.list({ status: "admitted", page, limit: PAGE_SIZE }),
    [page]
  );

  async function confirmDischarge() {
    if (!confirmingDischarge) return;
    setActionError(null);
    setDischarging(true);
    try {
      await admissionService.discharge(confirmingDischarge._id);
      push(`${confirmingDischarge.patientId?.name || "Patient"} discharged - bed is now available.`);
      setConfirmingDischarge(null);
      refetch();
    } catch (err) {
      setActionError(err.message);
      push(err.message, { tone: "error" });
    } finally {
      setDischarging(false);
    }
  }

  return (
    <section>
      <h3>Active Admissions</h3>
      {actionError && <p className="form-error">{actionError}</p>}
      <DataState loading={loading} error={error} data={data} onRetry={refetch} emptyMessage="No active admissions.">
        {(admissions) => (
          <>
            <SimpleTable
              columns={[
                { key: "patient", label: "Patient", render: (r) => r.patientId?.name },
                { key: "department", label: "Department", render: (r) => r.departmentId?.name },
                { key: "doctor", label: "Doctor", render: (r) => r.doctorId?.userId?.name },
                { key: "ward", label: "Ward", render: (r) => r.wardId?.name },
                { key: "bed", label: "Bed", render: (r) => r.bedId?.bedNumber },
                {
                  key: "actions",
                  label: "Actions",
                  render: (r) => (
                    <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
                      <Button variant="danger" size="sm" onClick={() => setConfirmingDischarge(r)}>
                        Discharge
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setTransferringId(transferringId === r._id ? null : r._id)}
                      >
                        {transferringId === r._id ? "Cancel" : "Transfer"}
                      </Button>
                      {transferringId === r._id && (
                        <TransferForm
                          admission={r}
                          wards={wards}
                          onDone={() => {
                            setTransferringId(null);
                            push("Patient transferred successfully.");
                            refetch();
                          }}
                        />
                      )}
                    </div>
                  ),
                },
              ]}
              rows={admissions}
            />
            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </DataState>
      <AdmissionForm hospitalId={hospitalId} departments={departments} doctors={doctors} wards={wards} onCreated={refetch} />

      <ConfirmDialog
        open={Boolean(confirmingDischarge)}
        title="Discharge patient"
        message={`Discharge ${confirmingDischarge?.patientId?.name || "this patient"}? Their bed will become available immediately.`}
        confirmLabel="Discharge"
        danger
        loading={discharging}
        onConfirm={confirmDischarge}
        onCancel={() => setConfirmingDischarge(null)}
      />
    </section>
  );
}
