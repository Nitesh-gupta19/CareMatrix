import LoadingState from "./LoadingState";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";

/**
 * Wraps the loading/error/empty/success branch every data-driven section
 * needs (Section "Data fetching": never leave a blank screen). `isEmpty`
 * defaults to checking for a zero-length array.
 */
export default function DataState({
  loading,
  error,
  data,
  onRetry,
  emptyMessage,
  loadingLabel,
  isEmpty = (d) => Array.isArray(d) && d.length === 0,
  children,
}) {
  if (loading) return <LoadingState label={loadingLabel} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (data == null || isEmpty(data)) return <EmptyState message={emptyMessage} />;
  return children(data);
}
