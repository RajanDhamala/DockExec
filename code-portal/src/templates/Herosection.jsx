import { Link } from "react-router-dom"
import { ArrowRight, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button.jsx"

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


export default HeroSection