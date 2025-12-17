"use client"

import { use, useState } from "react"
import { Link } from "react-router-dom"
import {
  Menu,
  X,
  ArrowRight,
  Code2,
  Zap,
  Trophy,
  Lock,
  GitBranch,
  Activity,
  Play,
  RotateCcw,
  CheckCircle2,
  Github,
  Twitter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useNavigate } from "react-router-dom"
// Navbar Component
function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate=useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-700 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to={"/"} className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-mono">
              {"{"}
            </div>
            <span className="text-white">DockExec</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to={"/leet"} className="text-sm text-slate-400 hover:text-white transition">
              Problems
            </Link>
            <Link to={"/leaderboard"} className="text-sm text-slate-400 hover:text-white transition">
              Leaderboard
            </Link>
            <Link to={"#faq"} className="text-sm text-slate-400 hover:text-white transition">
              FAQ
            </Link>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-black" onClick={()=>navigate('auth/login')}>
              Sign In
            </Button>
            <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={()=>navigate('auth/register')}>
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-slate-700">
            <Link to="/leet" className="block py-2 text-sm text-slate-400 hover:text-white">
              Problems
            </Link>
            <Link to="/leaderboard" className="block py-2 text-sm text-slate-400 hover:text-white">
              Leaderboard
            </Link>
           <a href="#faq" className="text-sm text-slate-400 hover:text-white transition">
          FAQ
          </a>

            <div className="flex gap-2 mt-4">
              <Button variant="ghost" size="sm" className="flex-1 text-slate-400 hover:text-white" onClick={()=>navigate('auth/login')}>
                Sign In
              </Button>
              <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={()=>navigate('auth/register')}>
                Sign Up
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

// Hero Section Component
function HeroSection() {
  return (
    <section className="w-full py-20 md:py-32 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-blue-400 font-medium">Sandbox Execution Environment</p>
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">Code. Execute. Learn.</h1>
              <p className="text-lg text-slate-300">
                Practice coding in a safe, isolated sandbox. Real-time execution across 5 languages with instant
                feedback. Zero setup required.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link to="/leet">
                <Button size="lg" className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white gap-2">
                  Explore Problems
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/code">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 bg-transparent border-slate-600 text-white hover:bg-slate-800 hover:text-white"
                >
                  <Code2 size={18} />
                  Start Coding
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 pt-8 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>15+ Problems</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>5 Languages</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Real-Time Execution</span>
              </div>
            </div>
          </div>

          {/* Hero Visual - Code Editor Preview */}
          <div className="relative">
            <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
              <div className="bg-slate-700/50 border-b border-slate-700 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                </div>
                <span className="text-xs text-slate-400 ml-2">editor.js</span>
              </div>

              <div className="p-4 bg-gray-900 font-mono text-sm">
                <pre className="text-slate-300 whitespace-pre-wrap break-words">
                  {`function twoSum(nums, target) {
  const map = new Map()
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]
    if (map.has(complement)) {
      return [map.get(complement), i]
    }
    map.set(nums[i], i)
  }
  return []
}`}
                </pre>
              </div>

              <div className="bg-slate-700/30 border-t border-slate-700 px-4 py-3">
                <p className="text-xs text-blue-400">✓ All test cases passed</p>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -bottom-4 -right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              Free Forever
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// Features Section Component
function FeaturesSection() {
  const features = [
    {
      icon: Code2,
      title: "5 Languages",
      description: "JavaScript, Python, Java, Go, and C - code in your favorite language.",
      languages: ["JS", "Python", "Java", "Go", "C"],
    },
    {
      icon: Zap,
      title: "Real-Time Execution",
      description: "See output instantly with 3-second timeout for safe execution.",
      highlight: "< 3 sec",
    },
    {
      icon: Trophy,
      title: "Points & Ranking",
      description: "Earn points solving problems and climb the global leaderboard.",
      highlight: "Competitive",
    },
    {
      icon: Lock,
      title: "Secure Sandbox",
      description: "Docker-isolated execution prevents malicious code execution.",
      highlight: "100% Safe",
    },
    {
      icon: GitBranch,
      title: "Difficulty Levels",
      description: "Easy, Medium, and Hard - progress at your own pace.",
      levels: ["Easy", "Medium", "Hard"],
    },
    {
      icon: Activity,
      title: "15+ Problems",
      description: "Curated coding challenges from basic to advanced algorithms.",
      highlight: "15+ Challenges",
    },
  ]

  return (
    <section className="w-full py-20 md:py-32 bg-slate-800/30 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to practice coding and track your progress
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="p-6 rounded-lg border border-slate-700 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500/50 transition-all group"
              >
                <div className="mb-4 inline-flex p-3 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400 mb-4 text-sm">{feature.description}</p>

                {/* Languages Tag */}
                {feature.languages && (
                  <div className="flex flex-wrap gap-2">
                    {feature.languages.map((lang) => (
                      <span key={lang} className="px-2.5 py-1 text-xs bg-blue-500/20 text-blue-300 rounded">
                        {lang}
                      </span>
                    ))}
                  </div>
                )}

                {/* Levels Tag */}
                {feature.levels && (
                  <div className="flex flex-wrap gap-2">
                    {feature.levels.map((level) => (
                      <span
                        key={level}
                        className={`px-2.5 py-1 text-xs rounded ${
                          level === "Easy"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : level === "Medium"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {level}
                      </span>
                    ))}
                  </div>
                )}

                {/* Highlight */}
                {feature.highlight && <div className="text-sm font-medium text-blue-400">{feature.highlight}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Problems Showcase Component
function ProblemsShowcase() {
  const sampleProblems = [
    {
      id: 1,
      title: "Two Sum",
      difficulty: "Easy",
      acceptance: "98%",
      solved: "2.5M",
      description: "Find two numbers that add up to a target value",
    },
    {
      id: 2,
      title: "Reverse String",
      difficulty: "Easy",
      acceptance: "95%",
      solved: "1.8M",
      description: "Reverse a string in place with constraints",
    },
    {
      id: 3,
      title: "Binary Search",
      difficulty: "Medium",
      acceptance: "85%",
      solved: "1.2M",
      description: "Implement binary search on sorted array",
    },
  ]

  function getDifficultyColor(difficulty) {
    switch (difficulty) {
      case "Easy":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
      case "Medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30"
      case "Hard":
        return "bg-red-500/20 text-red-300 border-red-500/30"
      default:
        return "bg-slate-700 text-slate-400"
    }
  }

  return (
    <section className="w-full py-20 md:py-32 bg-gray-900 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Sample Problems</h2>
          <p className="text-lg text-slate-400">Start solving from our curated collection</p>
        </div>

        <div className="space-y-4">
          {sampleProblems.map((problem) => (
            <div
              key={problem.id}
              className="p-6 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-blue-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm text-slate-500">#{problem.id.toString().padStart(4, "0")}</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition">
                      {problem.title}
                    </h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-4">{problem.description}</p>
                </div>

                <div className="flex-shrink-0">
                  <Badge className={getDifficultyColor(problem.difficulty)} variant="outline">
                    {problem.difficulty}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-400" />
                  <span>{problem.solved} solved</span>
                </div>
                <div>
                  <span>{problem.acceptance} acceptance</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Code Demo Component
function CodeDemo() {
  const [isRunning, setIsRunning] = useState(false)
  const [showOutput, setShowOutput] = useState(false)

  const handleRun = () => {
    setIsRunning(true)
    setTimeout(() => {
      setIsRunning(false)
      setShowOutput(true)
    }, 1500)
  }

  return (
    <section className="w-full py-20 md:py-32 bg-slate-800/30 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">See It In Action</h2>
          <p className="text-lg text-slate-400">Real-time code execution in your browser</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Code Editor */}
          <div className="bg-gray-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl">
            <div className="bg-slate-700/50 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                </div>
                <span className="text-xs text-slate-400 ml-2 font-mono">solution.py</span>
              </div>
              <span className="text-xs text-blue-400">Python</span>
            </div>

            <div className="p-4 bg-gray-900 font-mono text-sm">
              <pre className="text-slate-300">
                {`def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test
result = twoSum([2, 7, 11, 15], 9)
print(f"Indices: {result}")`}
              </pre>
            </div>

            <div className="bg-slate-700/20 border-t border-slate-700 px-4 py-3 flex gap-2">
              <Button
                size="sm"
                className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleRun}
                disabled={isRunning}
              >
                <Play size={16} />
                {isRunning ? "Executing..." : "Run Code"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-2 text-slate-400"
                onClick={() => {
                  setShowOutput(false)
                  setIsRunning(false)
                }}
              >
                <RotateCcw size={16} />
                Reset
              </Button>
            </div>
          </div>

          {/* Output/Test Results */}
          <div className="space-y-4">
            <div className="bg-gray-900 border border-slate-700 rounded-lg p-6">
              <h3 className="font-bold text-white mb-4">Console Output</h3>
              <div className="bg-slate-700/20 rounded p-4 font-mono text-sm min-h-24 text-slate-400">
                {isRunning ? (
                  <div className="animate-pulse">Executing code...</div>
                ) : showOutput ? (
                  <div className="text-blue-400">
                    <div>Indices: [0, 1]</div>
                    <div className="text-xs text-slate-500 mt-2">Execution time: 0.23ms</div>
                  </div>
                ) : (
                  'Click "Run Code" to execute'
                )}
              </div>
            </div>

            <div className="bg-gray-900 border border-slate-700 rounded-lg p-6">
              <h3 className="font-bold text-white mb-4">Test Cases</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Test 1: [2, 7, 11, 15], 9</span>
                  {showOutput && <span className="text-blue-400">✓ Passed</span>}
                </div>
                <div className="flex items-center justify-between text-sm opacity-50 text-slate-400">
                  <span>Test 2: [3, 2, 4], 6</span>
                  {showOutput ? (
                    <span className="text-blue-400">✓ Passed</span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm opacity-50 text-slate-400">
                  <span>Test 3: [3, 3], 6</span>
                  {showOutput ? (
                    <span className="text-blue-400">✓ Passed</span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// FAQ Section Component
function FAQSection() {
  const faqs = [
    {
      question: "Is it safe to execute code on DockExec?",
      answer:
        "Yes, absolutely! Every code execution runs in an isolated Docker container. We prevent access to file systems, OS commands, and network operations. Your code executes in a sandboxed environment with memory and CPU limits (3-second timeout).",
    },
    {
      question: "Why should I use DockExec instead of other platforms?",
      answer:
        "DockExec is completely free, simple to use, and focuses on real-time execution with instant feedback. We support 5 popular languages, provide difficulty-based problems, and include a competitive ranking system - all without any setup required.",
    },
    {
      question: "What languages are supported?",
      answer:
        "We support 5 languages: JavaScript (Node.js), Python 3, Java, Go, and C. Each language has proper syntax highlighting and code execution with comprehensive error messages.",
    },
    {
      question: "What happens if my code goes into an infinite loop?",
      answer:
        "All code execution has a 3-second timeout. If your code exceeds this limit, it will be automatically terminated by the system to prevent resource exhaustion.",
    },
    {
      question: "Can I access files or system commands?",
      answer:
        "No. For security reasons, file system access, OS commands, and network operations are completely disabled. This ensures safe execution in the sandbox environment.",
    },
    {
      question: "How does the points and ranking system work?",
      answer:
        "You earn points for solving problems successfully. The ranking system is global and updates in real-time based on your score. Climb the leaderboard by solving more problems efficiently.",
    },
  ]

  return (
    <section id="faq" className="w-full py-20 md:py-32 bg-gray-900 border-t border-slate-700">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-slate-400">Common questions about DockExec</p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-700">
              <AccordionTrigger className="text-white hover:text-blue-400">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-slate-400">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="w-full border-t border-slate-700 bg-slate-800/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link to="/" className="flex items-center gap-2 font-bold mb-4">
              <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white font-mono text-sm">
                {"{"}
              </div>
              <span className="text-white">DockExec</span>
            </Link>
            <p className="text-sm text-slate-400">Free code execution platform. Practice coding safely in the cloud.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to={"/leet"} className="hover:text-white transition">
                  Problems
                </Link>
              </li>
              <li>
                <Link to={"/leaderboard"} className="hover:text-white transition">
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link to={"/code"} className="hover:text-white transition">
                  Code Editor
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Resources</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="#" className="hover:text-white transition">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="#faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-white transition">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-sm">Follow</h4>
            <div className="flex gap-4">
              <a href="https://github.com/RajanDhamala/DockExec.git" target="#blank" className="text-slate-400 hover:text-white transition" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition" aria-label="Twitter">
                <Twitter size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 pt-8">
          <p className="text-xs text-slate-500 text-center">
            © 2025 DockExec. Free code execution platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

// Main Page Component
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <ProblemsShowcase />
      <CodeDemo />
      <FAQSection />
      <Footer />
    </div>
  )
}
