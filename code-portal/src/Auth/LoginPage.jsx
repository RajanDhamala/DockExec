import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import api from "../Utils/AxiosWrapper.js"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { Github } from "lucide-react";
import useUserStore from "@/ZustandStore/UserStore";
import { useMutation } from "@tanstack/react-query";


export default function AuthPage() {
  const navigate = useNavigate();
  const { mode } = useParams();
  const { currentUser, setCurrentUser } = useUserStore()

  const [currentView, setCurrentView] = useState(mode || "login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form state
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
    if (provider === "Google") {
      window.location.href = `http://localhost:8000/auth/google`;
    }
    else if (provider === "GitHub") {
      window.location.href = `http://localhost:8000/auth/github`;
    }
  };


  const { mutate: mutatePassword, isLoading } = useMutation(
    {
      mutationFn:
        async (email) => {
          const response = await api.post("http://localhost:8000/users/forgot-password", { email });
          console.log("response:", response)
          return response.data;
        },
      onSuccess: (data) => {
        toast.success("Password reset link sent!");
        console.log("Reset success:", data);
      },
      onError: (error) => {
        toast.error("Failed to send password reset link");
        console.error("Reset error:", error);
      },
      retry: false
    }
  );
  const handleForgotPassword = () => {
    if (!email.trim()) {
      toast.error("Enter your email to reset");
      return;
    }
    mutatePassword(email); // call the mutation
  };


  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await api.post(
        "http://localhost:8000/users/login",
        { email, password },
      );
      toast.success(res.data.message || "Logged in successfully");
      setEmail("");
      setPassword("");
      setCurrentUser(res.data.data)
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
      const res = await api.post("http://localhost:8000/users/register", {
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

    <div className="min-h-screen flex bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-sans ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 text-white">
          {/* Logo and branding */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-mono text-sm font-bold">
                {"{"}
              </div>
              <span className="text-xl font-semibold">DockExec</span>
            </Link>

          </div>

          {/* Center content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-4xl font-bold leading-tight">Code. Execute. Learn.</h2>
              <p className="text-gray-300 text-lg">
                Practice coding in a safe, isolated sandbox. Real-time execution across 5 languages with instant feedback. Zero setup required.
              </p>
            </div>

            {/* Features */}
            <div className="flex flex-col gap-2 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>15+ Problems</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>5 Languages</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Real-Time Execution</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-gray-400 text-sm border-t border-gray-800 pt-6">
            <span>Copyright © 2025 DockExec</span>
            <button className="hover:text-white transition-colors">Privacy Policy</button>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-mono text-sm font-bold">
                  {"{"}
                </div>
                <span className="text-lg font-semibold text-white">DockExec</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Toggle buttons */}
              <div className="flex gap-2 bg-gray-800/50 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${currentView === "login"
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${currentView === "register"
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  Register
                </button>
              </div>

              {/* Title and description */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">
                  {currentView === "login" && "Welcome Back"}
                  {currentView === "register" && "Create Account"}
                </h2>
                <p className="text-gray-400 text-sm">
                  {currentView === "login" && "Enter your email and password to access your account."}
                  {currentView === "register" && "Create a new account to get started with DockExec."}
                </p>
              </div>

              {/* Form fields */}
              <div className="space-y-4">
                {currentView === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      type="text"
                      placeholder="Tinku Bahadur"
                      className="h-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="user@example.com"
                    className="h-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      className="h-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {currentView === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm password"
                        className="h-11 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-0 rounded-lg pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
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
                      <input type="checkbox" className="w-4 h-4 rounded bg-gray-800 border-gray-700 accent-blue-500" />
                      <span className="text-sm text-gray-400">Remember Me</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
              >
                {currentView === "login" ? "Sign In" : "Create Account"}
              </Button>

              {/* Social auth */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase tracking-[0.2em] justify-center">
                  <span className="h-px w-10 bg-gray-800" />
                  <span>Continue with</span>
                  <span className="h-px w-10 bg-gray-800" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialClick("Google")}
                    className="w-full h-11 bg-white text-gray-900 dark:text-white border-gray-200 hover:border-blue-500 hover:text-gray-900 flex items-center justify-center gap-3 shadow-sm"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-7 w-7">
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
                    className="w-full h-11 bg-gray-900 text-white border border-gray-700 hover:border-blue-500 flex items-center justify-center gap-3 shadow-sm"
                  >
                    <div className="h-8 w-8 rounded-full bg-white text-gray-900 flex items-center justify-center">
                      <Github className="h-4 w-4" />
                    </div>
                    <span>GitHub</span>
                  </Button>
                </div>
              </div>

              {/* Toggle text */}
              <div className="text-center text-sm text-gray-400">
                {currentView === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleModeChange("register")}
                      className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
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
                      className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
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


