import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthFormProps {
  initialMode?: "signin" | "signup";
  onClose: () => void;
}

export default function AuthForm({ initialMode = "signin", onClose }: AuthFormProps) {
  const { 
    user, 
    loading, 
    error, 
    success, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    clearStatus 
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  
  // Local validation states
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // Sync initial mode
    setMode(initialMode);
    clearStatus();
    setLocalError(null);
  }, [initialMode]);

  // Clear states when mode changes
  const handleModeToggle = (targetMode: "signin" | "signup") => {
    setMode(targetMode);
    clearStatus();
    setLocalError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearStatus();

    // Basic client validation
    if (!email) {
      setLocalError("Email address is required.");
      return;
    }
    if (!password) {
      setLocalError("Password field is required.");
      return;
    }
    if (password.length < 6) {
      setLocalError("For secure access, passwords must be at least 6 characters.");
      return;
    }

    if (mode === "signup") {
      if (!displayName) {
        setLocalError("Please provide your full name.");
        return;
      }
      await signUpWithEmail(email, password, displayName);
    } else {
      await signInWithEmail(email, password);
    }
  };

  return (
    <div className="flex min-h-[460px] w-full flex-col items-center justify-center p-1">
      {/* Sleek Centered Card Container */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-8 sm:p-10 shadow-2xl shadow-neutral-200/50 relative"
      >
        {/* Back and Close actions */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:text-neutral-900 cursor-pointer"
          id="auth-back-btn"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>

        {/* Portal Branding Header */}
        <div className="text-center mt-6 mb-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-550 border border-neutral-100 bg-neutral-50 mb-4 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-neutral-900">
            {mode === "signin" ? "Access Portal Security" : "Register Credentials"}
          </h2>
          
          {/* Dual Action Toggler */}
          {!success && !user && (
            <div className="flex p-1 bg-neutral-100 rounded-xl w-full mt-5 select-none">
              <button
                type="button"
                onClick={() => handleModeToggle("signin")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-white shadow-sm text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
                id="auth-toggle-signin-bar"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeToggle("signup")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-white shadow-sm text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
                id="auth-toggle-signup-bar"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Error/Success Feedbacks */}
        <AnimatePresence mode="wait">
          {(error || localError) && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 flex items-start space-x-2.5 rounded-xl border border-red-100 bg-red-50/50 p-4 text-xs text-red-700"
              id="auth-error-alert"
            >
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Verification Issue</p>
                <p className="opacity-90 leading-relaxed font-sans mt-0.5">{error || localError}</p>
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-6 flex items-start space-x-2.5 rounded-xl border border-green-100 bg-green-50/50 p-4 text-xs text-green-700"
              id="auth-success-alert"
            >
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">Security Handshake Succeeded</p>
                <p className="opacity-90 leading-relaxed font-sans mt-0.5">{success}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Authentication Handshake (Social) */}
        {!success && !user && (
          <div className="mb-6">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 border border-neutral-200 rounded-xl font-bold text-sm text-neutral-700 hover:bg-neutral-50 transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-50"
              id="auth-google-btn"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-neutral-400 bg-white px-4 select-none">
                Or via email
              </div>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        {!success && !user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 px-1 select-none">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all pl-10 text-sm"
                    id="auth-input-name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1 px-1 select-none">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all pl-10 text-sm"
                  id="auth-input-email"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between px-1 select-none">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalError("Mock Password reset link has been dispatched to your clipboard.");
                    }}
                    className="text-xs text-blue-600 hover:underline font-bold transition-colors cursor-pointer"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-250 border-neutral-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all pl-10 text-sm"
                  id="auth-input-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors mt-6 active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-2"
              id="auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Configuring Session...</span>
                </>
              ) : (
                <span>{mode === "signin" ? "Sign In to Dashboard" : "Register Credentials"}</span>
              )}
            </button>
          </form>
        ) : (
          /* Show Session Dashboard Overview inside Card upon immediate login success code */
          <div className="mt-2 space-y-4">
            <div className="text-center bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 mb-4">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-widest font-mono">Status: Connected</p>
              <p className="text-sm text-neutral-600 font-light mt-1">
                Your credentials are successfully mapped within the local state session model.
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="w-full flex items-center justify-center rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-neutral-800"
              id="auth-dashboard-btn"
            >
              Proceed to User Dashboard
            </button>
          </div>
        )}

        {/* Demo Account assist notice */}
        {!success && !user && (
          <div className="mt-6 p-4 rounded-2xl border border-neutral-100 bg-neutral-50 flex flex-col space-y-1.5">
            <span className="text-[10px] font-bold text-neutral-450 text-neutral-500 uppercase tracking-wider font-mono">Demo Credentials Assist</span>
            <p className="text-[11px] text-neutral-500 leading-relaxed font-sans">
              Enter any email & password (min. 6 chars) to simulate immediate access, or register a new custom credential account.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
