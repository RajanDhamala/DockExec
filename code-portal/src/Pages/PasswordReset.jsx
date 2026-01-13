import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const PasswordReset = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      setLocalError("");
      if (!newPassword || !confirmPassword) {
        toast.error("Please fill in both fields")
        throw new Error("Please fill in both fields");
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match")
        throw new Error("Passwords do not match");
      }
      if (newPassword.length < 6) {

        toast.error("Password must be at least 6 characters long")
        throw new Error("Password must be at least 6 characters long");
      }
      const res = await axios.post("http://localhost:8000/users/reset-psd", {
        token,
        newPassword,
      });

      return res.data;
    },

    onSuccess: () => {
      toast.success("password changed successfully")
      setTimeout(() => navigate("auth/login"), 1000);
    },

    onError: (err) => {
      toast.error("Something went wrong")
      setLocalError(err.message || "Something went wrong");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800/40 rounded-xl p-8 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-5" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Invalid or Expired Link
          </h2>
          <p className="text-gray-600 dark:text-slate-400 text-sm">
            Please request a new password reset link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12 md:py-20 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100 dark:border-gray-800/70">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center mb-5 mx-auto md:mx-0">
            <Lock className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 text-center md:text-left">
            Reset Password
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm text-center md:text-left">
            Choose a strong, unique password for your account.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pt-6 pb-8 space-y-6">
          {/* New Password */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition-all"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-slate-300 transition-colors"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 pr-11 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg focus:border-blue-500 focus:ring-0 outline-none transition-all"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-slate-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {(mutation.isError || localError) && (
            <div className="flex items-center gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{localError || mutation.error?.message || "Failed to reset password"}</span>
            </div>
          )}

          {mutation.isSuccess && (
            <div className="flex items-center gap-3 p-3.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 rounded-lg text-green-700 dark:text-green-400 text-sm">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>Password updated! Redirecting to login...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isLoading || mutation.isSuccess}
            className={`
              w-full h-11 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition-all
              ${mutation.isLoading || mutation.isSuccess
                ? "bg-blue-500/60 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-sm hover:shadow-md"
              }
            `}
          >
            {mutation.isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Resetting...
              </>
            ) : mutation.isSuccess ? (
              "Success ✓"
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordReset;
