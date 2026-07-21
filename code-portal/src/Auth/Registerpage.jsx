import React, { useState, useEffect } from "react";
import { motion as Motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Terminal, Container } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Github } from "lucide-react";

const KEYFRAMES = `
@keyframes de-blink { 0%,45%{opacity:1} 50%,100%{opacity:0} }
@keyframes de-dash { to { stroke-dashoffset: -16; } }
@keyframes de-float { 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-6px) } }
.de-blink { animation: de-blink 1.1s steps(1) infinite; }
.de-dash { animation: de-dash 0.7s linear infinite; }
.de-float { animation: de-float 5s ease-in-out infinite; }
`;

function VFlow({ label }) {
  return (
    <div className="flex items-center gap-3 py-1 pl-3">
      <svg width="2" height="28" viewBox="0 0 2 28" className="text-neutral-300" aria-hidden>
        <line
          x1="1" y1="0" x2="1" y2="28"
          stroke="currentColor" strokeWidth="2"
          strokeDasharray="4 4" className="de-dash"
        />
      </svg>
      <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </span>
    </div>
  );
}

function Pipeline() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 backdrop-blur">
      {/* code */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <Terminal size={12} className="text-neutral-400" />
            <span className="font-mono text-[10px] text-neutral-500">solution.py</span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-400">code</span>
        </div>
        <div className="space-y-0.5 px-3 py-2.5 font-mono text-[11px] leading-5">
          <div className="whitespace-pre">
            <span className="font-medium text-neutral-900">def</span>
            <span className="text-neutral-800"> two_sum</span>
            <span className="text-neutral-400">(nums, t):</span>
          </div>
          <div className="whitespace-pre text-neutral-700">
            {"    "}seen = {"{}"}
          </div>
          <div className="whitespace-pre italic text-neutral-400">
            {"    "}# O(n){" "}
            <span className="de-blink text-neutral-900">▋</span>
          </div>
        </div>
      </div>

      <VFlow label="submit" />

      {/* sandbox */}
      <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute inline-flex h-6 w-6 animate-ping rounded-md border border-neutral-300 opacity-50" />
              <span className="relative flex h-6 w-6 items-center justify-center rounded-md border border-neutral-200 bg-neutral-50">
                <Container size={12} className="text-neutral-900" />
              </span>
            </span>
            <div className="leading-tight">
              <div className="text-[11px] font-medium text-neutral-900">docker sandbox</div>
              <div className="font-mono text-[9px] text-neutral-400">python:3.11 · 128MB</div>
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-400">run</span>
        </div>
      </div>

      <VFlow label="stream" />

      {/* output */}
      <div className="rounded-lg border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
          <span className="font-mono text-[10px] text-neutral-500">stdout</span>
          <span className="text-[9px] uppercase tracking-[0.18em] text-neutral-400">output</span>
        </div>
        <Motion.div
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
          }}
          initial="hidden"
          animate="show"
          className="space-y-1 px-3 py-2.5 font-mono text-[11px] leading-4"
        >
          <Motion.div variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }} className="text-neutral-400">
            container: ready
          </Motion.div>
          <Motion.div variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }} className="text-neutral-800">
            ✓ [0, 1]
          </Motion.div>
        </Motion.div>
        <div className="flex items-center gap-2 border-t border-neutral-200 px-3 py-2">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" className="text-neutral-900">
            <Motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 1 }}
            />
          </svg>
          <span className="text-[10px] text-neutral-600">3/3 passed · 0.23s</span>
        </div>
      </div>
    </div>
  );
}

export default function TestPage() {
  const navigate = useNavigate();
  const { mode } = useParams();

  const [currentView, setCurrentView] = useState(mode || "login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAIEvent = (event) => {
      console.log("AI event received:", event.detail);
      toast(`AI Event: ${event.detail.message}`);
    };
    window.addEventListener("ai-event", handleAIEvent);
    return () => {
      window.removeEventListener("ai-event", handleAIEvent);
    };
  }, []);

  const handleModeChange = (newMode) => {
    setCurrentView(newMode);
    window.history.pushState({}, "", `/auth/${newMode}`);
  };

  const handleSocialClick = (provider) => {
    console.log(`${provider} ${currentView} clicked`);
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/users/login",
        { email, password },
        { withCredentials: true }
      );
      toast.success(res.data.message || "Logged in successfully");
      setEmail("");
      setPassword("");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullname.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/users/register", {
        fullname,
        email,
        password,
      });
      toast.success(res.data.message || "Registered successfully");

      setFullname("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCurrentView("login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentView === "login") {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans text-neutral-900">
      <style>{KEYFRAMES}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex w-full">
        {/* Brand panel */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-neutral-200">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-8 h-8 bg-neutral-900 rounded-md flex items-center justify-center text-white font-mono text-sm font-bold">
              {"{"}
            </div>
            <span className="text-xl font-semibold text-neutral-900">DockExec</span>
          </Link>

          <div className="space-y-8 py-8">
            <div className="space-y-4">
              <h2 className="text-4xl font-semibold tracking-tight leading-tight text-neutral-900">
                Code. Execute.{" "}
                <span className="text-neutral-400">Learn.</span>
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed max-w-md">
                Practice coding in a safe, isolated sandbox. Real-time execution
                across 5 languages with instant feedback. Zero setup required.
              </p>
            </div>

            <Pipeline />

            <div className="flex flex-col gap-2.5 text-neutral-600 text-sm">
              {["15+ Problems", "5 Languages", "Real-time execution"].map((s) => (
                <div key={s} className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center text-neutral-500 text-sm border-t border-neutral-200 pt-6">
            <span>© 2025 DockExec</span>
            <button className="hover:text-neutral-800 transition-colors">Privacy Policy</button>
          </div>
        </div>

        {/* Form panel */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-neutral-900 rounded-md flex items-center justify-center text-white font-mono text-sm font-bold">
                  {"{"}
                </div>
                <span className="text-lg font-semibold text-neutral-900">DockExec</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Toggle */}
              <div className="flex gap-1 bg-neutral-50 border border-neutral-200 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentView === "login"
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    currentView === "register"
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
                  {currentView === "login" && "Welcome back"}
                  {currentView === "register" && "Create your account"}
                </h2>
                <p className="text-neutral-500 text-sm">
                  {currentView === "login" && "Enter your email and password to access your account."}
                  {currentView === "register" && "Create a new account to get started with DockExec."}
                </p>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                {currentView === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-neutral-700">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      type="text"
                      placeholder="Tinku Bahadur"
                      className="h-11 bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-0 rounded-lg"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-neutral-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="user@example.com"
                    className="h-11 bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-0 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-neutral-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className="h-11 bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-0 rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {currentView === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-neutral-700">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        className="h-11 bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus-visible:border-neutral-900 focus-visible:ring-0 rounded-lg pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {currentView === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded bg-white border-neutral-300 accent-neutral-900" />
                      <span className="text-sm text-neutral-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white font-medium rounded-lg transition-colors"
              >
                {loading
                  ? "Please wait..."
                  : currentView === "login"
                    ? "Sign in"
                    : "Create account"}
              </Button>

              {/* Social */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neutral-400 text-xs uppercase tracking-[0.2em] justify-center">
                  <span className="h-px w-10 bg-neutral-200" />
                  <span>Continue with</span>
                  <span className="h-px w-10 bg-neutral-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialClick("Google")}
                    className="w-full h-11 bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 flex items-center justify-center gap-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-6 w-6">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.45 13.33 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.2-.43-4.71H24v9h12.7c-.54 2.9-2.17 5.36-4.63 7.04l7.25 5.62C43.96 37.52 46.5 31.48 46.5 24.5z" />
                        <path fill="#FBBC05" d="M10.54 28.39c-.47-1.4-.74-2.9-.74-4.39s.27-2.99.74-4.39l-7.98-6.19C.92 16.65 0 20.19 0 24c0 3.81.92 7.35 2.56 10.58l7.98-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.25-5.62c-2.01 1.35-4.6 2.16-8.66 2.16-6.26 0-11.55-3.83-13.46-9.15l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        <path fill="none" d="M0 0h48v48H0z" />
                      </svg>
                    </span>
                    <span>Google</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialClick("GitHub")}
                    className="w-full h-11 bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 flex items-center justify-center gap-3"
                  >
                    <div className="h-7 w-7 rounded-full bg-neutral-900 text-white flex items-center justify-center">
                      <Github className="h-4 w-4" />
                    </div>
                    <span>GitHub</span>
                  </Button>
                </div>
              </div>

              {/* Toggle text */}
              <div className="text-center text-sm text-neutral-600">
                {currentView === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleModeChange("register")}
                      className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleModeChange("login")}
                      className="text-neutral-900 hover:text-neutral-600 font-medium transition-colors"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
