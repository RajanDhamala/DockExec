import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Upload, RotateCcw, Code2, CheckCircle2, Clock, BarChart3, X, AlertCircle, XCircle, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";

import useSocketStore from "@/ZustandStore/SocketStore";

const fetchProblems = async () => {
  const { data } = await axios.get("http://localhost:8000/code/list");
  return data.data; // returns array of problems
};

const fetchProblemDetails = async (id) => {
  const { data } = await axios.get(`http://localhost:8000/code/getProblem/${id}`);
  return data.data;
};


const fetchSubmissionData = async (problemid) => {
  const data = await axios.get(`http://localhost:8000/code/submissions/${problemid}`, {
    withCredentials: true
  })
  return data.data.data
}

// Test Results Popup Component
function TestResultsPopup({ testResults, allTestsCompleted, onClose, visible }) {
  const passedCount = testResults.filter(t => t.passed).length;
  const totalCount = testResults.length;
  const expectedTotal = testResults.length > 0 ? testResults[0].totalTestCases : 0;
  const allPassed = passedCount === expectedTotal && allTestsCompleted;

  if (!visible || testResults.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)] max-h-96 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden no-scrollbar">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Test Results</span>
          <span className={`text-xs px-2 py-1 rounded ${allPassed && allTestsCompleted ? 'bg-green-600 text-white' :
            allTestsCompleted ? 'bg-red-600 text-white' :
              'bg-yellow-600 text-white'
            }`}>
            {passedCount}/{expectedTotal}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto p-3 space-y-2 no-scrollbar">
        {testResults.map((result) => (
          <div
            key={result.testCaseId}
            className={`p-2 rounded border text-xs ${result.passed
              ? 'bg-green-900/20 border-green-600'
              : 'bg-red-900/20 border-red-600'
              }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-white">
                Test {result.testCaseNumber}
              </span>
              <div className="flex items-center gap-1">
                {result.passed ? (
                  <CheckCircle2 className="w-3 h-3 text-green-400" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400" />
                )}
                <span className="text-gray-400">
                  {(result.duration * 1000).toFixed(0)}ms
                </span>
              </div>
            </div>

            <div className="space-y-1 text-gray-300">
              <div>Expected: <span className="text-green-400 font-mono">{result.expected}</span></div>
              <div>Got: <span className={`font-mono ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                {result.actualOutput}
              </span></div>
            </div>
          </div>
        ))}

        {!allTestsCompleted && (
          <div className="text-center py-2">
            <Clock className="w-4 h-4 animate-spin mx-auto text-blue-400 mb-1" />
            <p className="text-xs text-gray-400">Running tests... ({totalCount}/{expectedTotal})</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Test Results Panel Component (for larger screens)
function TestResultsPanel({ testResults, allTestsCompleted, onClose }) {
  const passedCount = testResults.filter(t => t.passed).length;
  const totalCount = testResults.length;
  const expectedTotal = testResults.length > 0 ? testResults[0].totalTestCases : 0;
  const allPassed = passedCount === expectedTotal && allTestsCompleted;

  if (testResults.length === 0) return null;

  return (
    <div className="h-64 bg-gray-900 border-t border-gray-700 flex flex-col no-scrollbar ">
      <div className="px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">Test Results</span>
          <span className={`text-sm px-2 py-1 rounded ${allPassed && allTestsCompleted ? 'bg-green-600 text-white' :
            allTestsCompleted ? 'bg-red-600 text-white' :
              'bg-yellow-600 text-white'
            }`}>
            {passedCount}/{expectedTotal} Passed
          </span>
          {!allTestsCompleted && (
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" />
              Running...
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 faint-scrollbar">
        {testResults.map((result) => (
          <div
            key={result.testCaseId}
            className={`p-3 rounded-lg border ${result.passed
              ? 'bg-green-900/20 border-green-600'
              : 'bg-red-900/20 border-red-600'
              }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">
                Test Case {result.testCaseNumber}
              </span>
              <div className="flex items-center gap-2">
                {result.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <span className="text-red-400 text-xs font-medium">FAILED</span>
                )}
                <span className="text-xs text-gray-400">
                  {(result.duration * 1000).toFixed(0)}ms
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <div className="text-gray-300">
                <span className="text-gray-400">Input:</span> {result.input}
              </div>
              <div className="text-gray-300">
                <span className="text-gray-400">Expected:</span>
                <span className="font-mono ml-1 text-green-400">{result.expected}</span>
              </div>
              <div className="text-gray-300">
                <span className="text-gray-400">Output:</span>
                <span className={`font-mono ml-1 ${result.passed ? 'text-green-400' : 'text-red-400'
                  }`}>
                  {result.actualOutput}
                </span>
              </div>

              {result.errorMessage && (
                <div className="text-red-400 text-xs mt-2 font-mono bg-red-900/10 p-2 rounded border border-red-800">
                  <div className="text-red-300 font-semibold mb-1">Error:</div>
                  {result.errorMessage}
                </div>
              )}
            </div>
          </div>
        ))}

        {!allTestsCompleted && testResults.length > 0 && (
          <div className="text-center py-4">
            <Clock className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
            <p className="text-sm text-gray-400">Running remaining tests...</p>
            <p className="text-xs text-gray-500 mt-1">
              {testResults.length} of {expectedTotal} completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Problem Panel Component
function ProblemPanel({ problem, onProblemChange, currentProblemId, SubmissonData = [] }) {
  const [activeTab, setActiveTab] = useState("description");

  const difficultyColor = {
    Easy: "text-green-400 bg-green-400/10 border-green-400/20",
    Medium: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    Hard: "text-red-400 bg-red-400/10 border-red-400/20"
  };

  // Helper to determine status appearance
  const getStatusInfo = (item) => {
    // Logic: If passed all test cases, it's a success
    const isAllPassed = item.passedNo === item.totalTestCases && item.totalTestCases > 0;

    if (isAllPassed) {
      return {
        icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        text: "Passed",
        textClass: "text-green-400",
        bgClass: "bg-green-500/10 border-green-500/20"
      };
    } else {
      return {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        text: "Failed",
        textClass: "text-red-400",
        bgClass: "bg-red-500/10 border-red-500/20"
      };
    }
  };

  if (!problem) return <div className="p-8 text-center text-gray-500">Select a problem to view details</div>;

  return (
    <div className="h-full flex flex-col bg-gray-900 border-l border-gray-800">
      {/* Problem Selector */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <select
          value={currentProblemId}
          onChange={(e) => onProblemChange(e.target.value)}
          className="w-full bg-gray-800 text-gray-100 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:border-gray-600 transition-colors cursor-pointer"
        >
          {problem.allProblems?.map((p) => (
            <option key={p._id} value={p._id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 px-4 bg-gray-900/30">
        <button
          onClick={() => setActiveTab("description")}
          className={`px-4 py-3 text-sm font-medium transition-all relative ${activeTab === "description"
            ? "text-blue-400"
            : "text-gray-400 hover:text-gray-200"
            }`}
        >
          Description
          {activeTab === "description" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full shadow-[0_-2px_6px_rgba(59,130,246,0.5)]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("submissions")}
          className={`px-4 py-3 text-sm font-medium transition-all relative ${activeTab === "submissions"
            ? "text-blue-400"
            : "text-gray-400 hover:text-gray-200"
            }`}
        >
          Submissions
          {activeTab === "submissions" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-t-full shadow-[0_-2px_6px_rgba(59,130,246,0.5)]" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === "description" ? (
          <div className="p-4 lg:p-6 space-y-6">
            {/* Title and Difficulty */}
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">{problem.title}</h2>
              <span className={`px-2.5 py-0.5 rounded text-xs font-medium border ${difficultyColor[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
            </div>

            {/* Description */}
            <div className="text-gray-300 leading-relaxed text-sm lg:text-base whitespace-pre-wrap">
              {problem.description}
            </div>

            {/* Examples */}
            <div className="space-y-4">
              {problem.examples?.map((example, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
                  <p className="text-white font-semibold mb-3 text-sm">Example {idx + 1}</p>
                  <div className="space-y-2 text-sm font-mono">
                    <div className="flex gap-2">
                      <span className="text-gray-500 select-none min-w-[3rem]">Input:</span>
                      <span className="text-gray-300">{example.input}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-500 select-none min-w-[3rem]">Output:</span>
                      <span className="text-gray-300">{example.output}</span>
                    </div>
                    {example.explanation && (
                      <div className="flex gap-2 pt-2 border-t border-gray-700/50 mt-2">
                        <span className="text-gray-500 select-none min-w-[3rem] font-sans">Expl:</span>
                        <span className="text-gray-400 font-sans">{example.explanation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Constraints */}
            <div className="bg-gray-800/30 rounded-xl p-4">
              <p className="text-white font-semibold mb-3 text-sm">Constraints</p>
              <ul className="space-y-2 text-sm text-gray-400 list-disc list-inside">
                {problem.constraints?.map((constraint, idx) => (
                  <li key={idx} className="pl-1">{constraint}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-4 lg:p-6 h-full flex flex-col">
            {/* Problem Info Header */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-white mb-1.5">{problem.title}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${difficultyColor[problem.difficulty]}`}>
                  {problem.difficulty}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Total Submissions</div>
                <div className="text-2xl font-mono text-white">{SubmissonData.length || null}</div>
              </div>
            </div>

            {SubmissonData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                <div className="p-4 bg-gray-800/50 rounded-full">
                  <BarChart3 className="w-8 h-8 opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-400">No submissions yet</p>
                  <p className="text-sm opacity-60">Submit your code to see results here</p>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-800/80 text-gray-400 border-b border-gray-700">
                        <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
                        <th className="px-6 py-4 font-medium whitespace-nowrap">Language</th>
                        <th className="px-6 py-4 font-medium whitespace-nowrap">Score</th>
                        <th className="px-6 py-4 font-medium whitespace-nowrap">Date</th>
                        <th className="px-6 py-4 font-medium text-right whitespace-nowrap">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {SubmissonData.map((item, index) => {
                        const statusInfo = getStatusInfo(item);
                        const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        });

                        return (
                          <tr key={item._id || index} className="group hover:bg-gray-800/40 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {statusInfo.icon}
                                <span className={`font-semibold ${statusInfo.textClass}`}>
                                  {statusInfo.text}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded bg-gray-800 text-xs text-gray-400 border border-gray-700 font-mono">
                                {item.language}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                              <div className="flex items-center gap-1">
                                <span className={statusInfo.text === "Passed" ? "text-green-400" : "text-gray-200"}>
                                  {item.passedNo}
                                </span>
                                <span className="opacity-40">/</span>
                                <span>{item.totalTestCases}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                className="group/btn flex items-center gap-1 ml-auto text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
                                onClick={() => console.log("View test cases for", item._id)}
                              >
                                See More
                                <ChevronRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
}

// Console Panel Component - UPDATED to show status and execution time
function ConsolePanel({ output, isRunning, executionData }) {
  return (
    <div className="h-32 lg:h-64 bg-gray-900 border-t border-gray-700 flex flex-col">
      <div className="px-3 lg:px-4 py-2 border-b border-gray-700 flex items-center gap-2">
        <Code2 className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Console</span>
        {isRunning && (
          <span className="ml-auto text-xs text-blue-400 flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            Running...
          </span>
        )}
        {/* Show execution status and time - UPDATED for blocked status */}
        {executionData && !isRunning && (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded ${executionData.status === 'success' ? 'bg-green-600 text-white' :
              executionData.status === 'unsafe' ? 'bg-red-600 text-white' :
                'bg-red-600 text-white'
              }`}>
              {executionData.status === 'unsafe' ? 'BLOCKED' : executionData.status.toUpperCase()}
            </span>
            {executionData.duration_sec > 0 && (
              <span className="text-gray-400">
                {(executionData.duration_sec * 1000).toFixed(0)}ms
              </span>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 lg:p-4 font-mono text-xs lg:text-sm text-gray-300 whitespace-pre-wrap">
        {output.length === 0 && !executionData ? (
          <p className="text-gray-500">Run your code to see output here...</p>
        ) : (
          <div>
            {/* Show execution info first if available - UPDATED for blocked status */}
            {executionData && (
              <div className="mb-3 pb-2 border-b border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-1 rounded ${executionData.status === 'success' ? 'bg-green-900 text-green-300' :
                    executionData.status === 'unsafe' ? 'bg-red-900 text-red-300' :
                      'bg-red-900 text-red-300'
                    }`}>
                    {executionData.status === 'unsafe' ? 'BLOCKED' : executionData.status.toUpperCase()}
                  </span>
                  {executionData.duration_sec > 0 ? (
                    <span className="text-gray-400 text-xs">
                      Executed in {(executionData.duration_sec * 1000).toFixed(0)}ms
                    </span>
                  ) : executionData.reason && (
                    <span className="text-red-400 text-xs">
                      Security: {executionData.reason}
                    </span>
                  )}
                </div>
              </div>
            )}
            {/* Show output */}
            {output.map((line, idx) => <div key={idx}>{line}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

// Editor Panel Component
function EditorPanel({
  code,
  setCode,
  language,
  setLanguage,
  onRun,
  onSubmit,
  onReset,
  isRunning,
  testResults,
  showTestResults,
  setShowTestResults
}) {
  const languageOptions = [
    { value: "python", label: "Python" },
    { value: "javascript", label: "JavaScript" },
    { value: "c", label: "C" },
    { value: "go", label: "Go" },
    { value: "java", label: "Java" },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header with controls */}
      <div className="p-3 lg:p-4 border-b border-gray-700 flex items-center justify-between">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-800 text-gray-100 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {languageOptions.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          disabled={isRunning}
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>

      {/* Editor - BIGGER on mobile */}
      <div className="flex-1 border-b border-gray-700 min-h-0">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={setCode}
          options={{
            automaticLayout: true,
            fontSize: 14,
            minimap: { enabled: window.innerWidth >= 1024 },
            tabSize: 2,
            scrollBeyondLastLine: false,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: false,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
          }}
        />
      </div>

      {/* Action buttons - BETTER mobile layout */}
      <div className="p-3 lg:p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex gap-2">
          {/* Run and Submit buttons - full width on mobile */}
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px]"
          >
            <Play className="w-4 h-4" />
            Run
          </button>

          <button
            onClick={onSubmit}
            disabled={isRunning}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 lg:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px]"
          >
            <Upload className="w-4 h-4" />
            Submit
          </button>

          {/* Test Results button - only show on desktop when results exist */}
          {testResults.length > 0 && (
            <button
              onClick={() => setShowTestResults(!showTestResults)}
              className="hidden lg:flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <BarChart3 className="w-4 h-4" />
              {showTestResults ? 'Console' : 'Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Main App Component
export default function LeetCode() {
  const [currentProblemId, setCurrentProblemId] = useState(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [consoleOutput, setConsoleOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const [allTestsCompleted, setAllTestsCompleted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [executionData, setExecutionData] = useState(null); // NEW: Store execution metadata

  const { socket, initSocket, isConnected, clientId } = useSocketStore();

  // Initialize socket
  useEffect(() => {
    initSocket();
    return () => socket?.disconnect();
  }, []);

  // Fetch all problems
  const { data: problems = [] } = useQuery({
    queryKey: ["problems"],
    queryFn: fetchProblems,
  });

  // Fetch selected problem details
  const { data: currentProblem, isLoading: loadingProblem } = useQuery({
    queryKey: ["problem", currentProblemId],
    queryFn: () => fetchProblemDetails(currentProblemId),
    enabled: !!currentProblemId,
  });


  const { data: SubmissonData, isLoading: LoadingSubmission } = useQuery({
    queryKey: ["submissonData", currentProblemId],
    queryFn: () => fetchSubmissionData(currentProblemId),
    enabled: !!currentProblemId,
  })

  // Initialize code when problem or language changes
  useEffect(() => {
    if (!currentProblem) return;

    // reset editor state
    const template = currentProblem.languageTemplates?.[language] || "";
    setCode(template);
    setConsoleOutput([]);
    setTestResults([]);
    setShowTestResults(false);
    setShowPopup(false);
    setExecutionData(null);

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        console.log("save button clicked btw");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentProblem, language]);


  // Set initial problem
  useEffect(() => {
    if (problems.length > 0 && !currentProblemId) {
      setCurrentProblemId(problems[0]._id);
    }
  }, [problems]);

  // Socket event handlers
  // Socket event handlers - ADD BLOCKED RESULT HANDLER
  useEffect(() => {
    if (!socket) return;

    const handleTestResult = (data) => {
      console.log("test result executed", data);

      // Check if this is a new job - if so, reset results
      if (currentJobId !== data.jobId) {
        setCurrentJobId(data.jobId);
        setTestResults([data]);
        setAllTestsCompleted(false);
      } else {
        // Same job - update/add result (keep max 4)
        setTestResults(prev => {
          const filtered = prev.filter(r => r.testCaseNumber !== data.testCaseNumber);
          const updated = [...filtered, data].sort((a, b) => a.testCaseNumber - b.testCaseNumber);
          return updated.slice(0, 4); // Keep max 4 results
        });
      }

      // Check if all test cases are completed
      if (data.testCaseNumber === data.totalTestCases) {
        setAllTestsCompleted(true);
        setIsRunning(false);
      }

      // Show popup for all screens, panel only for desktop
      setShowPopup(true);
      if (window.innerWidth >= 1024) {
        setShowTestResults(true);
      }
    };

    const handleRunResult = (data) => {
      console.log("actually runs code res", data);

      // Store execution metadata and output
      setExecutionData({
        status: data.status,
        duration_sec: data.duration_sec || data.Duration,
        jobId: data.jobId
      });

      setConsoleOutput(prev => [...prev, data.output || data.actualOutput]);
      setIsRunning(false);
    };

    // NEW: Handle blocked execution results
    const handleBlockedResult = (data) => {
      console.log("Blocked execution:", data);

      // Set execution data to show blocked status
      setExecutionData({
        status: data.status, // "unsafe"
        reason: data.reason, // Security reason
        jobId: data.jobId || data.id,
        duration_sec: 0 // No execution time for blocked code
      });

      // Show the security block reason in console
      setConsoleOutput(prev => [
        ...prev,
        ` Code execution blocked: ${data.reason}`
      ]);

      setIsRunning(false);
    };

    socket.on("test_result", handleTestResult);
    socket.on("actual_run_result", handleRunResult);
    socket.on("blocked_result", handleBlockedResult); // NEW: Listen for blocked results

    return () => {
      socket.off("test_result", handleTestResult);
      socket.off("actual_run_result", handleRunResult);
      socket.off("blocked_result", handleBlockedResult); // NEW: Cleanup
    };
  }, [socket, currentJobId]);

  const handleProblemChange = (newProblemId) => {
    setCurrentProblemId(newProblemId);
  };

  const handleReset = () => {
    if (currentProblem) {
      const template = currentProblem.languageTemplates?.[language] || "";
      setCode(template);
      setConsoleOutput([]);
      setTestResults([]);
      setShowTestResults(false);
      setShowPopup(false);
      setCurrentJobId(null);
      setExecutionData(null); // Reset execution data
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setShowTestResults(false);
    setShowPopup(false);
    setConsoleOutput([]);
    setExecutionData(null); // Reset execution data

    const posts = await axios.post("http://localhost:8000/code/testPrint", {
      code: code,
      language: language,
      problemId: currentProblemId,
      socketId: socket.id
    }, { withCredentials: true });

    console.log("res form server", posts.data);
  };

  const submitCode = async () => {
    setIsRunning(true);
    setTestResults([]);
    setAllTestsCompleted(false);
    setCurrentJobId(null);
    setConsoleOutput([]);
    setExecutionData(null); // Reset execution data

    // Show appropriate UI based on screen size
    if (window.innerWidth >= 1024) {
      setShowTestResults(true);
    }
    setShowPopup(true);

    const posts = await axios.post("http://localhost:8000/code/Alltest_Cases", {
      code: code,
      language: language,
      problemId: currentProblemId,
      socketId: socket.id
    }, { withCredentials: true });

    console.log("res form server", posts.data);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950 relative">
      <header className="bg-gray-900 border-b border-gray-800 px-4 lg:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link to={"/"} className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-mono">
              {"{"}
            </div>
            <span className="text-white">DockExec</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            U
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Mobile: Stack vertically with better proportions */}
        <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-gray-800 overflow-hidden h-1/3 lg:h-full">
          <ProblemPanel
            problem={currentProblem ? { ...currentProblem, allProblems: problems } : { allProblems: problems }}
            onProblemChange={handleProblemChange}
            currentProblemId={currentProblemId || (problems[0]?._id)}
            SubmissonData={SubmissonData}
          />
        </div>

        {/* Editor takes 2/3 of mobile screen height */}
        <div className="w-full lg:w-1/2 flex flex-col overflow-hidden h-2/3 lg:h-full min-h-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <EditorPanel
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              onRun={runCode}
              onSubmit={submitCode}
              onReset={handleReset}
              isRunning={isRunning}
              testResults={testResults}
              showTestResults={showTestResults}
              setShowTestResults={setShowTestResults}
            />
          </div>

          {/* Console - smaller on mobile, only show on desktop with test panel */}
          {window.innerWidth >= 1024 && showTestResults && testResults.length > 0 ? (
            <TestResultsPanel
              testResults={testResults}
              allTestsCompleted={allTestsCompleted}
              onClose={() => setShowTestResults(false)}
            />
          ) : (
            <ConsolePanel
              output={consoleOutput}
              isRunning={isRunning}
              executionData={executionData} // PASS execution data to console
            />
          )}
        </div>
      </div>

      {/* Popup for all screen sizes */}
      <TestResultsPopup
        testResults={testResults}
        allTestsCompleted={allTestsCompleted}
        onClose={() => setShowPopup(false)}
        visible={showPopup}
      />
    </div>
  );
}
