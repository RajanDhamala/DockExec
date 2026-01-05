import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";


const colors = {
  javascript: "#F59E0B", // Amber
  python: "#3B82F6",     // Blue
  // go: "#10B981",         // Green
  // c: "#EF4444",          // Red
  // java: "#8B5CF6",       // Purple
  // others: "#0EA5E9"         // Sky Blue
};


const ExecutionGraph = ({ problemId }) => {
  const getRuntimeMetrics = async () => {
    const res = await axios.get(
      `http://localhost:8000/users/exeTime/all/${problemId}`,
      { withCredentials: true }
    );
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["runtime", problemId],
    queryFn: getRuntimeMetrics,
    enabled: !!problemId
  });

  if (isLoading) return <div className="p-4 text-gray-300">Loading metrics...</div>;
  if (isError) return <div className="p-4 text-red-400">Failed to load metrics</div>;

  const testCaseNumbers = [...new Set(data.data.map(d => d.testCaseNumber))];
  const groupedData = testCaseNumbers.map(tc => {
    const obj = { testCaseNumber: tc };
    data.data.forEach(item => {
      if (item.testCaseNumber === tc) {
        obj[item.language] = {
          avgTime: item.avgExecutionTime,
          successRuns: item.successRuns
        };
        obj[item.language + "_time"] = item.avgExecutionTime;
        obj[item.language + "_success"] = item.successRuns;
      }
    });
    return obj;
  });

  // Custom tooltip to show avgTime + successRuns
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
      <div className="bg-gray-800 text-white p-2 rounded border border-gray-600">
        <div>Test Case: {label}</div>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex justify-between gap-2">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span>
              {entry.value}s, success: {groupedData[label - 1][entry.dataKey.replace("_time", "_success")]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 space-y-4">
      <h2 className="text-gray-100 text-lg font-semibold">
        Execution Time per Test Case
      </h2>

      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={groupedData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

            <XAxis
              dataKey="testCaseNumber"
              stroke="#E5E7EB"
              label={{
                value: "Test Case Number",
                position: "insideBottom",
                offset: 5,
                fill: "#E5E7EB"
              }}
            />

            <YAxis
              stroke="#E5E7EB"
              label={{
                value: "Avg Execution Time (s)",
                angle: -90,
                position: "insideLeft",
                fill: "#E5E7EB"
              }}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Legend wrapperStyle={{ color: "#E5E7EB" }} />

            {Object.keys(colors).map(lang => (
              <Bar
                key={lang}
                dataKey={`${lang}_time`}
                name={`${lang} Avg Time`}
                fill={colors[lang]}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExecutionGraph;
