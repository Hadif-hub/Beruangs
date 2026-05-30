import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  deleteDoc, 
  setDoc,
  orderBy
} from "firebase/firestore";
import { BEAR_TEMPLATES, BearTemplate } from "../data/bearTemplates";
import BearLogo from "./BearLogo";
import { 
  Globe, 
  Lock, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  FolderLock, 
  Flame, 
  LogOut, 
  ArrowLeft,
  RefreshCw,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface BearEntity {
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

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Loaders & Alerts
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // User's private notes and public posts
  const [myBearEntries, setMyBearEntries] = useState<BearEntity[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "notes">("posts");

  // Editorial draft state
  const [caption, setCaption] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>(BEAR_TEMPLATES[0].imageUrl);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(BEAR_TEMPLATES[0].id);
  const [customUrlInput, setCustomUrlInput] = useState<string>("");
  const [isCustomUrlActive, setIsCustomUrlActive] = useState<boolean>(false);

  // Editing state for existing entry
  const [editingEntry, setEditingEntry] = useState<BearEntity | null>(null);
  const [editCaption, setEditCaption] = useState<string>("");
  const [editImageUrl, setEditImageUrl] = useState<string>("");
  const [editIsPublic, setEditIsPublic] = useState<boolean>(true);

  // Load user's entries
  const fetchMyEntries = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const postRef = collection(db, "bear_posts");
      const q = query(postRef, where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const list: BearEntity[] = [];
      querySnapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          userId: d.userId || "",
          userDisplayName: d.userDisplayName || "Anonymous Bear",
          userPhotoURL: d.userPhotoURL || "",
          caption: d.caption || "",
          imageUrl: d.imageUrl || "",
          isPublic: d.isPublic === undefined ? true : d.isPublic,
          reactions: d.reactions || {},
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        });
      });
      
      // Sort locally descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMyBearEntries(list);
    } catch (err: any) {
      console.error("Error retrieving bear entries:", err);
      setErrorMsg("Unable to retrieve your personal entries. Please reload.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEntries();
  }, [user]);

  // Handle template selection
  const selectTemplate = (tpl: BearTemplate) => {
    setIsCustomUrlActive(false);
    setSelectedTemplateId(tpl.id);
    setImageUrl(tpl.imageUrl);
  };

  // Submit Draft
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!caption.trim()) {
      setErrorMsg("Please draft a description caption for your bear post!");
      return;
    }

    const finalImageUrl = isCustomUrlActive ? customUrlInput.trim() : imageUrl;
    if (!finalImageUrl) {
      setErrorMsg("Please provide an image for the bear!");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const entryPayload = {
        userId: user.uid,
        userDisplayName: user.displayName || "Bear Observer",
        userPhotoURL: user.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.uid}`,
        caption: caption.trim(),
        imageUrl: finalImageUrl,
        isPublic: isPublic,
        reactions: {
          "🐻": [],
          "🍯": [],
          "🐾": [],
          "🐟": [],
          "🌲": []
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "bear_posts"), entryPayload);
      
      const newEntry: BearEntity = {
        id: docRef.id,
        ...entryPayload
      };

      setMyBearEntries((prev) => [newEntry, ...prev]);
      setSuccessMsg(
        isPublic 
          ? "🐻 Magnificent! Your bear post has been uploaded to the public feed." 
          : "🔒 Private note secured inside your personal reserve index."
      );

      // Reset fields
      setCaption("");
      setCustomUrlInput("");
      setIsCustomUrlActive(false);
      setSelectedTemplateId(BEAR_TEMPLATES[0].id);
      setImageUrl(BEAR_TEMPLATES[0].imageUrl);
    } catch (err: any) {
      console.error("Error saving bear entry:", err);
      setErrorMsg("Database save failed. Ensure rules permit your payload.");
    } finally {
      setSaving(false);
    }
  };

  // Delete Entry
  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you absolutely sure you want to delete this bear entry?")) return;
    try {
      setDeletingId(id);
      setErrorMsg(null);
      await deleteDoc(doc(db, "bear_posts", id));
      setMyBearEntries((prev) => prev.filter((item) => item.id !== id));
      setSuccessMsg("Entry successfully recycled!");
    } catch (err: any) {
      console.error("Error deleting document:", err);
      setErrorMsg("Failed to remove item. Unprivileged write access.");
    } finally {
      setDeletingId(null);
    }
  };

  // Trigger Edit modal or mode
  const startEdit = (entry: BearEntity) => {
    setEditingEntry(entry);
    setEditCaption(entry.caption);
    setEditImageUrl(entry.imageUrl);
    setEditIsPublic(entry.isPublic);
  };

  // Save Edits
  const handleSaveEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry || !user) return;
    if (!editCaption.trim()) {
      setErrorMsg("Caption cannot be left empty.");
      return;
    }
    if (!editImageUrl.trim()) {
      setErrorMsg("Image URL cannot be left empty.");
      return;
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      
      const updatePayload = {
        ...editingEntry,
        caption: editCaption.trim(),
        imageUrl: editImageUrl.trim(),
        isPublic: editIsPublic,
        updatedAt: new Date().toISOString()
      };

      // Set entire document safely to trigger validation schema rules
      await setDoc(doc(db, "bear_posts", editingEntry.id), {
        userId: updatePayload.userId,
        userDisplayName: updatePayload.userDisplayName,
        userPhotoURL: updatePayload.userPhotoURL,
        caption: updatePayload.caption,
        imageUrl: updatePayload.imageUrl,
        isPublic: updatePayload.isPublic,
        reactions: updatePayload.reactions,
        createdAt: updatePayload.createdAt,
        updatedAt: updatePayload.updatedAt
      });

      setMyBearEntries((prev) =>
        prev.map((item) => (item.id === editingEntry.id ? updatePayload : item))
      );
      setSuccessMsg("Bear entry successfully synchronized with the cloud forest!");
      setEditingEntry(null);
    } catch (err: any) {
      console.error("Error editing document:", err);
      setErrorMsg("Update failed. Make sure you don't modify author identity fields.");
    } finally {
      setSaving(false);
    }
  };

  // Filter lists based on tab
  const postsList = myBearEntries.filter((item) => item.isPublic === true);
  const notesList = myBearEntries.filter((item) => item.isPublic === false);

  return (
    <div className="min-h-screen bg-bear-sand">
      {/* Top Professional Bear Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-bear-latte shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            onClick={() => navigate("/")} 
            className="flex items-center space-x-2 cursor-pointer group"
          >
            <BearLogo className="h-9 w-9 group-hover:scale-105 transition-transform" />
            <span className="font-display text-xl font-extrabold text-bear-dark tracking-tight">
              Beruangs<span className="text-bear-brown">Bear</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 text-xs font-bold text-bear-brown hover:text-bear-dark transition-colors flex items-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back To Main feed</span>
            </button>

            <button
              onClick={signOut}
              className="px-3.5 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-transparent hover:border-red-100"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Stand Down</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-bear-brown to-bear-clay rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-md relative overflow-hidden select-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none transform translate-x-20 -translate-y-20" />
          <div className="relative z-10 max-w-2xl text-left">
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
              <span>Personal Bear Sanctuary</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
              Hello, {user?.displayName || "Fellow Bear Enthusiast"}!
            </h1>
            <p className="text-xs sm:text-sm text-bear-latte font-medium mt-1 leading-relaxed max-w-xl">
              This is your customized den. Draft magnificent stories with gorgeous cover graphics, publish them as public discussions to the feed, or store them privately as protected notes.
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start space-x-3 font-medium"
            >
              <span className="text-base select-none">⚠️</span>
              <div>
                <p className="font-bold">Sanctuary Alert</p>
                <p className="opacity-90">{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-700 font-bold">✕</button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-emerald-55 z-20 border border-emerald-100 bg-emerald-50 rounded-2xl text-xs text-emerald-800 flex items-start space-x-3 font-medium"
            >
              <span className="text-base select-none">🍯</span>
              <div>
                <p className="font-bold">Sanctuary Sync</p>
                <p className="opacity-90">{successMsg}</p>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-700 font-bold">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Composer Deck (span 5/12) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-bear-latte rounded-3xl p-6 shadow-sm">
              <h2 className="font-display font-black text-bear-dark text-lg mb-4 flex items-center space-x-2">
                <span>🐻</span>
                <span>Craft Bear Entry</span>
              </h2>

              <form onSubmit={handleCreateEntry} className="space-y-5">
                {/* Visual Image Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-bear-dark/70 uppercase">Select Bear Cover Image</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomUrlActive(!isCustomUrlActive)}
                      className="text-xs font-bold text-bear-brown hover:text-bear-dark flex items-center space-x-1"
                    >
                      <LinkIcon className="h-3 w-3" />
                      <span>{isCustomUrlActive ? "Choose preset" : "Custom URL"}</span>
                    </button>
                  </div>

                  {!isCustomUrlActive ? (
                    <div className="grid grid-cols-3 gap-2">
                      {BEAR_TEMPLATES.map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => selectTemplate(tpl)}
                          className={`group cursor-pointer rounded-xl overflow-hidden border-2 relative transition-all ${
                            selectedTemplateId === tpl.id
                              ? "border-bear-brown scale-95 shadow-md"
                              : "border-transparent hover:border-bear-khaki/50"
                          }`}
                          title={`${tpl.title} (${tpl.category})`}
                        >
                          <img
                            src={tpl.imageUrl}
                            alt={tpl.title}
                            className="h-14 w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20" />
                          <span className="absolute bottom-1 left-1.5 text-[9px] text-white font-bold tracking-wider uppercase bg-black/40 px-1 rounded">
                            {tpl.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        placeholder="Paste premium image link here (https://...)"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="w-full text-xs font-semibold px-3 py-2.5 bg-bear-sand/40 border border-bear-latte rounded-xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
                      />
                    </div>
                  )}
                </div>

                {/* Entry Caption */}
                <div>
                  <label className="block text-xs font-bold text-bear-dark/70 uppercase mb-1 px-0.5">
                    Describe your bear sighting / thought
                  </label>
                  <textarea
                    rows={4}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Provide details of your bear observation, tell a hilarious bear joke, or write down a cozy private note..."
                    className="w-full text-xs font-medium p-3.5 bg-bear-sand/40 border border-bear-latte rounded-2xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30 leading-relaxed resize-none"
                  />
                  <p className="text-[10px] text-bear-khaki text-right mt-1 font-bold">
                    Supports text and markdown paragraphs
                  </p>
                </div>

                {/* Privacy Visibility Options */}
                <div>
                  <span className="block text-xs font-bold text-bear-dark/70 uppercase mb-1.5 px-0.5 animate-pulse">
                    Visibility Mode
                  </span>
                  <div className="grid grid-cols-2 gap-3.5">
                    {/* Public option */}
                    <div
                      onClick={() => setIsPublic(true)}
                      className={`p-3 rounded-2xl border-2 flex items-center space-x-3 cursor-pointer text-left transition-all ${
                        isPublic === true
                          ? "bg-amber-50/50 border-bear-brown text-bear-dark font-semibold"
                          : "bg-white border-bear-latte/70 hover:border-bear-khaki text-neutral-500"
                      }`}
                    >
                      <div className="p-2 bg-amber-100 rounded-xl text-bear-brown shrink-0">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold">Public Post</p>
                        <p className="text-[10px] opacity-80 truncate">Visible on home feed</p>
                      </div>
                    </div>

                    {/* Private option */}
                    <div
                      onClick={() => setIsPublic(false)}
                      className={`p-3 rounded-2xl border-2 flex items-center space-x-3 cursor-pointer text-left transition-all ${
                        isPublic === false
                          ? "bg-amber-50/50 border-bear-brown text-bear-dark font-semibold"
                          : "bg-white border-bear-latte/70 hover:border-bear-khaki text-neutral-500"
                      }`}
                    >
                      <div className="p-2 bg-amber-100 rounded-xl text-bear-brown shrink-0">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold">Private Note</p>
                        <p className="text-[10px] opacity-80 truncate">Private to your den</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Card Preview */}
                <div className="rounded-2xl border border-bear-latte bg-bear-sand/20 p-4 relative">
                  <span className="absolute top-2.5 right-3 text-[9px] font-mono font-bold tracking-widest text-bear-khaki uppercase select-none">
                    Sandbox Preview
                  </span>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src={user?.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.uid}`}
                      alt="Avatar"
                      className="h-6 w-6 rounded-full bg-bear-latte border border-bear-khaki/40"
                    />
                    <div className="text-left">
                      <p className="text-[11px] font-black leading-tight text-bear-dark">
                        {user?.displayName || "Me"}
                      </p>
                      <p className="text-[9px] text-bear-khaki font-mono font-bold leading-none">
                        {isPublic ? "🌐 Publicly shared" : "🔒 Private reserve"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden max-h-[140px] aspect-video border border-bear-latte/60 mb-2 bg-bear-sand/50">
                    <img
                      src={isCustomUrlActive ? (customUrlInput || "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d") : imageUrl}
                      alt="Compiling cover..."
                      className="w-full h-full object-cover opacity-80"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d";
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-bear-dark leading-relaxed font-sans line-clamp-2 text-left">
                    {caption.trim() || "Type caption to populate preview..."}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3.5 bg-bear-brown hover:bg-bear-dark text-white font-bold rounded-2xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer text-sm"
                >
                  {saving ? (
                    <>
                      <LoaderIcon />
                      <span>Saving to Den...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>{isPublic ? "Post Publicly" : "Lock in Notes"}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: Manager Deck & Collections Filter (span 7/12) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-bear-latte rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-bear-latte pb-4 gap-4">
                <div>
                  <h2 className="font-display font-black text-bear-dark text-lg text-left">Your Collections</h2>
                  <p className="text-[11px] text-bear-khaki font-bold text-left mt-0.5">
                    Click to filter and manage your catalog of sightings.
                  </p>
                </div>

                <div className="flex p-1 bg-bear-sand rounded-xl shrink-0 select-none">
                  <button
                    onClick={() => setActiveTab("posts")}
                    className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      activeTab === "posts"
                        ? "bg-white text-bear-dark shadow-xs"
                        : "text-neutral-500 hover:text-bear-dark"
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    <span>My Posts ({postsList.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                      activeTab === "notes"
                        ? "bg-white text-bear-dark shadow-xs"
                        : "text-neutral-500 hover:text-bear-dark"
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>My Notes ({notesList.length})</span>
                  </button>
                </div>
              </div>

              {/* Loader */}
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-bear-khaki">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <p className="text-xs font-bold mt-2 font-mono">Securing Den Feed...</p>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {/* Empty State */}
                  {((activeTab === "posts" && postsList.length === 0) || 
                    (activeTab === "notes" && notesList.length === 0)) && (
                    <div className="text-center py-16 px-4 border border-dashed border-bear-khaki/30 rounded-2xl bg-bear-sand/20 select-none">
                      <div className="mx-auto h-12 w-12 text-bear-khaki mb-3">🐾</div>
                      <h4 className="font-display font-bold text-bear-dark text-sm">Quiet in the woods</h4>
                      <p className="text-xs text-neutral-450 text-neutral-400 max-w-xs mx-auto mt-1 leading-relaxed">
                        You have not composed any {activeTab === "posts" ? "public posts" : "private notes"} yet. Use the composer on the left to start!
                      </p>
                    </div>
                  )}

                  {/* Render Current List */}
                  <div className="space-y-4">
                    {(activeTab === "posts" ? postsList : notesList).map((entry) => (
                      <div 
                        key={entry.id} 
                        className="bg-bear-light/35 border border-bear-latte/60 rounded-2xl p-4 text-left flex flex-col md:flex-row gap-4 relative group"
                      >
                        {/* Entry Preview Image */}
                        <div className="w-full md:w-32 h-24 rounded-xl overflow-hidden shrink-0 border border-bear-latte/60">
                          <img
                            src={entry.imageUrl}
                            alt="Cover"
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d";
                            }}
                          />
                        </div>

                        {/* Mid Row content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center space-x-2 text-[10px] text-bear-khaki font-mono font-bold mb-1">
                              <span>Id: {entry.id.substring(0, 6)}...</span>
                              <span>•</span>
                              <span>
                                {new Date(entry.createdAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-bear-dark leading-relaxed line-clamp-3">
                              {entry.caption}
                            </p>
                          </div>

                          {/* Reaction summary if public */}
                          {entry.isPublic && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {(Object.entries(entry.reactions || {}) as [string, string[]][]).map(([emoji, uids]) => {
                                if (uids.length === 0) return null;
                                return (
                                  <span 
                                    key={emoji} 
                                    className="bg-white px-2 py-0.5 rounded-lg border border-bear-latte text-[10px] font-mono text-bear-dark font-extrabold flex items-center gap-1.5"
                                  >
                                    <span>{emoji}</span>
                                    <span>{uids.length}</span>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Right side Actions block */}
                        <div className="flex flex-row md:flex-col justify-end md:justify-start items-center gap-2 border-t md:border-t-0 border-bear-latte pt-3 md:pt-0 shrink-0">
                          <button
                            onClick={() => startEdit(entry)}
                            className="flex-1 md:flex-initial p-2 rounded-xl text-bear-brown hover:text-white hover:bg-bear-brown border border-bear-latte hover:border-transparent transition-all cursor-pointer flex items-center justify-center space-x-1"
                            title="Edit entry"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold md:hidden">Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            disabled={deletingId === entry.id}
                            className="flex-1 md:flex-initial p-2 rounded-xl text-red-600 hover:text-white hover:bg-red-600 border border-bear-latte hover:border-transparent transition-all cursor-pointer flex items-center justify-center space-x-1 disabled:opacity-50"
                            title="Delete entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold md:hidden">Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: Inline edit sheet */}
      <AnimatePresence>
        {editingEntry && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-bear-latte rounded-3xl w-full max-w-xl p-6 sm:p-8 relative shadow-2xl"
            >
              <button
                onClick={() => setEditingEntry(null)}
                className="absolute top-5 right-5 p-1 rounded-full hover:bg-bear-sand text-bear-khaki hover:text-bear-dark transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h2 className="font-display font-black text-bear-dark text-lg mb-1 flex items-center space-x-2 text-left">
                <span>📝</span>
                <span>Edit Bear Entry</span>
              </h2>
              <p className="text-xs text-bear-khaki text-left font-bold mb-5 font-mono">
                Updating item identity {editingEntry.id.substring(0, 8)}...
              </p>

              <form onSubmit={handleSaveEdits} className="space-y-4">
                {/* Image URL */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-bear-dark/70 uppercase mb-1">
                    Bear Cover URL
                  </label>
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    required
                    className="w-full text-xs font-semibold px-3 py-2.5 bg-bear-sand/40 border border-bear-latte rounded-xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30"
                  />
                </div>

                {/* Caption */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-bear-dark/70 uppercase mb-1">
                    Caption
                  </label>
                  <textarea
                    rows={4}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    required
                    className="w-full text-xs font-medium p-3.5 bg-bear-sand/40 border border-bear-latte rounded-2xl text-bear-dark focus:outline-none focus:ring-2 focus:ring-bear-brown/30 leading-relaxed resize-none"
                  />
                </div>

                {/* Visibility */}
                <div className="text-left">
                  <label className="block text-xs font-bold text-bear-dark/70 uppercase mb-1.5">
                    Visibility Setup
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setEditIsPublic(true)}
                      className={`p-3 rounded-2xl border-2 flex items-center space-x-3 cursor-pointer text-left transition-all ${
                        editIsPublic === true
                          ? "bg-amber-50/50 border-bear-brown text-bear-dark font-semibold"
                          : "bg-white border-bear-latte/70 hover:border-bear-khaki text-neutral-500"
                      }`}
                    >
                      <Globe className="h-4 w-4 text-bear-brown shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Public Post</p>
                        <p className="text-[10px] opacity-75">Publish on the main feed</p>
                      </div>
                    </div>

                    <div
                      onClick={() => setEditIsPublic(false)}
                      className={`p-3 rounded-2xl border-2 flex items-center space-x-3 cursor-pointer text-left transition-all ${
                        editIsPublic === false
                          ? "bg-amber-50/50 border-bear-brown text-bear-dark font-semibold"
                          : "bg-white border-bear-latte/70 hover:border-bear-khaki text-neutral-500"
                      }`}
                    >
                      <Lock className="h-4 w-4 text-bear-brown shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Private Note</p>
                        <p className="text-[10px] opacity-75">Visible strictly in Notes</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3.5 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingEntry(null)}
                    className="flex-1 py-3 text-xs font-bold text-bear-dark border border-bear-latte hover:bg-bear-sand rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-bear-brown hover:bg-bear-dark text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer text-xs"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Synchronizing...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple spinners
function LoaderIcon() {
  return (
    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
