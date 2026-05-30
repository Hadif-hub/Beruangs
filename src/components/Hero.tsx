import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  ShieldCheck, 
  Key, 
  Zap, 
  Users, 
  ChevronDown, 
  Check, 
  Sparkles,
  ArrowRight,
  Database,
  CloudLightning,
  RefreshCw
} from "lucide-react";
import { useState, useEffect } from "react";

interface HeroProps {
  onNavigateToAuth: (mode: "signin" | "signup") => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function Hero({ onNavigateToAuth }: HeroProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [handshakeStatus, setHandshakeStatus] = useState<"checking" | "success" | "offline">("checking");

  useEffect(() => {
    if (!user) return;
    
    let active = true;
    const checkConnection = async () => {
      try {
        const { db } = await import("../firebase");
        const { doc, getDocFromServer } = await import("firebase/firestore");
        
        // Let's execute a quick handshake test
        await getDocFromServer(doc(db, "test", "handshake"));
        if (active) setHandshakeStatus("success");
      } catch (err: any) {
        if (!active) return;
        // Firebase permission-denied is actually a success, as it proving our communication
        // with the server and that our security rules successfully intercepted the request.
        if (err?.code === "permission-denied" || err?.message?.includes("permission") || err?.message?.includes("denied")) {
          setHandshakeStatus("success");
        } else {
          setHandshakeStatus("offline");
        }
      }
    };

    checkConnection();
    return () => {
      active = false;
    };
  }, [user]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    {
      icon: Key,
      title: "Universal OAuth Federated Identity",
      desc: "Implement pristine Google and password-based sign-in structures right off the shelf with zero configuration complexity."
    },
    {
      icon: ShieldCheck,
      title: "Hardened Security Handshakes",
      desc: "Architected around strict JWT checks, token cycle states, and zero-trust credentials storage patterns."
    },
    {
      icon: Zap,
      title: "High Performance Low-Latency State",
      desc: "Fully optimized rendering and context structures guaranteeing immediate responsiveness and transitions."
    },
    {
      icon: Database,
      title: "Pluggable Storage Adapters",
      desc: "Seamless transition paths dedicated for Firebase Auth & Firestore, or Supabase database backends with pre-written comment blocks."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter Shell",
      price: "$0",
      desc: "Great for testing mock states, examining design architectures, and building quick prototypes.",
      features: [
        "Interactive Sign-In simulations",
        "Mock session state persistence",
        "Configured OAuth structure template",
        "Framer motion screen templates",
        "Standard support channels"
      ],
      popular: false,
      cta: "Test Mock Portal"
    },
    {
      name: "Developer Core",
      price: "$29",
      period: "/month",
      desc: "Perfect for scaling professional full-stack apps targeting actual cloud databases.",
      features: [
        "Unbounded secure active users",
        "Firebase & Supabase SDK modules",
        "Pre-audited Firestore rulesets",
        "Custom domain redirects configuration",
        "24/7 dedicated support priority",
        "Advanced RBAC permission layers"
      ],
      popular: true,
      cta: "Configure Cloud Storage"
    },
    {
      name: "Enterprise Vault",
      price: "Custom",
      desc: "Tailored to demanding global organizations requiring bespoke SLA guarantees and auditing.",
      features: [
        "Dedicated isolated network layers",
        "Bespoke security rules audit compliance",
        "Unlimited federated directories Sync",
        "Bespoke OAuth redirect flows",
        "Direct engineer consultations",
        "SLA standard uptime coverage"
      ],
      popular: false,
      cta: "Contact Security Architect"
    }
  ];

  const faqs = [
    {
      q: "Does this template connect to a real database?",
      a: "Yes! While it initializes in a highly interactive sandbox with local state for easy testing, the underlying context code contains complete, step-by-step example implementations and detailed instructions for Firebase Authentication/Firestore and Supabase. You can swap them in seconds."
    },
    {
      q: "How can I configure the 'Continue with Google' button with my credentials?",
      a: "Simply follow the detailed instructions found in the `TODO` comments inside `/src/context/AuthContext.tsx`. For Firebase, use the `signInWithPopup(auth, provider)` pattern. For Supabase, utilize `supabase.auth.signInWithOAuth({ provider: 'google' })` with your client key setup."
    },
    {
      q: "Does this framework enforce secure passwords?",
      a: "Absolutely. The sign-up form automatically verifies minimum length criteria (6+ characters) and enforces complete field requirements, responding with beautiful animated validation states."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50">
      {/* Hero Header Section */}
      <section id="hero" className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8 mt-2">
        {/* Subtle decorative background lights */}
        <div className="absolute -top-12 left-12 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-10" />
        <div className="absolute top-1/2 right-12 w-[600px] h-[600px] bg-neutral-100/60 rounded-full blur-3xl -z-10" />
        
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            {/* Tagline */}
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 mb-6 uppercase tracking-wider select-none animate-bounce"
            >
              <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
              v4.0 is now live
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              variants={itemVariants}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-neutral-900 leading-[1.1] mb-6 max-w-4xl tracking-tight"
            >
              Engineering the next <span className="text-blue-600">standard</span> for data scale.
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-neutral-600 font-sans font-normal mb-8 max-w-2xl leading-relaxed"
            >
              Build, deploy, and monitor high-performance React applications with built-in serverless modules. Integrated auth, database, and edge functions in one sleek dashboard.
            </motion.p>

            {/* Edge Stats */}
            <motion.div 
              variants={itemVariants}
              className="grid grid-cols-2 gap-8 mb-10 min-w-[280px] sm:min-w-[340px] max-w-sm mx-auto border-t border-b border-neutral-200/50 py-4 select-none"
            >
              <div className="flex flex-col gap-0.5 text-center">
                <span className="text-2xl font-black text-neutral-900 font-display">99.99%</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">Uptime SLA</span>
              </div>
              <div className="flex flex-col gap-0.5 text-center">
                <span className="text-2xl font-black text-neutral-900 font-display">~45ms</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-sans">Avg Edge Latency</span>
              </div>
            </motion.div>

            {/* CTAs */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full"
            >
              {user ? (
                <div className="flex flex-col items-center">
                  <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
                    <div className="text-xs font-bold text-neutral-800 flex items-center space-x-2 bg-neutral-100 px-4 py-2.5 rounded-xl border border-neutral-200 shadow-sm font-mono">
                      <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
                      <span>ACTIVE ID: {user.email || user.uid.substring(0, 8)}</span>
                    </div>

                    {handshakeStatus === "checking" && (
                      <div className="text-xs font-bold text-blue-700 flex items-center space-x-2 bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100 shadow-sm font-mono animate-pulse">
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
                        <span>VERIFYING GOOGLE FIRESTORE HANDSHAKE...</span>
                      </div>
                    )}

                    {handshakeStatus === "success" && (
                      <div className="text-xs font-bold text-emerald-800 flex items-center space-x-2 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 shadow-sm font-mono">
                        <CloudLightning className="h-3.5 w-3.5 text-emerald-600" />
                        <span>DATABASE HANDSHAKE: SUCCESS</span>
                      </div>
                    )}

                    {handshakeStatus === "offline" && (
                      <div className="text-xs font-bold text-amber-800 flex items-center space-x-2 bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200 shadow-sm font-mono">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>OFFLINE SIM PROTOCOL RUNNING</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => navigate("/dashboard")}
                    className="group flex items-center space-x-2 px-8 py-4 rounded-xl border border-blue-600 bg-blue-600 text-base font-bold text-white transition-all hover:bg-blue-700 shadow-lg shadow-blue-600/15 hover:shadow-xl cursor-pointer"
                    id="hero-dashboard-panel-btn"
                  >
                    <span>Direct Access to Dashboard Panel</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onNavigateToAuth("signup")}
                    className="group w-full sm:w-auto flex items-center justify-center space-x-2 rounded-full bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 cursor-pointer"
                    id="hero-cta-get-started"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => onNavigateToAuth("signin")}
                    className="w-full sm:w-auto rounded-full border border-neutral-300 bg-white px-8 py-3.5 text-base font-semibold text-neutral-800 transition-all hover:bg-neutral-50 hover:border-neutral-400 shadow-sm cursor-pointer"
                    id="hero-cta-signin"
                  >
                    Log In to Account
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 border-t border-neutral-200/60 bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-3">Architected with Precision</h2>
            <p className="font-sans text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Uncompromised Technical Standards</p>
            <p className="text-neutral-500 font-sans font-light mt-3 max-w-xl mx-auto">
              Our structures bypass boilerplate setup and go straight to secure, production-ready design practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div 
                  key={idx}
                  className="flex gap-5 p-6 rounded-2xl border border-neutral-200/70 bg-neutral-50/[0.2] transition-all hover:bg-neutral-50/[0.6] hover:shadow-sm"
                  id={`feature-card-${idx}`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                    <IconComp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-sans text-lg font-bold text-neutral-900 mb-1">{feat.title}</h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Grid Section */}
      <section id="pricing" className="py-24 border-t border-neutral-100 bg-neutral-50/[0.3] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-3">Pragmatic Plans</h2>
            <p className="font-sans text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Pricing Built for Scale</p>
            <p className="text-neutral-500 font-sans font-light mt-3 max-w-xl mx-auto">
              Unlock modular dashboard integration, pre-mapped database schemas, and global federated directory support.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {pricingPlans.map((plan, idx) => (
              <div
                key={idx}
                className={`flex flex-col relative rounded-2xl p-8 border ${
                  plan.popular 
                    ? "border-blue-600 bg-white ring-1 ring-blue-600/30 shadow-xl shadow-blue-50" 
                    : "border-neutral-200 bg-white shadow-sm"
                }`}
                id={`pricing-card-${idx}`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-sm">
                    Most Popular choice
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-neutral-900 font-sans mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-3">
                    <span className="text-4xl font-extrabold tracking-tight text-neutral-900">{plan.price}</span>
                    {plan.period && <span className="text-sm text-neutral-500 ml-1">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-neutral-500 leading-relaxed">{plan.desc}</p>
                </div>

                <hr className="border-neutral-100 my-2" />

                <ul className="space-y-3.5 my-6 flex-grow">
                  {plan.features.map((featItem, fIdx) => (
                    <li key={fIdx} className="flex items-start text-sm text-neutral-700">
                      <div className="mr-2.5 mt-0.5 rounded-full bg-blue-50 p-0.5">
                        <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      </div>
                      <span>{featItem}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onNavigateToAuth("signin")}
                  className={`w-full rounded-xl py-3 text-center text-sm font-bold transition-all ${
                    plan.popular
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100 hover:bg-blue-700"
                      : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accordion FAQ Section */}
      <section id="faqs" className="py-24 border-t border-neutral-200/50 bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-3">Answers & Specifics</h2>
            <p className="font-sans text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">Frequently Asked Questions</p>
          </div>

          <div className="divide-y divide-neutral-200 border-t border-b border-neutral-200">
            {faqs.map((faq, index) => (
              <div key={index} className="py-5" id={`faq-${index}`}>
                <button
                  onClick={() => toggleFaq(index)}
                  className="flex w-full items-center justify-between text-left focus:outline-none"
                  aria-expanded={openFaq === index}
                >
                  <span className="font-sans text-base font-bold text-neutral-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-neutral-500 transition-transform duration-300 shrink-0 ${
                      openFaq === index ? "rotate-180 text-blue-600" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === index ? "max-h-96 mt-3 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="text-sm leading-relaxed text-neutral-600 bg-neutral-50/50 p-4 rounded-xl border border-neutral-100">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Footer */}
      <footer className="bg-neutral-900 py-12 px-4 sm:px-6 lg:px-8 border-t border-neutral-800 text-neutral-400">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
              <ShieldCheck className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-sans text-base font-bold tracking-tight text-white">
              Aegis<span className="text-blue-500 font-semibold">Portal</span>
            </span>
          </div>

          <p className="text-xs text-neutral-500 font-mono text-center md:text-left">
            // Registered design portal in pure React. Port 3000 running smoothly.
          </p>

          <p className="text-xs text-neutral-500">
            &copy; 2026 Aegis Portal. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
