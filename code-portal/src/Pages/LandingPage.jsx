import { useEffect, useState } from "react"
import { motion as Motion } from "framer-motion"
import {
  Terminal, MousePointer2, Plus, Folder, FileCode,
  Search, ChevronDown, Check,
  GitBranch, Play, Container, Server, Cpu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import Navbar from "../templates/Navbar.jsx"
import Footer from "../templates/Footer.jsx"

const KEYFRAMES = `
@keyframes de-blink { 0%,45%{opacity:1} 50%,100%{opacity:0} }
@keyframes de-dash { to { stroke-dashoffset: -16; } }
@keyframes de-pulse-ring {
  0% { transform: scale(0.9); opacity: 0.7; }
  70% { transform: scale(1.8); opacity: 0; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes de-scan-y { 0%{ transform: translateY(-110%); } 100%{ transform: translateY(110%); } }
.de-blink { animation: de-blink 1.1s steps(1) infinite; }
.de-dash { animation: de-dash 0.7s linear infinite; }
.de-pulse-ring { animation: de-pulse-ring 2s ease-out infinite; }
.de-scan-y { animation: de-scan-y 2.4s ease-in-out infinite; }
`

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
}
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}
const revealProps = {
  initial: "hidden",
  whileInView: "show",
  viewport: { once: true, margin: "-60px" },
}

/* ---------- Hero: cursor demo + floating inspector ---------- */
const DEMO_CARDS = [
  {
    tag: "div.problem",
    dims: "240×120",
    css: [
      ["id", "#0001"],
      ["title", "two_sum"],
      ["difficulty", "easy"],
      ["language", "python3.11"],
      ["accepted", "2.5M"],
      ["status", "queued"],
    ],
    pos: { x: "26%", y: "34%" },
    tip: { left: "30%", top: "20%" },
  },
  {
    tag: "container.docker",
    dims: "72×24",
    css: [
      ["image", "python:3.11-slim"],
      ["memory", "128MB"],
      ["cpu", "0.5 cores"],
      ["timeout", "3000ms"],
      ["network", "disabled"],
      ["status", "running"],
    ],
    pos: { x: "70%", y: "30%" },
    tip: { left: "62%", top: "44%" },
  },
  {
    tag: "button.run",
    dims: "120×40",
    css: [
      ["action", "submit_job"],
      ["queue", "rabbitmq"],
      ["exchange", "exec.fanout"],
      ["worker", "go-runner"],
      ["cache", "redis"],
      ["result", "✓ 3/3 passed"],
    ],
    pos: { x: "40%", y: "74%" },
    tip: { left: "44%", top: "60%" },
  },
]

function CursorDemo() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % DEMO_CARDS.length), 2200)
    return () => clearInterval(t)
  }, [])

  const card = DEMO_CARDS[idx]

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-panel-md">
      {/* window header */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
        </div>
        <span className="font-mono text-[10px] text-[#9ca3af]">runtime — dockexec.io</span>
        <span className="font-mono text-[10px] text-[#06b6d4]">● live</span>
      </div>

      {/* simulated app surface */}
      <div className="pattern-grid-sm relative h-[360px] bg-[#fafafa] px-6 py-5">
        {/* card 1 — problem */}
        <div className="absolute left-[8%] top-[16%] w-[42%] rounded-lg border bg-white p-3 shadow-panel" style={{ borderColor: idx === 0 ? "#06b6d4" : "#e5e7eb" }}>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[9px] text-[#9ca3af]">#0001</span>
            <span className="font-mono text-[10px] font-medium text-[#111827]">two_sum</span>
            <span className="ml-auto rounded-sm bg-emerald-100 px-1.5 py-0.5 font-mono text-[8px] text-emerald-600">easy</span>
          </div>
          <div className="mb-1.5 h-2 w-28 rounded bg-[#f3f4f6]" />
          <div className="h-2 w-24 rounded bg-[#f3f4f6]" />
        </div>
        {/* card 2 — docker container */}
        <div className="absolute right-[12%] top-[20%] rounded-md border bg-white px-2 py-1 font-mono text-[10px] text-[#06b6d4] shadow-panel" style={{ borderColor: idx === 1 ? "#06b6d4" : "#e5e7eb" }}>
          <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-[#06b6d4] animate-pulse" />container.running</span>
        </div>
        {/* card 3 — run button */}
        <div className="absolute bottom-[14%] left-[24%] rounded-md bg-[#06b6d4] px-3 py-2 font-mono text-[10px] font-medium text-white shadow-panel">
          submit → rabbitmq
        </div>
        {/* deco — output panel */}
        <div className="absolute bottom-[16%] right-[16%] w-32 rounded-md border border-[#e5e7eb] bg-white p-2 shadow-panel">
          <div className="mb-1 font-mono text-[8px] text-[#9ca3af]">stdout</div>
          <div className="font-mono text-[9px] text-[#111827]">✓ [0, 1]</div>
        </div>

        {/* selection box on active card */}
        <Motion.div
          key={`sel-${idx}`}
          initial={false}
          animate={{ left: card.tip.left, top: card.tip.top, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="pointer-events-none absolute"
          style={{ width: 150, height: 80 }}
        >
          {/* 4px white offset + 2px cyan ring via outline */}
          <div className="h-full w-full rounded-sm outline outline-2 outline-offset-4 outline-[#06b6d4]" />
          {/* tag */}
          <div className="absolute -top-5 left-0 flex items-center gap-1 rounded-sm bg-[#06b6d4] px-1.5 py-0.5 font-mono text-[9px] text-white">
            {card.tag}
            <span className="text-white/70">· {card.dims}</span>
          </div>
        </Motion.div>

        {/* floating inspector tooltip */}
        <Motion.div
          key={`tip-${idx}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="absolute right-3 top-3 w-44 rounded-lg bg-[#111827] p-2.5 shadow-panel-md"
        >
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[9px] text-[#06b6d4]">{card.tag}</span>
            <span className="font-mono text-[8px] text-[#6b7280]">runtime</span>
          </div>
          <div className="space-y-0.5">
            {card.css.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between font-mono text-[9px] leading-4">
                <span className="text-[#9ca3af]">{k}</span>
                <span className="text-[#06b6d4]">{v}</span>
              </div>
            ))}
          </div>
        </Motion.div>

        {/* animated cursor */}
        <Motion.div
          className="pointer-events-none absolute z-20"
          initial={false}
          animate={{ left: card.pos.x, top: card.pos.y }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ translateX: "-50%", translateY: "-50%" }}
        >
          <MousePointer2 size={18} className="fill-white text-[#111827]" />
          <span className="de-blink ml-1 inline-block h-3.5 w-px bg-[#111827] align-middle" />
        </Motion.div>
      </div>
    </div>
  )
}

function HeroSection() {
  return (
    <section className="relative border-b border-[#e5e7eb] bg-[#f3f4f6]">
      <div className="pattern-grid pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* left */}
          <Motion.div variants={stagger} initial="hidden" animate="show" className="space-y-7">
            <Motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-1">
              <span className="relative flex h-2 w-2">
                <span className="de-pulse-ring absolute inline-flex h-2 w-2 rounded-full bg-[#06b6d4]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#06b6d4]" />
              </span>
              <span className="font-mono text-[11px] font-medium text-[#06b6d4]">v2.0 RELEASED</span>
            </Motion.div>

            <Motion.h1
              variants={fadeUp}
              className="font-semibold tracking-tight text-[#111827]"
              style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 0.9 }}
            >
              Run code.<br />
              <span className="text-[#06b6d4]">Microservice</span> fast.
            </Motion.h1>

            <Motion.p variants={fadeUp} className="max-w-md text-base leading-relaxed text-[#4b5563]">
              A LeetCode-style execution platform powered by a Go + Python
              microservice stack. Your submission hits RabbitMQ, spins up an
              isolated Docker container, and streams stdout back — all in under
              a second.
            </Motion.p>

            <Motion.div variants={fadeUp} className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link to="/auth/register" className="inline-block">
                <Button
                  size="lg"
                  className="h-11 gap-2 rounded-lg bg-[#06b6d4] px-5 text-white hover:bg-[#0891b2]"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3.5" fill="#fff" />
                    <path d="M12 2v4M12 18v4M22 12h-4M6 12H2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Start Solving
                </Button>
              </Link>
              <Link to="/code" className="inline-block">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 gap-2 rounded-lg border-[#d1d5db] bg-white px-5 font-mono text-xs text-[#111827] hover:border-[#06b6d4] hover:text-[#06b6d4]"
                >
                  <Play size={15} />
                  $ dockexec run
                </Button>
              </Link>
            </Motion.div>

            <Motion.div variants={fadeUp} className="flex flex-wrap gap-x-6 gap-y-2 pt-5 font-mono text-[11px] text-[#6b7280]">
              {["5 languages", "<3s timeout", "rabbitmq-queued", "redis-cached"].map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <Check size={12} className="text-[#06b6d4]" />
                  {s}
                </span>
              ))}
            </Motion.div>
          </Motion.div>

          {/* right: cursor demo */}
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          >
            <CursorDemo />
          </Motion.div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Release notes ---------- */
function ReleaseNotes() {
  const changes = [
    "Go gateway service deployed — routes submissions via RabbitMQ fanout exchange",
    "Python execution worker rewritten with Docker SDK (container cold start < 380ms)",
    "Redis sorted-set leaderboard added — global rankings update in real time",
    "Node.js auth service split out — JWT issuance + refresh now independent",
    "React frontend migrated to Vite; Monaco editor with per-language configs",
    "RabbitMQ dead-letter queue added — failed jobs retry 3× then surface errors",
    "Sandbox network egress fully disabled; memory capped at 128MB, 0.5 CPU",
  ]

  return (
    <section className="border-b border-[#e5e7eb] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-[300px_1fr] divide-x divide-[#e5e7eb]">
          {/* left */}
          <div className="py-16 pr-8 md:py-20">
            <p className="mb-3 font-mono text-[12px] font-bold uppercase tracking-[0.15em] text-[#6b7280]">
              Changelog
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
              Release notes
            </h2>
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#06b6d4]" />
              <span className="font-mono text-[11px] text-[#374151]">v2.0.0</span>
              <span className="font-mono text-[11px] text-[#9ca3af]">· stable</span>
            </div>
            <p className="mt-6 max-w-xs font-mono text-[11px] leading-relaxed text-[#6b7280]">
              // shipped 2025.07.12<br />// 7 changes · 0 breaking
            </p>
          </div>

          {/* right */}
          <Motion.div {...revealProps} variants={stagger} className="py-16 pl-8 md:py-20">
            <ul className="space-y-3.5">
              {changes.map((c, i) => (
                <Motion.li key={i} variants={fadeUp} className="flex items-start gap-3 font-mono text-sm text-[#374151]">
                  <span className="mt-0.5 select-none font-mono text-[#06b6d4]">+</span>
                  <span>{c}</span>
                </Motion.li>
              ))}
            </ul>
          </Motion.div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Interactive Workspace ---------- */
function SidebarNav() {
  const items = [
    { icon: Folder, label: "problems/", active: false, isDir: true },
    { icon: FileCode, label: "0001_two_sum.py", active: true, diff: "easy" },
    { icon: FileCode, label: "0002_reverse.go", active: false, diff: "easy" },
    { icon: FileCode, label: "0003_bsearch.js", active: false, diff: "medium" },
    { icon: FileCode, label: "0004_lru_cache.c", active: false, diff: "medium" },
    { icon: FileCode, label: "0005_merge_k.java", active: false, diff: "hard" },
    { icon: GitBranch, label: "snippets/", active: false, isDir: true },
  ]
  const diffColor = { easy: "text-emerald-500", medium: "text-amber-500", hard: "text-red-500" }
  return (
    <div className="flex h-full w-64 flex-col border-r border-[#e5e7eb] bg-[#f9fafb]">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-3 py-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b7280]">explorer</span>
        <Plus size={13} className="text-[#9ca3af]" />
      </div>
      <div className="flex-1 overflow-y-auto dev-scroll px-2 py-2">
        {items.map((it) => {
          const Icon = it.icon
          return (
            <div
              key={it.label}
              className={`mb-0.5 flex items-center gap-2 rounded-md px-2 py-1.5 font-mono text-xs ${
                it.active
                  ? "bg-[#06b6d4]/10 text-[#06b6d4]"
                  : "text-[#4b5563] hover:bg-[#f3f4f6]"
              }`}
            >
              <Icon size={13} className={it.isDir ? "text-[#9ca3af]" : ""} />
              <span className="truncate">{it.label}</span>
              {it.diff && <span className={`ml-auto text-[8px] ${diffColor[it.diff]}`}>●</span>}
              {it.active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#06b6d4]" />}
            </div>
          )
        })}
      </div>
      {/* shortcuts */}
      <div className="border-t border-[#e5e7eb] px-3 py-3">
        <span className="mb-2 block font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b7280]">
          shortcuts
        </span>
        <div className="space-y-1.5">
          {[
            ["run", ["⌘", "↵"]],
            ["submit", ["⌘", "⇧", "↵"]],
            ["format", ["⌥", "F"]],
          ].map(([label, keys]) => (
            <div key={label} className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#6b7280]">{label}</span>
              <div className="flex gap-1">
                {keys.map((k) => (
                  <span
                    key={k}
                    className="flex h-4 min-w-4 items-center justify-center rounded border border-[#d1d5db] bg-white px-1 font-mono text-[9px] text-[#374151]"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InspectorField({ label, children }) {
  return (
    <div className="grid grid-cols-[80px_1fr] items-center gap-2 py-1.5">
      <span className="font-mono text-[10px] text-[#6b7280]">{label}</span>
      <div>{children}</div>
    </div>
  )
}

function SelectBox({ value }) {
  return (
    <div className="flex h-6 w-full items-center justify-between rounded border border-[#e5e7eb] bg-white px-1.5 font-mono text-[11px] text-[#374151]">
      <span>{value}</span>
      <ChevronDown size={11} className="text-[#9ca3af]" />
    </div>
  )
}

function Inspector() {
  const [toggles, setToggles] = useState({ network: false, stdin: true, stderr: true })
  return (
    <div className="flex h-full w-80 flex-col border-l border-[#e5e7eb] bg-[#f9fafb]">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-3 py-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#6b7280]">runtime</span>
        <span className="flex items-center gap-1 font-mono text-[10px] text-[#06b6d4]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#06b6d4]" /> active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto dev-scroll px-3 py-3">
        {/* Container */}
        <div className="mb-1 flex items-center gap-2">
          <Container size={12} className="text-[#06b6d4]" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#374151]">container</span>
        </div>
        <div className="mb-4 rounded-md border border-[#e5e7eb] bg-white p-2.5">
          <InspectorField label="image">
            <SelectBox value="python:3.11-slim" />
          </InspectorField>
          <InspectorField label="memory">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 flex-1 items-center rounded border border-[#e5e7eb] bg-white px-1.5 font-mono text-[11px] text-[#374151]">
                128MB
              </div>
              <div className="flex h-4 w-1 cursor-ew-resize items-center justify-center rounded-sm bg-[#06b6d4]/20">
                <div className="h-2 w-px bg-[#06b6d4]" />
              </div>
            </div>
          </InspectorField>
          <InspectorField label="cpu">
            <div className="flex items-center gap-1.5">
              <Cpu size={11} className="text-[#6b7280]" />
              <span className="font-mono text-[11px] text-[#374151]">0.5 cores</span>
            </div>
          </InspectorField>
          <InspectorField label="timeout">
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 flex-1 items-center rounded border border-[#e5e7eb] bg-white px-1.5 font-mono text-[11px] text-[#374151]">
                3000ms
              </div>
              <div className="flex h-4 w-1 cursor-ew-resize items-center justify-center rounded-sm bg-[#06b6d4]/20">
                <div className="h-2 w-px bg-[#06b6d4]" />
              </div>
            </div>
          </InspectorField>
          <InspectorField label="flags">
            <div className="flex gap-1">
              {[
                "network",
                "stdin",
                "stderr",
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setToggles((t) => ({ ...t, [s]: !t[s] }))}
                  className={`flex h-6 w-12 items-center justify-center rounded border font-mono text-[9px] uppercase ${
                    toggles[s]
                      ? "border-[#06b6d4] bg-[#06b6d4]/10 text-[#06b6d4]"
                      : "border-[#e5e7eb] bg-white text-[#9ca3af] hover:border-[#d1d5db]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </InspectorField>
        </div>

        {/* Queue */}
        <div className="mb-1 flex items-center gap-2">
          <Server size={12} className="text-[#06b6d4]" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#374151]">queue</span>
        </div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2.5">
          <InspectorField label="broker">
            <span className="font-mono text-[11px] text-[#374151]">rabbitmq</span>
          </InspectorField>
          <InspectorField label="exchange">
            <SelectBox value="exec.fanout" />
          </InspectorField>
          <InspectorField label="routing">
            <span className="font-mono text-[11px] text-[#374151]">run.python</span>
          </InspectorField>
          <InspectorField label="workers">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-[#374151]">4 × go-runner</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
          </InspectorField>
          <InspectorField label="dlq">
            <span className="font-mono text-[11px] text-[#374151]">exec.dlq · retry 3×</span>
          </InspectorField>
          <InspectorField label="cache">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-[#374151]">redis</span>
              <span className="rounded-sm bg-[#06b6d4]/10 px-1 font-mono text-[9px] text-[#06b6d4]">sorted-set</span>
            </div>
          </InspectorField>
        </div>
      </div>
    </div>
  )
}

function Workspace() {
  return (
    <section className="border-b border-[#e5e7eb] bg-[#f3f4f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <Motion.div {...revealProps} variants={fadeUp} className="mb-8 max-w-2xl">
          <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#06b6d4]">
            // workspace
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
            The execution pipeline.
          </h2>
          <p className="mt-3 text-base text-[#4b5563]">
            Submit a solution → RabbitMQ routes it to a Go worker → Docker spins
            up an isolated container → stdout streams back → Redis caches the
            result. Inspect every stage in real time.
          </p>
        </Motion.div>

        <Motion.div
          {...revealProps}
          variants={fadeUp}
          className="flex h-[460px] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-panel-md"
        >
          {/* left sidebar */}
          <div className="hidden md:block"><SidebarNav /></div>

          {/* center stage */}
          <div className="relative flex-1 pattern-grid bg-[#fafafa]">
            {/* toolbar */}
            <div className="flex items-center gap-2 border-b border-[#e5e7eb] bg-white px-3 py-2">
              <Search size={12} className="text-[#9ca3af]" />
              <span className="font-mono text-[11px] text-[#6b7280]">0001_two_sum.py</span>
              <span className="ml-auto flex items-center gap-1.5 rounded-md bg-[#06b6d4]/10 px-2 py-0.5 font-mono text-[10px] text-[#06b6d4]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#06b6d4]" /> container.running
              </span>
            </div>

            {/* focused element with selection ring */}
            <div className="relative flex h-full items-center justify-center p-8">
              <div className="relative">
                {/* selection ring: 2px cyan, 4px white offset */}
                <div className="relative w-[320px] rounded-lg bg-white p-5 shadow-panel outline outline-2 outline-offset-4 outline-[#06b6d4]">
                  <span className="absolute -top-5 left-0 flex items-center gap-1 rounded-sm bg-[#06b6d4] px-1.5 py-0.5 font-mono text-[9px] text-white">
                    container.stdout
                    <span className="text-white/70">· 320×200</span>
                  </span>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[#9ca3af]">stdout</span>
                    <span className="font-mono text-[9px] text-[#06b6d4]">python:3.11-slim</span>
                  </div>
                  <pre className="font-mono text-xs leading-5 text-[#111827]">{`> two_sum([2,7,11,15], 9)
[0, 1]
> two_sum([3,2,4], 6)
[1, 2]
> two_sum([3,3], 6)
[0, 1]
✓ 3/3 passed · 0.23s`}</pre>
                </div>
                {/* dimension labels */}
                <span className="absolute -right-10 top-1/2 -translate-y-1/2 font-mono text-[9px] text-[#06b6d4]">320px</span>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 font-mono text-[9px] text-[#06b6d4]">200px</span>
              </div>
            </div>
          </div>

          {/* right inspector */}
          <div className="hidden lg:block"><Inspector /></div>
        </Motion.div>
      </div>
    </section>
  )
}

/* ---------- README manifesto ---------- */
function ReadmeManifesto() {
  return (
    <section className="border-b border-[#e5e7eb] bg-[#f3f4f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <Motion.div {...revealProps} variants={fadeUp} className="overflow-hidden rounded-xl border border-[#1f2937] bg-[#0d1117] shadow-panel-md">
          {/* header bar */}
          <div className="flex items-center justify-between border-b border-[#1f2937] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Terminal size={13} className="text-[#06b6d4]" />
              <span className="font-mono text-xs text-[#c9d1d9]">README.md</span>
            </div>
            <span className="font-mono text-[10px] text-[#6b7280]">markdown · 42 lines</span>
          </div>

          {/* content */}
          <div className="px-5 py-6 font-mono text-sm leading-relaxed text-[#c9d1d9] sm:px-8 sm:py-8">
            <p className="mb-4 text-[#8b949e]"># DockExec</p>
            <p className="mb-6 text-[#c9d1d9]">
              A LeetCode-style code execution platform built as a microservice
              stack. React frontend, Go gateway, Python execution workers,
              RabbitMQ job queue, Redis leaderboard — all wired through Docker.
            </p>

            <p className="mb-3 text-[#8b949e]">## architecture</p>
            <ul className="mb-6 space-y-1.5 pl-1">
              {[
                "react (vite) → user submits code via the gateway",
                "go gateway → publishes job to rabbitmq exec.fanout exchange",
                "python worker → consumes queue, spins up docker container",
                "docker → runs code isolated, streams stdout over socket",
                "redis → sorted-set leaderboard + submission result cache",
                "node.js auth → JWT issuance + refresh, independent deploy",
              ].map((l) => (
                <li key={l} className="flex items-start gap-2">
                  <span className="text-[#06b6d4]">+</span>
                  <span>{l}</span>
                </li>
              ))}
            </ul>

            <p className="mb-3 text-[#8b949e]">## quickstart</p>
            <div className="rounded-lg border border-[#1f2937] bg-[#161b22] p-3.5">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#febc2e" }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#28c840" }} />
                <span className="ml-2 text-[10px] text-[#6b7280]">bash — 80×8</span>
              </div>
              <pre className="text-[13px] leading-6">
                <span className="text-[#6b7280]">$ </span>
                <span className="text-[#06b6d4]">git clone</span>
                <span className="text-[#c9d1d9]"> https://github.com/RajanDhamala/DockExec.git</span>
                {"\n"}
                <span className="text-[#6b7280]">$ </span>
                <span className="text-[#06b6d4]">cd</span>
                <span className="text-[#c9d1d9]"> DockExec</span>
                {"\n"}
                <span className="text-[#6b7280]">$ </span>
                <span className="text-[#06b6d4]">docker compose up</span>
                <span className="text-[#c9d1d9]"> -d  # gateway + workers + rabbitmq + redis</span>
                {"\n"}
                <span className="text-[#6b7280]">$ </span>
                <span className="text-[#06b6d4]">open</span>
                <span className="text-[#c9d1d9]"> http://localhost:5173</span>
                <span className="de-blink text-[#06b6d4]"> ▋</span>
              </pre>
            </div>
          </div>
        </Motion.div>
      </div>
    </section>
  )
}

/* ---------- Technical FAQ ---------- */
function FAQSection() {
  const faqs = [
    {
      q: "Is it safe to execute code on DockExec?",
      a: "Yes. Every execution runs in an isolated Docker container with file system access, OS commands, and network operations disabled. Memory and CPU are hard-limited with a 3-second wall-clock timeout.",
    },
    {
      q: "What languages are supported?",
      a: "JavaScript (Node.js), Python 3, Java, Go, and C. Each runtime has proper syntax handling and returns structured error messages on failure.",
    },
    {
      q: "What happens if my code infinite-loops?",
      a: "All execution has a 3-second timeout. If exceeded, the container is terminated and a timeout error is returned — your account is never charged for runaway executions.",
    },
    {
      q: "Can I access files or the network?",
      a: "No. For security, file system access, OS commands, and network egress are completely disabled inside the sandbox. This keeps the environment reproducible and safe.",
    },
    {
      q: "How does the ranking system work?",
      a: "You earn points for each solved problem, weighted by difficulty. The global leaderboard updates in real time — climb by solving more problems, faster.",
    },
  ]

  return (
    <section id="faq" className="border-b border-[#e5e7eb] bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <Motion.div {...revealProps} variants={fadeUp} className="mb-8 text-center">
          <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#06b6d4]">
            // help
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
            Technical FAQ
          </h2>
        </Motion.div>

        <Motion.div {...revealProps} variants={stagger} className="divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">
          {faqs.map((f, i) => (
            <Motion.details key={i} variants={fadeUp} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[14px] font-medium text-[#111827] hover:text-[#06b6d4]">
                <span className="flex items-start gap-2.5">
                  <span className="font-mono text-[12px] text-[#06b6d4]">0{i + 1}.</span>
                  <span>{f.q}</span>
                </span>
                <ChevronDown size={15} className="shrink-0 text-[#9ca3af] transition-transform group-open:rotate-180" />
              </summary>
              <div className="pb-4 pl-7 pr-2 text-sm leading-relaxed text-[#6b7280]">
                {f.a}
              </div>
            </Motion.details>
          ))}
        </Motion.div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] font-sans text-[#111827] selection:bg-[#06b6d4] selection:text-white">
      <style>{KEYFRAMES}</style>
      <Navbar />
      <main>
        <HeroSection />
        <ReleaseNotes />
        <Workspace />
        <ReadmeManifesto />
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
