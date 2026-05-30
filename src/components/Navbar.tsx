import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut, Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  onNavigateToAuth: (mode: "signin" | "signup") => void;
  onScrollToSection: (sectionId: string) => void;
}

export default function Navbar({ onNavigateToAuth, onScrollToSection }: NavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const handleLinkClick = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    onScrollToSection(sectionId);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => handleLinkClick("hero")}
            className="flex cursor-pointer items-center space-x-3 transition-opacity hover:opacity-90"
            id="nav-logo"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/10 hover:scale-105 transition-transform">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-neutral-900 select-none">
              Strato<span className="text-blue-600">Sync</span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleLinkClick("features")}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-blue-600"
              id="nav-link-features"
            >
              Features
            </button>
            <button
              onClick={() => handleLinkClick("pricing")}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-blue-600"
              id="nav-link-pricing"
            >
              Pricing
            </button>
            <button
              onClick={() => handleLinkClick("faqs")}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-blue-600"
              id="nav-link-faqs"
            >
              FAQs
            </button>
          </div>

          {/* User Section (Sign In vs Authenticated Profile) */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="group flex items-center space-x-2 rounded-full bg-blue-600 px-4.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/15 transition-all cursor-pointer"
                  id="nav-goto-dashboard-btn"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 animate-pulse" />
                  <span>Go to Console</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-3 rounded-full border border-neutral-200 bg-neutral-50/50 p-1 pr-3.5 transition-all hover:bg-neutral-50 hover:shadow-sm"
                    id="nav-profile-btn"
                  >
                    <img
                      src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || "User"}`}
                      alt={user.displayName || "User"}
                      referrerPolicy="no-referrer"
                      className="h-8 w-8 rounded-full border border-neutral-200/60 object-cover"
                    />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-neutral-900 line-clamp-1 max-w-[100px]">
                        {user.displayName || "Active User"}
                      </p>
                      <p className="text-[10px] text-neutral-500 font-mono line-clamp-1 max-w-[100px]">
                        {user.email || "No email"}
                      </p>
                    </div>
                  </button>

                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setIsProfileDropdownOpen(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-neutral-200 bg-white p-2 shadow-xl ring-1 ring-black/5 z-20"
                          id="nav-profile-dropdown"
                        >
                          <div className="px-3 py-2 border-b border-neutral-100">
                            <p className="text-xs font-semibold text-neutral-950 font-sans">
                              {user.displayName || "Portal Member"}
                            </p>
                            <p className="text-xs text-neutral-500 font-sans truncate font-mono">
                              {user.email}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              navigate("/dashboard");
                            }}
                            className="mt-1 flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                          >
                            <LayoutDashboard className="h-4 w-4 text-blue-600" />
                            <span>Dashboard Console</span>
                          </button>

                          <button
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              signOut();
                            }}
                            className="mt-1 flex w-full items-center space-x-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50/75"
                            id="nav-sign-out"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Disconnect Session</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onNavigateToAuth("signin")}
                  className="rounded-full px-5 py-2 text-sm font-medium text-neutral-700 transition-colors hover:text-blue-600"
                  id="nav-signin-desktop"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigateToAuth("signup")}
                  className="group flex items-center space-x-1.5 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md hover:shadow-blue-100"
                  id="nav-signup-desktop"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2.5 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
              aria-label="Toggle Menu"
              id="nav-mobile-hamburger"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-b border-neutral-200 bg-white md:hidden overflow-hidden"
            id="nav-mobile-menu"
          >
            <div className="space-y-1.5 px-4 pt-2 pb-5">
              <button
                onClick={() => handleLinkClick("features")}
                className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-blue-600"
              >
                Features
              </button>
              <button
                onClick={() => handleLinkClick("pricing")}
                className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-blue-600"
              >
                Pricing
              </button>
              <button
                onClick={() => handleLinkClick("faqs")}
                className="block w-full rounded-lg px-3 py-2 text-left text-base font-medium text-neutral-700 hover:bg-neutral-50 hover:text-blue-600"
              >
                FAQs
              </button>

              <div className="border-t border-neutral-100 pt-4 mt-2">
                {user ? (
                  <div className="space-y-3 px-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || "User"}`}
                        alt={user.displayName || "User"}
                        referrerPolicy="no-referrer"
                        className="h-10 w-10 rounded-full border border-neutral-200"
                      />
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {user.displayName || "Subscribed User"}
                        </p>
                        <p className="text-xs text-neutral-500 font-mono font-sans truncate max-w-[200px]">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        navigate("/dashboard");
                      }}
                      className="flex w-full items-center justify-center space-x-2 rounded-lg bg-blue-600 py-2.5 text-center text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
                      id="nav-mobile-goto-dashboard"
                    >
                      <LayoutDashboard className="h-4 w-4 animate-pulse" />
                      <span>Go to Console Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center justify-center space-x-2 rounded-lg bg-red-50/70 py-2.5 text-center text-sm font-semibold text-red-600 transition-colors hover:bg-red-100/50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Disconnect Session</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2 px-3">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateToAuth("signin");
                      }}
                      className="w-full rounded-full py-2.5 text-center text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onNavigateToAuth("signup");
                      }}
                      className="w-full rounded-full bg-blue-600 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
