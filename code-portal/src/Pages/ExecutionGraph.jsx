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

const languageColors = {
  javascript: "#F59E0B", // Amber
  python: "#3B82F6",     // Blue
  java: "#8B5CF6",       // Purple
  c: "#EF4444",          // Red
  go: "#10B981",          // Green
  others: "#0EA5E9"      // Sky Blue
};

const getLanguageColor = (lang) => languageColors[lang.toLowerCase()] || languageColors.others;

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


if (isLoading) return <ExecutionGraphSkeleton />;

if (isError) return <ErrorState />;

if (!data?.data || data.data.length === 0)
  return <EmptyExecutionState />;


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


const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-gray-800 text-white p-2 rounded border border-gray-600">
      <div className="font-semibold mb-1">
        Test Case: {label}
      </div>

      {payload.map((entry) => {
        const lang = entry.dataKey.replace("_time", "");
        const row = entry.payload; 
        const success = row?.[`${lang}_success`];

        return (
          <div key={entry.dataKey} className="flex justify-between gap-2 text-sm">
            <span style={{ color: entry.color }}>
              {lang}
            </span>
            <span>
              {entry.value}s
              {success !== undefined && (
                <span className="text-gray-400">
                  {" "}• passed {success}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};


  const allLanguages = [...new Set(data.data.map(d => d.language.toLowerCase()))];

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

            {allLanguages.map(lang => (
              <Bar
                key={lang}
                dataKey={`${lang}_time`}
                name={`${lang} Avg Time`}
                fill={getLanguageColor(lang)}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


const ExecutionGraphSkeleton = () => {
  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-gray-700 space-y-4 animate-pulse">
      <div className="h-5 w-56 bg-gray-700 rounded" />

      <div className="h-[400px] flex items-end gap-4 px-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-8 bg-gray-700 rounded-md"
            style={{ height: `${40 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
};


const EmptyExecutionState = () => {
  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 text-center space-y-3">
      <h3 className="text-gray-200 text-lg font-semibold">
        No execution data available
      </h3>
      <p className="text-gray-400 text-sm">
        Submit your solution by solving the problem and running test cases to
        generate execution metrics. Once submitted, your execution graph will
        appear here.
      </p>
    </div>
  );
};

const ErrorState = () => {
  return (
    <div className="bg-gray-900 p-4 rounded-xl border border-red-700 text-red-400">
      Failed to load execution metrics. Please try again later.
    </div>
  );
};

export default ExecutionGraph;
