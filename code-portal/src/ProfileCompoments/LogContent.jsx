import { useMemo, useState } from "react"
import { Check, Copy } from "lucide-react"
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
      return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300`
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
    default: "text-gray-900 dark:text-gray-100",
    success: "text-emerald-500 dark:text-emerald-300",
    error: "text-red-500 dark:text-red-300",
  }
  const [copied, setCopied] = useState(false)
  const content = typeof children === "string" ? children : String(children ?? "")
  const lineCount = useMemo(() => (content ? content.split(/\r?\n/).length : 1), [content])
  const height = useMemo(() => Math.min(Math.max(lineCount * 18 + 32, 160), 420), [lineCount])
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")

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
        <pre className={`font-mono bg-gray-100 dark:bg-gray-950/60 border border-gray-200 dark:border-slate-800 rounded-lg p-3 text-sm max-h-72 overflow-auto no-scrollbar whitespace-pre-wrap break-words ${toneClasses[tone]}`}>
          {content}
        </pre>
      ) : (
        <div className={`border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-950/60 ${toneClasses[tone]}`}>
          <Editor
            height={height}
            defaultLanguage={lang || "javascript"}
            value={content}
            // theme={isDark ? "vs-dark" : "vs-light"}
            theme={ "vs-dark" }
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

const LogContent = ({ data }) => {
  const list = Array.isArray(data) ? data : [data]
  return (
    <div className="space-y-4">
      {list.map((run) => (
        <LogCard key={run._id || Math.random()} run={run} />
      ))}
    </div>
  )
}

export default LogContent;
