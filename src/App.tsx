import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import BearLogo from "./components/BearLogo";
import AuthForm from "./components/AuthForm";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./components/Dashboard";
import { db } from "./firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { BEAR_TEMPLATES, BearTemplate } from "./data/bearTemplates";
import { 
  Globe, 
  Lock, 
  Plus, 
  Sparkles, 
  User as UserIcon, 
  Calendar, 
  LogOut, 
  Home, 
  LayoutDashboard, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Heart,
  RefreshCw,
  X,
  ArrowRight,
  UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Local types
interface BearPostEntity {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  caption: string;
  imageUrl: string;
  isPublic: boolean;
  reactions: { [key: string]: string[] };
  createdAt: string;
  updatedAt: string;
}

// Global default seeded posts to make the platform immediately rich & engaging 
const DEFAULT_SEED_POSTS: BearPostEntity[] = [
  {
    id: "seed-grizzly",
    userId: "grizzly-observer-99",
    userDisplayName: "ApexGrizzWatcher",
    userPhotoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=grizzly",
    caption: "Spotted this massive Rocky Mountain Grizzly catching fat sockeye salmon over the rapids in Katmai today. Witnessed him raise upright on hind legs – must have been at least 8.5 feet of pure alpine authority! 🐟🌲 Nature at its finest.",
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=1200",
    isPublic: true,
    reactions: {
      "🐻": ["u1", "u2"],
      "🍯": [],
      "🐾": ["u3"],
      "🐟": ["u1", "u4", "u5"],
      "🌲": ["u2", "u3"]
    },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "seed-polar",
    userId: "arctic-ranger-01",
    userDisplayName: "GlacierRoamer",
    userPhotoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=polar",
    caption: "A magnificent Polar Bear mother traversing pristine pack ice fields with her twin cubs in Svalbard. Fun fact: Polar bears are outstanding marine swimmers, and can hold a steady pace of 6 miles per hour in freezing waters for days! Keep their ice sheets safe. ❄️🐾",
    imageUrl: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&q=80&w=1200",
    isPublic: true,
    reactions: {
      "🐻": ["u5"],
      "🍯": [],
      "🐾": ["u1", "u2", "u3"],
      "🐟": ["u4"],
      "🌲": []
    },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: "seed-panda",
    userId: "bamboo-biologist-85",
    userDisplayName: "PandaSanctuary",
    userPhotoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=panda",
    caption: "Misty morning snap of our resident Giant Panda enjoying his midday bamboo picnic bundle. These gentle giants spend up to 12 hours a day munching to meet their caloric goals! Look at his mock sixth thumb gripping the bamboo stem perfectly. Absolutely adorable. 🎋🐾",
    imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&q=80&w=1200",
    isPublic: true,
    reactions: {
      "🐻": ["u2"],
      "🍯": ["u1", "u4", "u5"],
      "🐾": ["u1", "u3"],
      "🐟": [],
      "🌲": ["u2"]
    },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

function HomeView() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Highlight slider state
  const [activeSpeciesIndex, setActiveSpeciesIndex] = useState(0);

  // Database posts + client-side reactions state
  const [posts, setPosts] = useState<BearPostEntity[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Selected external user path (Profiles view)
  const [viewingProfile, setViewingProfile] = useState<{
    userId: string;
    userName: string;
    userPhoto: string;
  } | null>(null);

  // Authentication sidebar toggle & unauthenticated reaction click alerts
  const [showAuthSidebar, setShowAuthSidebar] = useState(false);
  const [showAuthPromptModal, setShowAuthPromptModal] = useState(false);

  // Load public posts
  const loadPublicFeed = async () => {
    try {
      setLoadingPosts(true);
      const postsRef = collection(db, "bear_posts");
      const q = query(postsRef, where("isPublic", "==", true));
      const querySnapshot = await getDocs(q);

      const dbList: BearPostEntity[] = [];
      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        dbList.push({
          id: docSnap.id,
          userId: d.userId || "",
          userDisplayName: d.userDisplayName || "Anonymous Bear",
          userPhotoURL: d.userPhotoURL || "",
          caption: d.caption || "",
          imageUrl: d.imageUrl || "",
          isPublic: true,
          reactions: d.reactions || {},
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        });
      });

      // Combine database posts with default high-quality seeds
      // To prevent showing the exact seed twice if saved to Firestore, filter seeds that match ID or caption
      const filteredSeeds = DEFAULT_SEED_POSTS.filter(
        (seed) => !dbList.some((dbP) => dbP.caption === seed.caption)
      );

      const combined = [...dbList, ...filteredSeeds];
      // Sort newest first
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPosts(combined);
    } catch (err) {
      console.error("Error fetching public posts from firestore:", err);
      // Fallback directly to high-fidelity seed data if offline or blocked
      setPosts(DEFAULT_SEED_POSTS);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadPublicFeed();
    // Auto-scroll to top to ensure clean load
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Species Carousel Controls
  const rotateNextSpecies = () => {
    setActiveSpeciesIndex((prev) => (prev + 1) % BEAR_TEMPLATES.length);
  };
  const rotatePrevSpecies = () => {
    setActiveSpeciesIndex((prev) => (prev - 1 + BEAR_TEMPLATES.length) % BEAR_TEMPLATES.length);
  };

  // Toggle Reaction Handler
  const toggleReaction = async (postId: string, emoji: string) => {
    if (!user) {
      setShowAuthPromptModal(true);
      return;
    }

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    // Build fresh reactions list safely
    const currentList = targetPost.reactions[emoji] || [];
    const hasReacted = currentList.includes(user.uid);
    const updatedList = hasReacted 
      ? currentList.filter((uid) => uid !== user.uid)
      : [...currentList, user.uid];

    const updatedReactions = {
      ...targetPost.reactions,
      [emoji]: updatedList
    };

    // Update state instantly for fluid user feedback loop (Optimistic update)
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, reactions: updatedReactions } : p))
    );

    // Save to Firestore under safe update parameters
    try {
      // Direct updates mapped as document patches
      const postDocRef = doc(db, "bear_posts", postId);
      await updateDoc(postDocRef, {
        reactions: updatedReactions,
        updatedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.warn("Firestore update skipped - post is a pre-seeded element or restricted. Kept in local memory.", err.message);
    }
  };

  // Profile click navigation
  const navigateToProfile = (profileUserId: string, displayName: string, photoURL: string) => {
    setViewingProfile({
      userId: profileUserId,
      userName: displayName,
      userPhoto: photoURL
    });
    // Scroll window back down to core feed below Hero header
    const feedHeaderElement = document.getElementById("woods-feed");
    if (feedHeaderElement) {
      feedHeaderElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Reset target filters
  const resetToHome_AllPosts = () => {
    setViewingProfile(null);
    setCategoryFilter(null);
    setSearchQuery("");
  };

  // Filter posts list
  const filteredPostsList = posts.filter((post) => {
    // 1. Profile ownership check
    if (viewingProfile && post.userId !== viewingProfile.userId) {
      return false;
    }

    // 2. Search query matches caption or author
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const inCaption = post.caption.toLowerCase().includes(q);
      const inAuthor = post.userDisplayName.toLowerCase().includes(q);
      if (!inCaption && !inAuthor) return false;
    }

    // 3. Species tag filter
    if (categoryFilter) {
      const q = categoryFilter.toLowerCase();
      // Look for mentions or tag match
      const inCaption = post.caption.toLowerCase().includes(q);
      if (!inCaption) return false;
    }

    return true;
  });

  const activeSpecies: BearTemplate = BEAR_TEMPLATES[activeSpeciesIndex];

  return (
    <div className="relative min-h-screen bg-bear-sand text-bear-dark font-sans selection:bg-bear-latte select-none">
      {/* 1. Header Bar */}
      <nav className="sticky top-0 z-40 w-full border-b border-bear-latte bg-white/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo and Name */}
          <div 
            onClick={resetToHome_AllPosts}
            className="flex cursor-pointer items-center space-x-2.5 transition-transform active:scale-[0.98]"
            id="site-logo-container"
          >
            <BearLogo className="h-9 w-9" />
            <span className="font-display text-xl sm:text-2xl font-black tracking-tight text-bear-dark">
              Beruangs<span className="text-bear-brown">Bear</span>
            </span>
          </div>

          {/* Core Controls */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            {user ? (
              <div className="flex items-center space-x-2.5">
                {/* Dashboard link */}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center space-x-1.5 rounded-xl bg-bear-brown hover:bg-bear-dark px-3 mt-0.5 py-2 text-[11px] font-bold text-white transition-all shadow-xs cursor-pointer active:scale-95"
                  id="nav-action-go-den"
                >
                  <LayoutDashboard className="h-3 w-3" />
                  <span>Go to My Den</span>
                </button>

                {/* mini User Profile card */}
                <div className="hidden sm:flex items-center space-x-2 rounded-xl bg-bear-light border border-bear-latte px-2.5 py-1">
                  <img
                    src={user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`}
                    alt={user.displayName || "User"}
                    referrerPolicy="no-referrer"
                    className="h-6 w-6 rounded-full object-cover border border-bear-latte"
                  />
                  <div className="text-left leading-none">
                    <p className="text-[10px] font-black leading-none">{user.displayName || "Logged In"}</p>
                    <span className="text-[8px] text-bear-khaki font-mono font-bold">Observer den</span>
                  </div>
                </div>

                {/* Log Out */}
                <button
                  onClick={signOut}
                  className="p-2 cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-700 rounded-xl transition-all border border-transparent hover:border-red-100"
                  title="Disconnect Session"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAuthSidebar(true)}
                  className="rounded-xl bg-bear-brown hover:bg-bear-dark text-white px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  id="nav-action-auth"
                >
                  Enter the Den
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 2. MAIN APP CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic Warning: Active developer banner */}
        {user && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-bear-latte p-3 flex sm:flex-row flex-col sm:items-center justify-between text-left gap-3 relative overflow-hidden">
            <div className="flex items-center space-x-2.5 z-10">
              <span className="text-lg">🏕️</span>
              <div>
                <p className="text-xs font-black text-bear-dark">Authenticated Session Live</p>
                <p className="text-[10px] text-bear-khaki font-bold">You can post observations to the main feed and toggle emoji reactions.</p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-[10px] font-bold text-white bg-bear-brown hover:bg-bear-dark px-3 py-1.5 rounded-lg shrink-0 transition-transform hover:scale-102 flex items-center space-x-1"
            >
              <span>Launch Creator Studio</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* PROFILE BANNER OVERLAY - If visiting another user */}
        {viewingProfile ? (
          <div className="mb-8 p-6 bg-white border-2 border-bear-brown rounded-3xl text-left flex sm:flex-row flex-col items-center justify-between gap-6 relative shadow-sm">
            <div className="flex items-center space-x-4">
              <img
                src={viewingProfile.userPhoto || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${viewingProfile.userId}`}
                alt={viewingProfile.userName}
                className="h-16 w-16 rounded-full border-2 border-bear-brown object-cover shadow-xs bg-bear-sand"
              />
              <div className="text-left">
                <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-bear-sand text-[9px] font-bold text-bear-brown uppercase tracking-wider mb-1.5">
                  <UserCheck className="h-3 w-3" />
                  <span>Public Den Profile</span>
                </div>
                <h2 className="text-xl font-display font-black text-bear-dark leading-tight">
                  {viewingProfile.userName}
                </h2>
                <p className="text-xs text-bear-khaki font-medium mt-0.5">
                  Currently viewing public posts and sights posted by this user. Private workspace notes are hidden.
                </p>
              </div>
            </div>

            <button
              onClick={resetToHome_AllPosts}
              className="px-4 py-2.5 bg-bear-sand hover:bg-bear-latte text-bear-dark font-bold text-xs rounded-xl transition-all flex items-center space-x-1 cursor-pointer"
            >
              <span>All Sights feed &rarr;</span>
            </button>
          </div>
        ) : (
          /* BIG BEARS HIGHLIGHT SHOWCASE (Hero carousel) */
          <div className="mb-10 bg-white border border-bear-latte/60 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
            
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-bear-sand/50 rounded-full blur-3xl pointer-events-none transform translate-x-24 -translate-y-24" />
            
            <div className="flex items-center justify-between border-b border-bear-sand pb-4 mb-6">
              <div className="text-left">
                <span className="text-[10px] font-bold text-bear-brown uppercase tracking-widest bg-bear-sand px-2.5 py-1 rounded-md">Species Spotlight</span>
                <h2 className="text-2xl font-display font-black text-bear-dark mt-1 tracking-tight">The Big Bears Spotlight</h2>
              </div>

              {/* Slider page control indicator */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={rotatePrevSpecies}
                  className="p-2 rounded-xl border border-bear-latte hover:bg-bear-sand text-bear-dark transition-all cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[11px] font-mono font-bold text-bear-dark/60">
                  {activeSpeciesIndex + 1} / {BEAR_TEMPLATES.length}
                </span>
                <button
                  onClick={rotateNextSpecies}
                  className="p-2 rounded-xl border border-bear-latte hover:bg-bear-sand text-bear-dark transition-all cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Slider Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSpecies.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                {/* species Visual description column (span 5) */}
                <div className="lg:col-span-5 space-y-4 text-left">
                  <div className="inline-flex items-center space-x-2 bg-bear-sand/70 p-1.5 px-3 rounded-full text-bear-dark">
                    <span className="text-xs font-bold font-mono tracking-wider text-bear-brown uppercase">{activeSpecies.category} species</span>
                  </div>

                  <h3 className="text-2xl font-display font-black text-bear-dark tracking-tight leading-none">
                    {activeSpecies.title}
                  </h3>
                  
                  <p className="text-xs font-mono font-bold text-bear-khaki italic">
                    {activeSpecies.scientificName}
                  </p>

                  <p className="text-xs text-neutral-600 font-medium leading-relaxed">
                    {activeSpecies.description}
                  </p>

                  {/* Fun fact callbox */}
                  <div className="p-3.5 bg-bear-sand/50 border border-bear-latte/60 rounded-2xl">
                    <p className="text-[10px] font-bold text-bear-brown uppercase tracking-wider mb-1">💡 Fun Sight Fact</p>
                    <p className="text-xs font-semibold text-bear-dark leading-relaxed leading-relaxed">
                      {activeSpecies.funFact}
                    </p>
                  </div>

                  {/* quick parameters */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-bear-light/80 p-2.5 rounded-xl border border-bear-latte/30">
                      <p className="text-[9px] font-bold text-bear-khaki uppercase">Primary Diet</p>
                      <p className="text-[11px] font-bold text-bear-dark mt-0.5 truncate">{activeSpecies.diet}</p>
                    </div>

                    <div className="bg-bear-light/80 p-2.5 rounded-xl border border-bear-latte/30">
                      <p className="text-[9px] font-bold text-bear-khaki uppercase">Domain Habitat</p>
                      <p className="text-[11px] font-bold text-bear-dark mt-0.5 truncate">{activeSpecies.habitat}</p>
                    </div>
                  </div>
                </div>

                {/* species Big Picture column (span 7) */}
                <div className="lg:col-span-7 h-[260px] sm:h-[320px] rounded-2xl overflow-hidden relative border border-bear-latte group">
                  <img
                    src={activeSpecies.imageUrl}
                    alt={activeSpecies.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                  {/* Filter sightings of this species button */}
                  <button
                    onClick={() => setCategoryFilter(categoryFilter === activeSpecies.category ? null : activeSpecies.category)}
                    className={`absolute bottom-5 right-5 px-3 py-1.5 text-[10px] font-bold rounded-lg border flex items-center space-x-1 cursor-pointer transition-all ${
                      categoryFilter === activeSpecies.category
                        ? "bg-bear-brown border-transparent text-white shadow-md shadow-bear-brown/30"
                        : "bg-white/90 glass-light text-bear-dark border-bear-latte hover:bg-white"
                    }`}
                  >
                    <span>{categoryFilter === activeSpecies.category ? "Showing Spotlights Only" : "Filter Sights of this Category"}</span>
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* 3. CORE REDDIT-LIKE FEED SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left" id="woods-feed">
          
          {/* LEFT CHANNELS & SCROLLABLE PUBLIC SIGHTINGS FEED (span 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Search and Category Tabs */}
            <div className="bg-white border border-bear-latte/65 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-bear-khaki">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search bear sightings, captions, or observers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-bear-sand/35 border border-bear-latte rounded-xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
                />
              </div>

              {/* quick category filter tags */}
              <div className="flex flex-wrap gap-1.5 select-none shrink-0">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                    !categoryFilter 
                      ? "bg-bear-brown text-white shadow-xs" 
                      : "bg-bear-sand text-neutral-500 hover:text-bear-dark"
                  }`}
                >
                  All Woods
                </button>
                {["Grizzly", "Polar", "Panda", "Spirit", "Kodiak", "Black"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer ${
                      categoryFilter === cat 
                        ? "bg-bear-brown text-white shadow-xs" 
                        : "bg-bear-sand text-neutral-500 hover:text-bear-dark"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Display list of posts */}
            {loadingPosts ? (
              <div className="flex flex-col items-center justify-center py-20 text-bear-khaki bg-white border border-bear-latte/60 rounded-3xl">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <p className="text-xs font-bold mt-2 font-mono">Loading wild feeds...</p>
              </div>
            ) : filteredPostsList.length === 0 ? (
              <div className="text-center py-20 px-4 bg-white border border-bear-latte/65 rounded-3xl">
                <div className="mx-auto h-12 w-12 text-bear-khaki mb-3 text-lg">🐾</div>
                <h4 className="font-display font-bold text-bear-dark text-sm">No bear sightings matching criteria.</h4>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Be the first observer to post! Simply sign in and log your sightings inside your personal den page.
                </p>
                <button
                  onClick={resetToHome_AllPosts}
                  className="mt-4 px-4 py-2 bg-bear-sand hover:bg-bear-latte text-bear-dark text-xs font-extrabold rounded-lg transition-all"
                >
                  Reset parameters and display all entries
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPostsList.map((post) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-bear-latte/60 rounded-3xl p-5 sm:p-6 shadow-xs relative hover:border-bear-khaki/30 transition-all"
                  >
                    
                    {/* Poster Bio Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={post.userPhotoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.userId}`}
                          alt={post.userDisplayName}
                          onClick={() => navigateToProfile(post.userId, post.userDisplayName, post.userPhotoURL)}
                          className="h-9 w-9 rounded-full object-cover border border-bear-latte cursor-pointer hover:border-bear-brown transition-colors bg-bear-sand shrink-0"
                        />
                        <div className="text-left leading-tight">
                          <p 
                            onClick={() => navigateToProfile(post.userId, post.userDisplayName, post.userPhotoURL)}
                            className="text-xs font-extrabold text-bear-dark hover:text-bear-brown cursor-pointer transition-colors"
                          >
                            {post.userDisplayName}
                          </p>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <span className="text-[9px] text-bear-khaki font-mono font-bold">Observer</span>
                            <span className="text-[9px] text-neutral-400 font-mono">•</span>
                            <span className="text-[9px] text-neutral-450 text-neutral-400 font-mono">
                              {new Date(post.createdAt).toLocaleDateString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Display category label based on matches */}
                      <span className="text-[9px] bg-bear-sand font-mono font-bold text-bear-brown uppercase tracking-wider px-2 py-0.5 rounded-md">
                        {BEAR_TEMPLATES.find(t => post.caption.toLowerCase().includes(t.category.toLowerCase()))?.category || "Bear Sight"}
                      </span>
                    </div>

                    {/* Poster Main Caption description */}
                    <div className="text-xs sm:text-sm font-medium text-bear-dark leading-relaxed mb-4 leading-relaxed font-sans whitespace-pre-wrap">
                      {post.caption}
                    </div>

                    {/* Poster Cover Picture */}
                    <div className="rounded-2xl overflow-hidden max-h-[380px] bg-bear-sand/50 border border-bear-latte/40 mb-4 flex items-center justify-center relative">
                      <img
                        src={post.imageUrl}
                        alt="Bear Sighting"
                        loading="lazy"
                        className="w-full h-full object-cover rounded-2xl"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d";
                        }}
                      />
                    </div>

                    {/* Reactions Toolbar footer */}
                    <div className="border-t border-bear-sand pt-4 flex flex-wrap items-center justify-between gap-4">
                      
                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Render active reaction indicators */}
                        {["🐻", "🍯", "🐾", "🐟", "🌲"].map((emoji) => {
                          const reactorList = post.reactions[emoji] || [];
                          const userHasReacted = user ? reactorList.includes(user.uid) : false;
                          return (
                            <button
                              key={emoji}
                              onClick={() => toggleReaction(post.id, emoji)}
                              className={`px-3 py-1.5 text-xs font-mono font-black rounded-xl border transition-all flex items-center space-x-1.5 cursor-pointer active:scale-90 select-none ${
                                userHasReacted
                                  ? "bg-amber-50 border-bear-brown text-bear-dark font-extrabold"
                                  : "bg-bear-light border-bear-latte text-neutral-500 hover:text-bear-dark hover:border-bear-khaki/60"
                              }`}
                              title={
                                emoji === "🐻" ? "Bear Hug" :
                                emoji === "🍯" ? "Honey Pot" :
                                emoji === "🐾" ? "Paws Up" :
                                emoji === "🐟" ? "Salmon Catch" : "Pine Wilderness"
                              }
                            >
                              <span>{emoji}</span>
                              <span className="text-[10px] opacity-80">{reactorList.length}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-[10px] text-bear-khaki font-semibold font-mono">
                        {(Object.values(post.reactions) as string[][]).reduce((acc, curr) => acc + curr.length, 0)} engagements
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE DESKTOP USER INFO & AUTHENTICATOR PANELS (span 4) */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Den Observer Spotlight Widget */}
            <div className="bg-gradient-to-br from-white to-bear-light border border-bear-latte rounded-3xl p-6 text-left shadow-xs">
              <h3 className="font-display font-black text-bear-dark text-base flex items-center space-x-2">
                <span>🌲</span>
                <span>The Beruang Dens</span>
              </h3>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed mt-2">
                BeruangsBear is a dedicated sandbox server built solely to register local bear activities. No noise, no larp telemetry data. Just pure, clean bear spotting logging.
              </p>

              <div className="border-t border-bear-latte pt-4 mt-4 space-y-3 font-medium text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Registered Observations:</span>
                  <span className="font-mono font-bold text-bear-dark">{posts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Curators status:</span>
                  <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    <span>Open Sanctuary</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sidebar login card if logged out */}
            {!user ? (
              <div className="bg-white border border-bear-latte/65 rounded-3xl p-6 shadow-sm">
                <div className="mb-4">
                  <span className="text-[10px] font-bold text-bear-brown uppercase tracking-wider bg-bear-sand px-2.5 py-1 rounded">Observer Portal</span>
                  <h4 className="font-display font-black text-bear-dark text-md mt-1.5">Compose Sights & Save Notes</h4>
                  <p className="text-[11px] text-neutral-400 font-medium leading-relaxed mt-1">
                    Register a free profile to record private logs, upload public sightings, and click emoji reactions on posts.
                  </p>
                </div>
                
                <AuthForm />
              </div>
            ) : (
              <div className="bg-white border border-bear-latte/65 rounded-3xl p-6 text-center space-y-4 shadow-sm">
                <img
                  src={user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`}
                  alt={user.displayName || "User"}
                  className="h-16 w-16 rounded-full border-2 border-bear-brown mx-auto object-cover bg-bear-sand"
                />
                
                <div className="leading-tight">
                  <h4 className="font-display font-black text-bear-dark text-base">{user.displayName || "Den Observer"}</h4>
                  <p className="text-[11px] text-bear-khaki font-bold font-mono mt-0.5">{user.email}</p>
                </div>

                <div className="p-3 bg-bear-sand/50 rounded-2xl text-[11px] text-neutral-500 font-semibold leading-relaxed leading-relaxed text-left">
                  🏡 Welcome back! You are authenticated. Tap Below to drafting sightings, customize covers, or write private logs.
                </div>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 bg-bear-brown hover:bg-bear-dark text-white font-bold rounded-2xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer text-xs active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span>Draft New Sight / Note</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 4. MODALS & SLIDE-OVER OVERLAYS */}
      
      {/* Auth Drawer slide over if guest taps auth button on mobile/desktop */}
      <AnimatePresence>
        {showAuthSidebar && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div 
              className="absolute inset-0 bg-black/35 backdrop-blur-xs transition-opacity" 
              onClick={() => setShowAuthSidebar(false)}
            />
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-screen max-w-md bg-white border-l border-bear-latte relative flex flex-col shadow-2xl p-6 overflow-y-auto"
              >
                <button
                  onClick={() => setShowAuthSidebar(false)}
                  className="absolute top-5 left-5 p-2 rounded-full hover:bg-bear-sand text-bear-khaki hover:text-bear-dark transition-colors cursor-pointer"
                >
                  ✕ Close
                </button>
                <div className="mt-12">
                  <AuthForm onClose={() => setShowAuthSidebar(false)} />
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth required pop-up modal warning */}
      <AnimatePresence>
        {showAuthPromptModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-bear-latte rounded-3xl w-full max-w-md p-6 sm:p-8 text-center relative shadow-2xl"
            >
              <button
                onClick={() => setShowAuthPromptModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-bear-sand text-bear-khaki hover:text-bear-dark transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-bear-sand border border-bear-latte text-2xl mb-4">
                🍯
              </div>

              <h3 className="font-display font-black text-bear-dark text-lg mb-2">Den Account Required</h3>
              <p className="text-xs text-neutral-500 font-medium leading-relaxed mb-6">
                You must be logged into BeruangsBear to send emoji reactions or draft personal bear observations. It only takes 10 seconds!
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowAuthPromptModal(false);
                    setShowAuthSidebar(true);
                  }}
                  className="flex-1 py-3 bg-bear-brown hover:bg-bear-dark text-white font-bold rounded-xl text-xs shadow-xs transition-all cursor-pointer"
                >
                  Sign In / Register
                </button>
                <button
                  onClick={() => setShowAuthPromptModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-bear-dark border border-bear-latte hover:bg-bear-sand rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeView />} />
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
