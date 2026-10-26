import { useState } from "react";
import { useFetch } from "../../../hooks/useFetch";
import { relativeService } from "../../../services/relativeService";
import { useToast } from "../../../context/ToastContext";
import DataState from "../../../components/common/DataState";
import SimpleTable from "../../../components/tables/SimpleTable";
import StatusBadge from "../../../components/ui/StatusBadge";
import Button from "../../../components/ui/Button";

/**
 * Required by Section 10 of the Phase 3 rebuild spec: a real ADMIN
 * workflow for pending/approved/revoked relative-access requests, not
 * just the underlying service call left unused. Every action here still
 * goes through the real PATCH /api/relatives/:id endpoint, which
 * re-verifies the patient has history at the admin's own hospital before
 * allowing the change (see relativeController.updateAccessStatus).
 */
export default function RelativeApprovalPanel() {
  const linksState = useFetch(() => relativeService.list(), []);
  const [actionError, setActionError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { push } = useToast();

  async function setStatus(link, accessStatus) {
    setActionError(null);
    setBusyId(link._id);
    try {
      await relativeService.updateAccessStatus(link._id, { accessStatus });
      push(`Access ${accessStatus} for ${link.relativeUserId?.name || "relative"}.`);
      linksState.refetch();
    } catch (err) {
      // Previously a failed request here (e.g. a patient whose admission
      // history no longer matches this admin's hospital) failed silently
      // - the Approve/Revoke button would appear to do nothing.
      setActionError(err.message);
      push(err.message, { tone: "error" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <h3>Relative Access Requests</h3>
      {actionError && <p className="form-error">{actionError}</p>}
      <DataState
        loading={linksState.loading}
        error={linksState.error}
        data={linksState.data}
        onRetry={linksState.refetch}
        emptyMessage="No relative access requests for your hospital's patients."
      >
        {(links) => (
          <SimpleTable
            columns={[
              { key: "relative", label: "Relative", render: (r) => r.relativeUserId?.name },
              { key: "patient", label: "Patient", render: (r) => r.patientId?.name },
              { key: "relationship", label: "Relationship" },
              { key: "status", label: "Status", render: (r) => <StatusBadge status={r.accessStatus} /> },
              {
                key: "actions",
                label: "Actions",
                render: (r) => (
                  <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                    {r.accessStatus !== "approved" && (
                      <Button size="sm" loading={busyId === r._id} onClick={() => setStatus(r, "approved")}>
                        Approve
                      </Button>
                    )}
                    {r.accessStatus !== "revoked" && (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={busyId === r._id}
                        onClick={() => setStatus(r, "revoked")}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={links}
          />
        )}
      </DataState>
    </section>
  );
}
