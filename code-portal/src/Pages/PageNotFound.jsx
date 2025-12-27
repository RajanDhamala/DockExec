import React from "react";
import { Compass, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const PageNotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 text-white relative overflow-hidden">
      {/* floating particles */}
      <div className="absolute inset-0 pointer-events-none select-none">
        {[...Array(30)].map((_, i) => (
          <span
            key={i}
            className="absolute w-1 h-1 bg-blue-500/40 rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random()}s`,
              animationDuration: `${3 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-3xl text-center">
        <div className="mx-auto h-40 w-40 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_80px_-30px_rgba(59,130,246,0.8)] animate-bounce-slow">
          <Compass className="w-16 h-16 text-blue-400 animate-spin-slow" />
        </div>

        <h1 className="mt-8 text-6xl md:text-7xl font-extrabold tracking-tight drop-shadow-lg">404</h1>
        <p className="mt-4 text-xl md:text-2xl text-gray-300">Looks like you might be lost in space.</p>
        <p className="mt-2 text-sm text-gray-400 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-300" />
          The page you are looking for does not exist.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 transition-colors"
          >
            Go Home
          </Link>
          <Link
            to="/leet"
            className="px-6 py-3 rounded-lg border border-gray-700 hover:border-blue-400 text-gray-200 hover:text-white transition-colors"
          >
            Explore Problems
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
        @keyframes bounce-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default PageNotFound;