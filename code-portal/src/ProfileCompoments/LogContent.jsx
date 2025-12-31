import { useMemo, useState } from "react"
import { Check, Copy, CheckCircle2, XCircle, Clock, Hash } from "lucide-react"
import Editor from "@monaco-editor/react"

const badgeByStatus = (status) => {
  const base = "px-2 py-1 text-xs font-medium rounded-full"
  switch ((status || "").toLowerCase()) {
    case "success":
    case "executed":
      return `${base} bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300`
    case "error":
    case "failed":
      return `${base} bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300`
    case "running":
      return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark: text-blue-300`
    default:
      return `${base} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200`
  }
}

const formatDate = (d) => {
  if (!d) return "-"
  const parsed = new Date(d)
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString()
}

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-900 dark:text-slate-100 break-words">{value ?? "-"}</span>
  </div>
)

const CodeBlock = ({ title, children, lang, tone = "default" }) => {
  const toneClasses = {
    default: "text-gray-900 dark: text-gray-100",
    success: "text-emerald-500 dark:text-emerald-300",
    error: "text-red-500 dark: text-red-300",
  }
  const [copied, setCopied] = useState(false)
  const content = typeof children === "string" ? children : String(children ?? "")
  const lineCount = useMemo(() => (content ? content.split(/\r?\n/).length : 1), [content])
  const height = useMemo(() => Math.min(Math.max(lineCount * 18 + 32, 160), 420), [lineCount])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch (err) {
      console.error("copy failed", err)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">{title}</p>
        <div className="flex items-center gap-2">
          {lang && <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-700">{lang}</span>}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      {lang === "text" ? (
        <pre className={`font-mono bg-gray-100 dark: bg-gray-950/60 border border-gray-200 dark:border-slate-800 rounded-lg p-3 text-sm max-h-72 overflow-auto no-scrollbar whitespace-pre-wrap break-words ${toneClasses[tone]}`}>
          {content}
        </pre>
      ) : (
        <div className={`border border-gray-200 dark: border-slate-800 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-950/60 ${toneClasses[tone]}`}>
          <Editor
            height={height}
            defaultLanguage={lang || "javascript"}
            value={content}
            theme="vs-dark"
            options={{
              readOnly: true,
              domReadOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              lineNumbers: "on",
              renderLineHighlight: "none",
              scrollbar: { vertical: "auto", horizontal: "auto" },
              overviewRulerBorder: false,
              automaticLayout: true,
            }}
          />
        </div>
      )}
    </div>
  )
}

// New component for individual test case card
const TestCaseCard = ({ testCase }) => {
  const { testCaseNumber, input, expectedOutput, userOutput, duration, isPassed, executedAt } = testCase

  return (
    <div className={`rounded-lg border ${isPassed ? 'border-green-200 dark:border-green-800/50' : 'border-red-200 dark:border-red-800/50'} bg-white dark:bg-gray-900/60 p-4 space-y-3 transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isPassed ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
            <Hash className={`h-4 w-4 ${isPassed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
          </div>
          <span className="font-semibold text-gray-900 dark:text-slate-100">Test Case {testCaseNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          {isPassed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              <CheckCircle2 className="h-3. 5 w-3.5" />
              Passed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark: bg-red-900/40 dark:text-red-300">
              <XCircle className="h-3.5 w-3.5" />
              Failed
            </span>
          )}
        </div>
      </div>

      {/* Meta info row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{(duration * 1000).toFixed(2)} ms</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Executed:  {formatDate(executedAt)}</span>
        </div>
      </div>

      {/* Input/Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Input */}
        <div className="space-y-1. 5">
          <span className="text-xs uppercase tracking-[0.08em] text-gray-500 dark: text-gray-400 font-medium">Input</span>
          <div className="bg-gray-50 dark:bg-gray-950/60 border border-gray-200 dark: border-slate-800 rounded-lg p-3 font-mono text-sm text-gray-900 dark:text-slate-100 break-all">
            {input}
          </div>
        </div>

        {/* Expected Output */}
        <div className="space-y-1.5">
          <span className="text-xs uppercase tracking-[0.08em] text-green-600 dark:text-green-400 font-medium">Expected Output</span>
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg p-3 font-mono text-sm text-green-700 dark:text-green-300 break-all">
            {expectedOutput}
          </div>
        </div>

        {/* User Output */}
        <div className="space-y-1.5">
          <span className={`text-xs uppercase tracking-[0.08em] font-medium ${isPassed ? 'text-green-600 dark: text-green-400' : 'text-red-600 dark:text-red-400'}`}>Your Output</span>
          <div className={`${isPassed ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-300' : 'bg-red-50 dark: bg-red-950/30 border-red-200 dark: border-red-800/50 text-red-700 dark: text-red-300'} border rounded-lg p-3 font-mono text-sm break-all`}>
            {userOutput || "(empty)"}
          </div>
        </div>
      </div>
    </div>
  )
}

// New component for recent case logs
const RecentCaseLogCard = ({ run }) => {
  const passedCount = run.testCases?.filter(tc => tc.isPassed).length || 0
  const totalCount = run.testCases?.length || 0

  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900/80 p-4 sm:p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{run._id?.slice(0, 8)}…</p>
          <h3 className="text-lg font-semibold text-gray-900 dark: text-slate-100">Recent Execution</h3>
        </div>
        <span className={badgeByStatus(run.status)}>{run.status || "unknown"}</span>
      </div>

      {/* Summary Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoRow label="Language" value={run.language} />
        <InfoRow label="Created" value={formatDate(run.createdAt)} />
        <InfoRow label="Total Tests" value={totalCount} />
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.08em] text-gray-500 dark: text-gray-400">Passed</span>
          <span className={`text-sm font-medium ${passedCount === totalCount ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {passedCount} / {totalCount}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1. 5">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Test Results</span>
          <span>{totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(0) : 0}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${passedCount === totalCount ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${totalCount > 0 ? (passedCount / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Code Block */}
      {run.code && (
        <CodeBlock title="Submitted Code" lang={run.language} tone="default">
          {run.code}
        </CodeBlock>
      )}

      {/* Test Cases */}
      {run.testCases && run.testCases.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 uppercase tracking-wide">Test Cases</h4>
          <div className="space-y-3">
            {run.testCases.map((tc) => (
              <TestCaseCard key={tc.caseId || tc._id} testCase={tc} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const LogCard = ({ run }) => {
  const problemTitle = run.problemId?.title || run.problemid?.title || run.title || "—"
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900/80 p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{run._id?.slice(0, 8)}…</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{problemTitle}</h3>
        </div>
        <span className={badgeByStatus(run.status || run.result)}>{run.status || run.result || "unknown"}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoRow label="Language" value={run.language} />
        <InfoRow label="Created" value={formatDate(run.createdAt)} />
        {run.totalTestCases !== undefined && <InfoRow label="Total Tests" value={run.totalTestCases} />}
        {run.passedNo !== undefined && <InfoRow label="Passed" value={run.passedNo} />}
        {run.execution_time !== undefined && <InfoRow label="Duration" value={`${Number(run.execution_time).toFixed?.(3) ?? run.execution_time}s`} />}
      </div>

      {(run.code || run.generatedCode) && (
        <CodeBlock title="Code" lang={run.language} tone="default">
          {run.code || run.generatedCode}
        </CodeBlock>
      )}
      {run.output && (
        <CodeBlock
          title="Output"
          lang={run.language}
          tone={(run.status || run.result) === "success" ? "success" : (run.status || run.result) === "error" || (run.status || run.result) === "failed" ? "error" : "default"}
        >
          {run.output}
        </CodeBlock>
      )}
    </div>
  )
}

const LogContent = ({ data, type }) => {
  const list = Array.isArray(data) ? data : [data]

  // Handle recentCase type separately
  if (type === "recentCase") {
    return (
      <div className="space-y-4">
        {list.map((run) => (
          <RecentCaseLogCard key={run._id || Math.random()} run={run} />
        ))}
      </div>
    )
  }

  // Default rendering for other types
  return (
    <div className="space-y-4">
      {list.map((run) => (
        <LogCard key={run._id || Math.random()} run={run} />
      ))}
    </div>
  )
}

export default LogContent
