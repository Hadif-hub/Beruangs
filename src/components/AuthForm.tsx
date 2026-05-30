import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BearLogo from "./BearLogo";
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  ShieldCheck, 
  Loader, 
  CheckCircle, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthFormProps {
  initialMode?: "signin" | "signup";
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function AuthForm({ initialMode = "signin", onSuccess, onClose }: AuthFormProps) {
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
  const [validationError, setValidationError] = useState<string | null>(null);

  // Clear global auth errors when switching view modes
  useEffect(() => {
    clearStatus();
    setValidationError(null);
  }, [mode]);

  // Handle successful login
  useEffect(() => {
    if (user && success && onSuccess) {
      const timer = setTimeout(() => {
        onSuccess();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, success, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Basic Validations
    if (!email || !password) {
      setValidationError("Please fill out all chemical fields.");
      return;
    }
    if (password.length < 6) {
      setValidationError("Session passcode must be at least 6 characters.");
      return;
    }
    if (mode === "signup" && !displayName) {
      setValidationError("A public handle / name is required to log posts.");
      return;
    }

    try {
      if (mode === "signin") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
    } catch (err) {
      console.error("Authentication failed", err);
    }
  };

  const handleGoogleLogin = async () => {
    setValidationError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google authentication failed", err);
    }
  };

  return (
    <div className="w-full flex-col items-center justify-center text-left" id="auth-module">
      <div className="w-full rounded-3xl border border-bear-latte bg-white p-6 sm:p-8 shadow-xl relative">
        
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-bear-sand text-bear-khaki hover:text-bear-dark transition-all cursor-pointer"
            id="auth-close-btn"
          >
            ✕
          </button>
        )}

        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bear-sand border border-bear-latte mb-3 shadow-xs">
            <BearLogo className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-black text-bear-dark tracking-tight">
            {mode === "signin" ? "Enter the Bear Den" : "Join BeruangsBear"}
          </h2>
          <p className="text-[11px] text-bear-khaki font-bold mt-0.5">
            {mode === "signin" ? "Unlock personal notes and reaction controls" : "Register sightings and join public bear discussions"}
          </p>

          {/* Toggle Tab */}
          <div className="flex p-1 bg-bear-sand/70 rounded-xl w-full mt-4 select-none">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "signin"
                  ? "bg-white text-bear-dark shadow-xs"
                  : "text-neutral-500 hover:text-bear-dark"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === "signup"
                  ? "bg-white text-bear-dark shadow-xs"
                  : "text-neutral-500 hover:text-bear-dark"
              }`}
            >
              Join Up
            </button>
          </div>
        </div>

        {/* Display Banner alerts */}
        <AnimatePresence mode="wait">
          {(error || validationError) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700 flex items-start space-x-2 font-semibold"
            >
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{validationError || error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 flex items-start space-x-2 font-semibold"
            >
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-[10px] font-bold text-bear-dark/70 uppercase mb-1 px-1">
                Your Bear Name / Display Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-bear-khaki">
                  <UserIcon className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Papa_Bear42"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-bear-sand/35 border border-bear-latte rounded-xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-bear-dark/70 uppercase mb-1 px-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-bear-khaki">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                placeholder="observer@beruang.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-bear-sand/35 border border-bear-latte rounded-xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-bear-dark/70 uppercase mb-1 px-1">
              Secret Passcode
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-bear-khaki">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-bear-sand/35 border border-bear-latte rounded-xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-bear-brown hover:bg-bear-dark text-white font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
          >
            {loading ? (
              <>
                <Loader className="h-3.5 w-3.5 animate-spin" />
                <span>Synchronizing...</span>
              </>
            ) : (
              <>
                <span>{mode === "signin" ? "Access Feed" : "Initiate Credentials"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5 select-none">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-bear-latte" />
          </div>
          <div className="relative flex justify-center text-[10px] font-bold uppercase">
            <span className="bg-white px-3 text-bear-khaki">Or connect via</span>
          </div>
        </div>

        {/* Google OAuth Access */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 rounded-xl border border-bear-latte bg-bear-light hover:bg-bear-sand/35 text-bear-dark hover:text-bear-brown text-xs font-bold transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Authenticate with Google</span>
        </button>
      </div>
    </div>
  );
}
