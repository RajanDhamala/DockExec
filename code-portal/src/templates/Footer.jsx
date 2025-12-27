import { Link } from "react-router-dom"
import { Github, Twitter } from "lucide-react"
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

export default Footer
