import { useFetch } from "../../hooks/useFetch";
import { relativeService } from "../../services/relativeService";
import DataState from "../../components/common/DataState";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import { PatientIcon } from "../../components/icons";
import RelativePatientPanel from "./RelativePatientPanel";

/**
 * The frontend never lets a relative type in an arbitrary patient ID and
 * assume access - GET /api/relatives returns only the links that already
 * exist for the authenticated relative (backend-enforced), and every
 * downstream call for a specific patient's data still passes through the
 * backend's verifyRelativeAccess check regardless of what this page shows.
 */
export default function RelativeDashboard() {
  const linksState = useFetch(() => relativeService.list(), []);

  return (
    <div className="dashboard relative-dashboard">
      <PageHeader title="Family Access" description="Information for patients you're authorized to view" />
      <DataState
        loading={linksState.loading}
        error={linksState.error}
        data={linksState.data}
        onRetry={linksState.refetch}
        emptyMessage="You have no patient access requests yet."
      >
        {(links) => (
          <>
            {links.map((link) => (
              <section key={link._id}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-sm)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <PatientIcon size={20} />
                    <h3 style={{ margin: 0 }}>{link.patientId?.name}</h3>
                    <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-small)" }}>
                      ({link.relationship})
                    </span>
                  </div>
                  <StatusBadge status={link.accessStatus} />
                </div>
                {link.accessStatus === "approved" ? (
                  <RelativePatientPanel patientId={link.patientId?._id || link.patientId} />
                ) : (
                  <p style={{ color: "var(--color-text-muted)" }}>
                    Awaiting hospital approval before patient information can be shown here.
                  </p>
                )}
              </section>
            ))}
          </>
        )}
      </DataState>
    </div>
  );
}
