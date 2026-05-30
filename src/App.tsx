import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import AuthForm from "./components/AuthForm";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import { ExternalLink, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

function HomeView() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleNavigateToAuth = (mode: "signin" | "signup") => {
    navigate(`/${mode}`);
  };

  const scrollSection = (id: string) => {
    if (id === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-neutral-50 selection:bg-blue-100 selection:text-blue-800">
      {/* Sticky Active Session Token Notification */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 py-2.5 px-4 text-center text-xs font-semibold text-white flex flex-wrap items-center justify-center gap-1.5 sm:gap-4 font-mono select-none"
          id="dashboard-session-banner"
          onClick={() => navigate("/dashboard")}
        >
          <span className="cursor-pointer hover:underline">🔐 Active Session Connected: {user.displayName || user.email}</span>
          <span className="hidden sm:inline">|</span>
          <span className="cursor-pointer hover:underline font-bold">Go to Developer Dashboard &rarr;</span>
        </motion.div>
      )}

      {/* Landing Header */}
      <Navbar 
        onNavigateToAuth={handleNavigateToAuth} 
        onScrollToSection={scrollSection} 
      />

      {/* Scrollable Hero view */}
      <Hero onNavigateToAuth={handleNavigateToAuth} />

      {/* Bottom Right Floating Developer status indicator */}
      <div className="fixed bottom-6 right-6 z-40 hidden sm:block">
        <div className="flex flex-col items-end gap-2">
          {user ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2.5 rounded-2xl border border-neutral-200 bg-white p-3 pr-4 shadow-lg cursor-pointer"
              id="dev-helper-panel"
              onClick={() => navigate("/dashboard")}
            >
              <img
                src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || "User"}`}
                alt={user.displayName || "Portal Session"}
                referrerPolicy="no-referrer"
                className="h-8 w-8 rounded-full bg-neutral-100"
              />
              <div className="text-left select-none">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">Session Token Live</p>
                <p className="text-xs font-semibold text-neutral-800 line-clamp-1">{user.displayName || user.email}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  signOut();
                }}
                className="ml-2 rounded-lg bg-neutral-50 hover:bg-neutral-100 p-1.5 text-neutral-500 hover:text-neutral-950 transition-colors"
                title="Disconnect Current Session"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => handleNavigateToAuth("signin")}
              className="flex items-center space-x-2 rounded-full bg-neutral-900 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 cursor-pointer"
              id="dev-helper-sign-in"
            >
              <span>Secure Authenticator</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthView({ mode }: { mode: "signin" | "signup" }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to user dashboard if session already exists
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleClose = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4 relative overflow-hidden selection:bg-blue-100 selection:text-blue-800 select-none">
      <div className="absolute top-12 left-12 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-12 right-12 w-64 h-64 bg-indigo-100/30 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md">
        <AuthForm 
          initialMode={mode} 
          onClose={handleClose} 
        />
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
      <Route path="/signin" element={<AuthView mode="signin" />} />
      <Route path="/signup" element={<AuthView mode="signup" />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
