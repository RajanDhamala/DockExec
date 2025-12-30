import { useQuery } from "@tanstack/react-query";
import LogContent from "./LogContent.jsx";
import {
  getAvgProblemLogs,
  getPrintLogs,
  getProgrammizOutput,
  getRecentProblemLogs,
} from "./HelperFxns.js";


const LogsDialog = ({ open, onClose, type, id }) => {
  const fetchLogsByType = async () => {
    console.log("fetch logs:", type, id);

    switch (type) {
      case "avgTestCase":
        return getAvgProblemLogs(id);

      case "printCase":
        return getPrintLogs(id);

      case "programmizCase":
        return getProgrammizOutput(id);

      case "recentCase":
        return getRecentProblemLogs(id)

      default:
        throw new Error("Invalid log type");
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["logs", type, id],
    queryFn: fetchLogsByType,
    enabled: open && !!id,
  });

  if (!open) return null;

  // Handle different response structures
  const logs = type === "programmizCase" && data?.data
    ? [data.data]
    : type === "recentCase" && data?.data
      ? [data.data]  // recentCase also returns single object in data
      : data?.data || [];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 h-[100vh]"
      />

      {/* Dialog */}
      <div
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vw] sm:w-[82vw] max-w-6xl h-[82vh] bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-gray-900/70 rounded-t-xl">
          <h2 className="text-lg font-semibold capitalize text-gray-900 dark:text-slate-100">{type} logs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto  p-4 sm:p-6 space-y-3 bg-white dark:bg-gray-900">
          {isLoading && <p className="text-gray-600 dark:text-gray-300">Loading logs...</p>}
          {isError && <p className="text-red-600 dark:text-red-400">Failed to load logs</p>}

          {logs.length > 0 ? (
            <LogContent data={logs} type={type} />
          ) : (
            !isLoading && !isError && (
              <div className="w-full rounded-lg border border-dashed border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-gray-900/60 p-6 text-center text-gray-600 dark:text-slate-300">
                No log entries found.
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default LogsDialog;
