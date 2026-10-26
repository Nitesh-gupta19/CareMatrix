import { useState } from "react";
import { useFetch } from "../../hooks/useFetch";
import { nurseService } from "../../services/nurseService";
import { taskService } from "../../services/taskService";
import { admissionService } from "../../services/admissionService";
import { useToast } from "../../context/ToastContext";
import DataState from "../../components/common/DataState";
import SimpleTable from "../../components/tables/SimpleTable";
import Pagination from "../../components/common/Pagination";
import PageHeader from "../../components/ui/PageHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import Button from "../../components/ui/Button";
import ObservationForm from "./forms/ObservationForm";

const NEXT_STATUS = { pending: "in_progress", in_progress: "completed" };
const PAGE_SIZE = 10;

export default function NurseDashboard() {
  const profileState = useFetch(() => nurseService.getMyProfile(), []);
  const [tasksPage, setTasksPage] = useState(1);
  const [actionError, setActionError] = useState(null);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const { push } = useToast();
  const tasksState = useFetch(() => taskService.list({ page: tasksPage, limit: PAGE_SIZE }), [tasksPage]);
  // Admissions list stays unpaginated (limit high enough for one hospital's
  // active caseload) since it also feeds the Observation form's admission
  // picker - paginating it would hide admissions from that dropdown.
  const admissionsState = useFetch(() => admissionService.list({ status: "admitted", limit: 100 }), []);

  async function advanceTask(task) {
    const next = NEXT_STATUS[task.status];
    if (!next) return;
    setActionError(null);
    setBusyTaskId(task._id);
    try {
      await taskService.updateStatus(task._id, next);
      push(`Task marked ${next.replace("_", " ")}.`);
      tasksState.refetch();
    } catch (err) {
      setActionError(err.message);
      push(err.message, { tone: "error" });
    } finally {
      setBusyTaskId(null);
    }
  }

  return (
    <div className="dashboard nurse-dashboard">
      <DataState loading={profileState.loading} error={profileState.error} data={profileState.data} onRetry={profileState.refetch}>
        {(nurse) => (
          <PageHeader
            title={nurse.userId?.name}
            description={`${nurse.hospitalId?.name} · ${nurse.departmentId?.name} · ${nurse.shift} shift`}
          />
        )}
      </DataState>

      <section>
        <h3>My Tasks</h3>
        {actionError && <p className="form-error">{actionError}</p>}
        <DataState
          loading={tasksState.loading}
          error={tasksState.error}
          data={tasksState.data}
          onRetry={tasksState.refetch}
          emptyMessage="No tasks assigned."
        >
          {(tasks) => (
            <>
              <SimpleTable
                columns={[
                  { key: "title", label: "Title" },
                  { key: "patient", label: "Patient", render: (r) => r.patientId?.name },
                  { key: "priority", label: "Priority", render: (r) => <StatusBadge status={r.priority} /> },
                  { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
                  {
                    key: "action",
                    label: "Action",
                    render: (r) =>
                      NEXT_STATUS[r.status] ? (
                        <Button size="sm" loading={busyTaskId === r._id} onClick={() => advanceTask(r)}>
                          Mark {NEXT_STATUS[r.status].replace("_", " ")}
                        </Button>
                      ) : (
                        "—"
                      ),
                  },
                ]}
                rows={tasks}
              />
              <Pagination pagination={tasksState.pagination} onPageChange={setTasksPage} />
            </>
          )}
        </DataState>
      </section>

      <section>
        <h3>Record Observation</h3>
        <DataState
          loading={admissionsState.loading}
          error={admissionsState.error}
          data={admissionsState.data}
          onRetry={admissionsState.refetch}
          emptyMessage="No active admissions at your hospital."
        >
          {(admissions) => <ObservationForm admissions={admissions} />}
        </DataState>
      </section>
    </div>
  );
}
