import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Menu, Settings, User, X } from "lucide-react"
import useUserStore from "@/ZustandStore/UserStore"
import { Button } from "@/components/ui/button"
import { LogoutUser } from "@/Utils/HelperUtils"

function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { currentUser, clearCurrentUser } = useUserStore()
  const navigate = useNavigate()
  const profileMenuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
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

          <div className="hidden md:flex items-center gap-3">
            {currentUser?.email ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white hover:bg-slate-600 border border-slate-600"
                  aria-haspopup="true"
                  aria-expanded={isProfileOpen}
                >
                  <User size={18} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-48 rounded-md bg-gray-900 border border-slate-700 shadow-lg overflow-hidden">
                    <div className="px-4 py-3 text-sm text-slate-300 border-b border-slate-800">
                      <p className="font-medium text-white">{currentUser.fullname ?? "User"}</p>
                      <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                      onClick={() => {
                        setIsProfileOpen(false)
                        navigate("/overview")
                      }}
                    >
                      <User size={16} />
                      Profile
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                      onClick={() => {
                        setIsProfileOpen(false)
                        navigate("/settings")
                      }}
                    >
                      <Settings size={16} />
                      Settings
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      onClick={() => {
                        setIsProfileOpen(false)
                        LogoutUser(clearCurrentUser, navigate)
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-black"
                  onClick={() => navigate("/auth/login")}
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => navigate("/auth/register")}
                >
                  Sign Up
                </Button>
              </>
            )}
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

            <div className="mt-4 space-y-2">
              {currentUser?.email ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-700 text-white flex items-center justify-center border border-slate-600">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{currentUser.fullname ?? "User"}</p>
                      <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="ghost"
                      className="justify-start text-slate-300 hover:text-white"
                      onClick={() => {
                        setIsOpen(false)
                        navigate("/profile")
                      }}
                    >
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-slate-300 hover:text-white"
                      onClick={() => {
                        setIsOpen(false)
                        navigate("/settings")
                      }}
                    >
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start text-red-300 hover:text-red-200"
                      onClick={() => {
                        setIsOpen(false)
                        LogoutUser(clearCurrentUser, navigate)
                      }}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-slate-400 hover:text-white"
                    onClick={() => {
                      setIsOpen(false)
                      navigate("/auth/login")
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={() => {
                      setIsOpen(false)
                      navigate("/auth/register")
                    }}
                  >
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
