import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldCheck, 
  User as UserIcon, 
  Activity, 
  Settings, 
  LogOut, 
  Key, 
  Database, 
  CloudLightning, 
  Server, 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  FileText,
  Edit,
  Save,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, auth } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  getDocFromServer,
  getDoc,
  setDoc
} from "firebase/firestore";

// Types for personalized data
interface UserActivityLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details: string;
  origin: string;
}

interface UserInsights {
  apiCallsThisMonth: number;
  availableKeys: number;
  usagePercentage: number;
  activeNodes: number;
}

interface UserApiKey {
  id: string;
  userId: string;
  name: string;
  keyToken: string;
  status: "Active" | "Revoked";
  createdAt: string;
}

interface PersonalNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface GlobalSettings {
  strictSecureHandshakes: boolean;
  telemetryPipeline: boolean;
  originNode: string;
  maxRateLimit: number;
  alertEmail: string;
}

const defaultSettings: GlobalSettings = {
  strictSecureHandshakes: true,
  telemetryPipeline: true,
  originNode: "Asia-Southeast Cloud Node",
  maxRateLimit: 5000,
  alertEmail: "denmasaklomak@gmail.com"
};

// -------------------------------------------------------------
// FIRESTORE ERROR HANDLING SPECIFICATION (ABAC Compliance)
// -------------------------------------------------------------
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates connection to firestore initially on mount
 */
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'handshake'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: Client is offline.");
    }
  }
}

/**
 * ASYNC FIRESTORE DATA FETCHING PATTERN
 * Retrieving personalized database content based on the logged-in user's UID
 */
export async function fetchUserData(uid: string): Promise<{ 
  logs: UserActivityLog[]; 
  insights: UserInsights;
  apiKeys: UserApiKey[];
  settings: GlobalSettings;
  notes: PersonalNote[];
}> {
  const path = "activity_logs";
  try {
    // 1. Fetching Telemetry Logs (No orderBy query to completely bypass index requirement!)
    const logsRef = collection(db, path);
    const q = query(logsRef, where("userId", "==", uid));
    const querySnapshot = await getDocs(q);
    
    let realLogs = querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        userId: data.userId || uid,
        action: data.action || "",
        timestamp: data.timestamp || "",
        details: data.details || "",
        origin: data.origin || "",
      } as UserActivityLog;
    });

    // In-memory sort to completely sidestep index requirement!
    realLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (realLogs.length === 0) {
      const defaultLogs = [
        {
          userId: uid,
          action: "Access Security Handshake",
          timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
          details: "Successfully validated session cookie token in browser security frame.",
          origin: "Local Client Connection"
        },
        {
          userId: uid,
          action: "Regenerated Developer API Token",
          timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
          details: "Regenerated security credential under stratosync-default channel.",
          origin: "Asia-Southeast Cloud Node"
        }
      ];

      for (const logItem of defaultLogs) {
        const docRef = await addDoc(collection(db, "activity_logs"), logItem);
        realLogs.push({
          id: docRef.id,
          ...logItem
        });
      }
      
      realLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // 2. Fetching API keys
    const keysRef = collection(db, "api_keys");
    const qKeys = query(keysRef, where("userId", "==", uid));
    const keysSnapshot = await getDocs(qKeys);
    let realKeys = keysSnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        userId: data.userId || uid,
        name: data.name || "",
        keyToken: data.keyToken || "",
        status: data.status || "Active",
        createdAt: data.createdAt || "",
      } as UserApiKey;
    });

    if (realKeys.length === 0) {
      const defaultKeys = [
        {
          userId: uid,
          name: "Console Command Access Key",
          keyToken: `stratosync_live_dev_${uid.slice(0, 10)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
          status: "Active" as const,
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString()
        }
      ];

      for (const keyItem of defaultKeys) {
        const docRef = await addDoc(keysRef, keyItem);
        realKeys.push({
          id: docRef.id,
          ...keyItem
        });
      }
    }

    realKeys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 3. Fetching User Global Settings
    const settingsDocRef = doc(db, "user_settings", uid);
    const settingsSnapshot = await getDoc(settingsDocRef);
    let currentSettings = { ...defaultSettings };

    if (settingsSnapshot.exists()) {
      currentSettings = settingsSnapshot.data() as GlobalSettings;
    } else {
      await setDoc(settingsDocRef, defaultSettings);
    }

    // 4. Fetching Personal Notes
    const notesRef = collection(db, "personal_notes");
    const qNotes = query(notesRef, where("userId", "==", uid));
    const notesSnapshot = await getDocs(qNotes);
    let realNotes = notesSnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        userId: data.userId || uid,
        title: data.title || "",
        content: data.content || "",
        createdAt: data.createdAt || "",
        updatedAt: data.updatedAt || "",
      } as PersonalNote;
    });

    if (realNotes.length === 0) {
      const defaultNotes = [
        {
          userId: uid,
          title: "Setup & Console Guidelines",
          content: "Welcome to your personal developer journal. Keep track of your infrastructure adjustments, telemetry logs, and security parameters here.\n\nOnly your authenticated user ID has read or write permissions to these notes, backed by Firestore enterprise security rules.",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];

      for (const noteItem of defaultNotes) {
        const docRef = await addDoc(notesRef, noteItem);
        realNotes.push({
          id: docRef.id,
          ...noteItem
        });
      }
    }

    realNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Compute active insights based on logs length and active keys list
    const stringVal = uid.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockInsights: UserInsights = {
      apiCallsThisMonth: (stringVal * 3) % 450 + 120 + realLogs.length,
      availableKeys: realKeys.filter(k => k.status === "Active").length,
      usagePercentage: Math.min((stringVal % 40) + 35 + Math.floor(realLogs.length / 2), 100),
      activeNodes: (stringVal % 4) + 1,
    };

    return { 
      logs: realLogs, 
      insights: mockInsights, 
      apiKeys: realKeys, 
      settings: currentSettings,
      notes: realNotes
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<"insights" | "logs" | "keys" | "settings" | "notes">("insights");
  
  // Dashboard states
  const [loading, setLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [insights, setInsights] = useState<UserInsights | null>(null);
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  
  // Interactive inputs
  const [newAction, setNewAction] = useState<string>("");
  const [newDetails, setNewDetails] = useState<string>("");
  const [newOrigin, setNewOrigin] = useState<string>("Local Client Connection");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Search/Filters
  const [logsSearchText, setLogsSearchText] = useState<string>("");
  const [logsOriginFilter, setLogsOriginFilter] = useState<string>("All");

  // Key form states
  const [newKeyName, setNewKeyName] = useState<string>("");
  const [newKeyPrefix, setNewKeyPrefix] = useState<"stratosync_live_dev" | "stratosync_webhook_sign">("stratosync_live_dev");

  // Dynamic user thresholds for insights customization
  const [targetEdgeCallsLimit, setTargetEdgeCallsLimit] = useState<number>(300);

  // Global settings local form state
  const [editingStrictSecureHandshakes, setEditingStrictSecureHandshakes] = useState<boolean>(true);
  const [editingTelemetryPipeline, setEditingTelemetryPipeline] = useState<boolean>(true);
  const [editingOriginNode, setEditingOriginNode] = useState<string>("");
  const [editingMaxRateLimit, setEditingMaxRateLimit] = useState<number>(5000);
  const [editingAlertEmail, setEditingAlertEmail] = useState<string>("");
  const [settingsSubmitting, setSettingsSubmitting] = useState<boolean>(false);

  // Personal Notes states
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [noteTitle, setNoteTitle] = useState<string>("");
  const [noteContent, setNoteContent] = useState<string>("");
  const [noteSaving, setNoteSaving] = useState<boolean>(false);
  const [noteDeleting, setNoteDeleting] = useState<string | null>(null);
  const [notesSearch, setNotesSearch] = useState<string>("");

  // Load initial personalized data
  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setErrorNotice(null);
      // Validate secure Firestore handshakes
      await testConnection();
      const data = await fetchUserData(user.uid);
      setLogs(data.logs);
      setInsights(data.insights);
      setApiKeys(data.apiKeys);
      setSettings(data.settings);
      setNotes(data.notes);

      // Populate interactive editing states
      setEditingStrictSecureHandshakes(data.settings.strictSecureHandshakes);
      setEditingTelemetryPipeline(data.settings.telemetryPipeline);
      setEditingOriginNode(data.settings.originNode);
      setEditingMaxRateLimit(data.settings.maxRateLimit);
      setEditingAlertEmail(data.settings.alertEmail);

      // Auto-select first note if available we have any notes
      if (data.notes && data.notes.length > 0) {
        setSelectedNote(data.notes[0]);
        setNoteTitle(data.notes[0].title);
        setNoteContent(data.notes[0].content);
      } else {
        setSelectedNote(null);
        setNoteTitle("");
        setNoteContent("");
      }
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to establish secure telemetry database connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Handle adding custom logs safely
  const handleAddNewLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction || !user) return;

    setLoading(true);
    try {
      const addedLogPayload = {
        userId: user.uid,
        action: newAction,
        timestamp: new Date().toISOString(),
        details: newDetails || "Implicit client-triggered security log event.",
        origin: newOrigin || "Active UI Session Frame"
      };

      const docRef = await addDoc(collection(db, "activity_logs"), addedLogPayload);
      const addedLog: UserActivityLog = {
        id: docRef.id,
        ...addedLogPayload
      };

      setLogs((prev) => [addedLog, ...prev]);
      
      // Update insights partially to show active progress
      if (insights) {
        setInsights({
          ...insights,
          apiCallsThisMonth: insights.apiCallsThisMonth + 1,
        });
      }

      setNewAction("");
      setNewDetails("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "activity_logs");
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting custom logs safely
  const handleDeleteLog = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "activity_logs", id));
      setLogs((prev) => prev.filter((log) => log.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `activity_logs/${id}`);
    } finally {
      setLoading(false);
    }
  };

  // Generate new secret keys
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName || !user) return;

    setLoading(true);
    try {
      const randomSeed = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randomVal = Math.random().toString(36).substring(2, 10).toUpperCase();
      const generatedToken = `${newKeyPrefix}_${user.uid.slice(0, 8)}${randomSeed}_${randomVal}`;

      const keyPayload = {
        userId: user.uid,
        name: newKeyName,
        keyToken: generatedToken,
        status: "Active" as const,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, "api_keys"), keyPayload);
      const newKey: UserApiKey = {
        id: docRef.id,
        ...keyPayload
      };

      setApiKeys((prev) => [newKey, ...prev]);

      // Record telemetry log
      const logPayload = {
        userId: user.uid,
        action: `Generated Dynamic API Key`,
        timestamp: new Date().toISOString(),
        details: `Created new access token reference: "${newKeyName}" (${newKeyPrefix}).`,
        origin: "Security System Portal"
      };
      const logRef = await addDoc(collection(db, "activity_logs"), logPayload);
      setLogs((prev) => [{ id: logRef.id, ...logPayload }, ...prev]);

      setNewKeyName("");

      if (insights) {
        setInsights({
          ...insights,
          availableKeys: insights.availableKeys + 1
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "api_keys");
    } finally {
      setLoading(false);
    }
  };

  // Toggle API Key state
  const handleToggleKeyStatus = async (keyId: string, currentStatus: "Active" | "Revoked") => {
    setLoading(true);
    try {
      const nextStatus = currentStatus === "Active" ? "Revoked" : "Active";
      const keyRef = doc(db, "api_keys", keyId);
      const targetDoc = apiKeys.find(k => k.id === keyId);
      if (!targetDoc) return;

      const updatedPayload = { ...targetDoc, status: nextStatus };
      const { id, ...payloadWithoutId } = updatedPayload;
      
      await setDoc(keyRef, payloadWithoutId);
      setApiKeys((prev) => prev.map(k => k.id === keyId ? { ...k, status: nextStatus } : k));

      // Record a telemetry log
      const logPayload = {
        userId: user!.uid,
        action: `API Credentials Updated`,
        timestamp: new Date().toISOString(),
        details: `Modified access token state for "${targetDoc.name}" to: ${nextStatus}.`,
        origin: "Security System Portal"
      };
      const logRef = await addDoc(collection(db, "activity_logs"), logPayload);
      setLogs((prev) => [{ id: logRef.id, ...logPayload }, ...prev]);

      if (insights) {
        setInsights({
          ...insights,
          availableKeys: nextStatus === "Active" ? insights.availableKeys + 1 : Math.max(0, insights.availableKeys - 1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `api_keys/${keyId}`);
    } finally {
      setLoading(false);
    }
  };

  // Permanently erase API key
  const handleDeleteKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to permanently erase this API key?")) return;
    setLoading(true);
    try {
      const targetDoc = apiKeys.find(k => k.id === keyId);
      if (!targetDoc) return;

      await deleteDoc(doc(db, "api_keys", keyId));
      setApiKeys((prev) => prev.filter(k => k.id !== keyId));

      // Record a telemetry log
      const logPayload = {
        userId: user!.uid,
        action: `Permanently Revoked Access Token`,
        timestamp: new Date().toISOString(),
        details: `Deleted credential handle for "${targetDoc.name}".`,
        origin: "Security System Portal"
      };
      const logRef = await addDoc(collection(db, "activity_logs"), logPayload);
      setLogs((prev) => [{ id: logRef.id, ...logPayload }, ...prev]);

      if (insights && targetDoc.status === "Active") {
        setInsights({
          ...insights,
          availableKeys: Math.max(0, insights.availableKeys - 1)
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `api_keys/${keyId}`);
    } finally {
      setLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSettingsSubmitting(true);
    try {
      const newSettings: GlobalSettings = {
        strictSecureHandshakes: editingStrictSecureHandshakes,
        telemetryPipeline: editingTelemetryPipeline,
        originNode: editingOriginNode,
        maxRateLimit: Number(editingMaxRateLimit),
        alertEmail: editingAlertEmail
      };

      const settingsDocRef = doc(db, "user_settings", user.uid);
      await setDoc(settingsDocRef, newSettings);
      setSettings(newSettings);

      // Record a telemetry log
      const logPayload = {
        userId: user.uid,
        action: `Configured Global Parameters`,
        timestamp: new Date().toISOString(),
        details: `Console options saved. Host node: "${editingOriginNode}", Max speed: ${editingMaxRateLimit} ev/s, Alerts recipient: "${editingAlertEmail}".`,
        origin: "Global System Settings"
      };
      const logRef = await addDoc(collection(db, "activity_logs"), logPayload);
      setLogs((prev) => [{ id: logRef.id, ...logPayload }, ...prev]);

      alert("Console configuration saved securely in Google Cloud Firestore!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `user_settings/${user.uid}`);
    } finally {
      setSettingsSubmitting(false);
    }
  };

  // Create a blank Note
  const handleCreateNote = async () => {
    if (!user) return;
    setNoteSaving(true);
    try {
      const notePayload = {
        userId: user.uid,
        title: "Untitled Note",
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "personal_notes"), notePayload);
      const newNote: PersonalNote = {
        id: docRef.id,
        ...notePayload
      };
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNote(newNote);
      setNoteTitle(newNote.title);
      setNoteContent(newNote.content);

      // Audit telemetry log
      const logPayload = {
        userId: user.uid,
        action: "Drafted Personal Note",
        timestamp: new Date().toISOString(),
        details: `Created new secure work notes with node id ${docRef.id}.`,
        origin: "Personal Developer Notes"
      };
      const logRef = await addDoc(collection(db, "activity_logs"), logPayload);
      setLogs((prev) => [{ id: logRef.id, ...logPayload }, ...prev]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "personal_notes");
    } finally {
      setNoteSaving(false);
    }
  };

  // Save current Note modifications
  const handleSaveNote = async () => {
    if (!user || !selectedNote) return;
    setNoteSaving(true);
    try {
      const updatedNote: PersonalNote = {
        ...selectedNote,
        title: noteTitle.trim() || "Untitled Note",
        content: noteContent,
        updatedAt: new Date().toISOString()
      };

      const noteDocRef = doc(db, "personal_notes", selectedNote.id);
      await setDoc(noteDocRef, {
        userId: updatedNote.userId,
        title: updatedNote.title,
        content: updatedNote.content,
        createdAt: updatedNote.createdAt,
        updatedAt: updatedNote.updatedAt
      });

      setNotes((prev) =>
        prev.map((n) => (n.id === selectedNote.id ? updatedNote : n))
      );
      setSelectedNote(updatedNote);

      // Audit telemetry log
      const logPayload = {
        userId: user.uid,
        action: "Synchronized Personal Note",
        timestamp: new Date().toISOString(),
        details: `Saved updates to note: "${updatedNote.title}".`,
        origin: "Personal Developer Notes"
      };
      const logRef = await addDoc(collection(db, "activity_logs"), logPayload);
      setLogs((prev) => [{ id: logRef.id, ...logPayload }, ...prev]);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `personal_notes/${selectedNote.id}`);
    } finally {
      setNoteSaving(false);
    }
  };

  // Delete current Note
  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to permanently delete this note?")) return;
    setNoteDeleting(noteId);
    try {
      await deleteDoc(doc(db, "personal_notes", noteId));
      const remainingNotes = notes.filter((n) => n.id !== noteId);
      setNotes(remainingNotes);
      
      if (selectedNote?.id === noteId) {
        if (remainingNotes.length > 0) {
          setSelectedNote(remainingNotes[0]);
          setNoteTitle(remainingNotes[0].title);
          setNoteContent(remainingNotes[0].content);
        } else {
          setSelectedNote(null);
          setNoteTitle("");
          setNoteContent("");
        }
      }

      // Audit telemetry log
      const logPayload = {
        userId: user.uid,
        action: "Purged Personal Note",
        timestamp: new Date().toISOString(),
        details: `Deleted notes document ID references.`,
        origin: "Personal Developer Notes"
      };
      const logRef = await addDoc(collection(db, "activity_logs"), logPayload);
      setLogs((prev) => [{ id: logRef.id, ...logPayload }, ...prev]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `personal_notes/${noteId}`);
    } finally {
      setNoteDeleting(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50/50 flex-col md:flex-row">
      {/* PERSISTENT SIDEBAR - Restricted layout completely distinct from public index */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col shrink-0 select-none">
        
        {/* Brand Signpost */}
        <div className="p-6 border-b border-neutral-100 flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/10">
            <div className="w-3.5 h-3.5 border-2 border-white rounded-xs"></div>
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-neutral-900">
            Strato<span className="text-blue-600">Sync</span>
          </span>
          <span className="bg-neutral-100 text-neutral-600 font-mono text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-neutral-250">
            Console
          </span>
        </div>

        {/* User Mini Card */}
        {user && (
          <div className="p-4 mx-4 my-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex items-center gap-3">
            <img
              src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || "User"}`}
              alt={user.displayName || "User Avatar"}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full border border-neutral-200 object-cover"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-neutral-900 truncate">
                {user.displayName || "Active Developer"}
              </p>
              <p className="text-[10px] text-neutral-500 truncate font-mono">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Sidebar Nav Actions */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <button
            onClick={() => setActiveTab("insights")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "insights"
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <Activity className="h-4.5 w-4.5" />
            <span>Dashboard Insights</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "logs"
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <Database className="h-4.5 w-4.5" />
            <span>Telemetry Logs</span>
            {logs.length > 0 && (
              <span className="ml-auto bg-neutral-100 text-neutral-500 font-mono text-[10px] px-2 py-0.5 rounded-full border border-neutral-200 font-bold">
                {logs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("keys")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "keys"
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <Key className="h-4.5 w-4.5" />
            <span>Security Keys</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <Settings className="h-4.5 w-4.5" />
            <span>Global Settings</span>
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "notes"
                ? "bg-blue-50 text-blue-700 font-bold"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span>Personal Notes</span>
            {notes.length > 0 && (
              <span className="ml-auto bg-blue-50 text-blue-600 font-mono text-[10px] px-2 py-0.5 rounded-full border border-blue-100 font-bold animate-pulse">
                {notes.length}
              </span>
            )}
          </button>
        </nav>

        {/* Sidebar Footer Power down */}
        <div className="p-4 border-t border-neutral-150">
          <button
            onClick={() => signOut()}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50/60 transition-colors cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            <span>Disconnect Portal</span>
          </button>
        </div>
      </aside>

      {/* ACTIVE DASHBOARD BODY CONTAINER (Light, Premium Theme) */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Panel bar representing active connectivity */}
        <header className="h-16 bg-white border-b border-neutral-200/80 px-6 sm:px-8 flex items-center justify-between select-none shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="font-display text-lg font-bold text-neutral-900">
              {activeTab === "insights" && "System Insights"}
              {activeTab === "logs" && "Activity Telemetry Logs"}
              {activeTab === "keys" && "StratoSync API Access Tokens"}
              {activeTab === "settings" && "Console System Settings"}
              {activeTab === "notes" && "Personal Developer Notes"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-400 hover:text-neutral-800 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh console telemetry feeds"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <div className="h-4 w-[1px] bg-neutral-200"></div>

            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[11px] font-bold text-neutral-500 font-mono uppercase tracking-wider">
                Console Live state
              </span>
            </div>
          </div>
        </header>

        {/* Central Dashboard Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4"
              >
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <p className="font-mono text-xs font-semibold text-neutral-400 uppercase tracking-widest">
                  Compiling system console insights...
                </p>
              </motion.div>
            ) : errorNotice ? (
              <motion.div
                key="error-box"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-red-150 bg-red-50/40 p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left"
              >
                <div className="p-3 bg-red-100 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-red-950 font-sans">Telemetry Handshake Error</h3>
                  <p className="text-sm text-red-600 mt-1 max-w-lg leading-relaxed">{errorNotice}</p>
                  <button
                    onClick={loadDashboardData}
                    className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
                  >
                    Retry Handshake
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="dashboard-loaded-body"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* 1. Personalized Welcome Banner */}
                <div className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 relative overflow-hidden shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-100/30 rounded-full blur-3xl z-0 pointer-events-none" />
                  
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">
                      Developer Workspace
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-neutral-900 leading-tight">
                      Welcome, {user?.displayName || "Developer Participant"}!
                    </h2>
                    <p className="text-neutral-500 font-sans text-sm mt-1 max-w-md font-light leading-relaxed">
                      This space monitors your federated profile variables, edge telemetry parameters, and active configuration tokens in real-time.
                    </p>
                  </div>

                  <div className="flex gap-4 shrink-0 relative z-10 font-mono text-left">
                    <div className="border border-neutral-150 bg-neutral-50 rounded-2xl p-4 min-w-[120px]">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">Build Version</span>
                      <span className="text-sm font-bold text-neutral-800">v4.0.12-PROD</span>
                    </div>
                    <div className="border border-neutral-150 bg-neutral-50 rounded-2xl p-4 min-w-[120px]">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase tracking-wide">Environment</span>
                      <span className="text-xs font-bold text-green-600 block mt-0.5">// CLOUD RUN</span>
                    </div>
                  </div>
                </div>

                {/* TAB SWITCH CONTROLLER & GRID ACTIONS */}
                {activeTab === "insights" && insights && (
                  <div className="space-y-8 animate-fade-in">

                    {/* Live Target Edge Calls Limit selector */}
                    <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">Custom Monthly Telemetry Budget</h4>
                        <p className="text-xs text-neutral-500 mt-1">Set your target cap to dynamically recalculate allocated capacity graphs.</p>
                      </div>
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <input 
                          type="range" 
                          min="150" 
                          max="1000" 
                          step="10"
                          value={targetEdgeCallsLimit} 
                          onChange={(e) => setTargetEdgeCallsLimit(Number(e.target.value))}
                          className="w-full md:w-48 h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <div className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200 shrink-0">
                          {targetEdgeCallsLimit} calls
                        </div>
                      </div>
                    </div>
                    
                    {/* Insights Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      
                      <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between mb-3 text-neutral-400">
                          <CloudLightning className="h-5 w-5 text-blue-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Edge Calls</span>
                        </div>
                        <span className="text-3xl font-black text-neutral-900 font-display block">
                          {insights.apiCallsThisMonth}
                        </span>
                        <span className="text-[11px] font-sans text-neutral-500 mt-1 block">
                          Edge telemetry events captured
                        </span>
                      </div>

                       <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between mb-3 text-neutral-400">
                          <Key className="h-5 w-5 text-indigo-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Keys Allocated</span>
                        </div>
                        <span className="text-3xl font-black text-neutral-900 font-display block">
                          {apiKeys.filter(k => k.status === "Active").length} / {apiKeys.length}
                        </span>
                        <span className="text-[11px] font-sans text-neutral-500 mt-1 block">
                          Active cryptographic handles
                        </span>
                      </div>

                      <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between mb-3 text-neutral-400">
                          <Server className="h-5 w-5 text-green-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Active Nodes</span>
                        </div>
                        <span className="text-3xl font-black text-neutral-900 font-display block">
                          {insights.activeNodes}
                        </span>
                        <span className="text-[11px] font-sans text-neutral-500 mt-1 block">
                          Regional distribution points
                        </span>
                      </div>

                      <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between mb-3 text-neutral-400">
                          <TrendingUp className="h-5 w-5 text-orange-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Channel Capacity</span>
                        </div>
                        <span className="text-3xl font-black text-neutral-900 font-display block">
                          {Math.min(Math.round((insights.apiCallsThisMonth / targetEdgeCallsLimit) * 100), 100)}%
                        </span>
                        <span className="text-[11px] font-sans text-neutral-500 mt-1 block">
                          Of custom budget limit ({targetEdgeCallsLimit})
                        </span>
                      </div>

                    </div>

                    {/* Quick Simulated Database interaction area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      
                      {/* Left: Interactive Telemetry Event Dispatcher */}
                      <div className="lg:col-span-1 bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs">
                        <h3 className="font-display font-bold text-neutral-900 text-lg mb-2">Simulate Telemetry Log</h3>
                        <p className="text-xs text-neutral-500 leading-relaxed font-sans mb-4">
                          Trigger custom system telemetry. Once submitted, actions successfully update the integrated Firestore collections securely.
                        </p>

                        <form onSubmit={handleAddNewLog} className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Event Title</label>
                            <input 
                              type="text" 
                              required
                              value={newAction} 
                              onChange={(e) => setNewAction(e.target.value)}
                              placeholder="e.g., Cache Purge Completed"
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none text-xs transition-all"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Details</label>
                            <textarea 
                              value={newDetails} 
                              onChange={(e) => setNewDetails(e.target.value)}
                              placeholder="Describe the operational actions... (Optional)"
                              rows={2}
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none text-xs transition-all resize-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">System Origin Point</label>
                            <select 
                              value={newOrigin} 
                              onChange={(e) => setNewOrigin(e.target.value)}
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none text-xs transition-all cursor-pointer font-sans"
                            >
                              <option value="Local Client Connection">Local Client Connection</option>
                              <option value="Active UI Session Frame">Active UI Session Frame</option>
                              <option value="Edge Node Asia-Southeast">Edge Node Asia-Southeast</option>
                              <option value="US-East Cloud Instance">US-East Cloud Instance</option>
                              <option value="Europe-West Relay">Europe-West Relay</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Dispatch Log Event</span>
                          </button>
                        </form>
                      </div>

                      {/* Right List: Real-time Telemetry Overview */}
                      <div className="lg:col-span-2 bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-display font-bold text-neutral-900 text-lg">Active Session Streams</h3>
                            <button
                              onClick={() => setActiveTab("logs")}
                              className="text-xs text-blue-600 font-bold hover:underline"
                            >
                              View exhaustive historical feed
                            </button>
                          </div>

                          <div className="space-y-3.5">
                            {logs.slice(0, 3).map((log) => (
                              <div key={log.id} className="flex items-start justify-between p-3.5 bg-neutral-50 border border-neutral-150 rounded-xl">
                                <div className="space-y-1 pr-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[9px] px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 font-bold">
                                      {log.origin}
                                    </span>
                                    <span className="text-xs font-bold text-neutral-900">{log.action}</span>
                                  </div>
                                  <p className="text-xs text-neutral-500 font-sans leading-relaxed">{log.details}</p>
                                </div>
                                <span className="text-[10px] text-neutral-400 font-mono shrink-0 select-none">
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-neutral-100/50 p-4 rounded-xl border border-neutral-200 text-xs text-neutral-500 mt-4 leading-relaxed flex flex-col gap-1.5 font-sans">
                          <div className="flex items-center gap-1.5 font-bold text-neutral-700 select-none">
                            <Database className="h-4 w-4 text-blue-600" />
                            <span>Technical Cloud Infrastructure Integration</span>
                          </div>
                          <span>
                            This module is connected to live firestore instances. Operations you complete automatically trigger transactional ABAC writes protected by isolation rules on the database.
                          </span>
                        </div>
                      </div>

                    </div>

                  </div>
                )}

                {/* LOGS LIST TAB */}
                {activeTab === "logs" && (
                  <div className="space-y-6 bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                      <div>
                        <h3 className="font-display font-bold text-neutral-900 text-lg">
                          Detailed Telemetry Feeds ({
                            logs.filter(log => {
                              const q = logsSearchText.trim().toLowerCase();
                              const matchesSearch = !q || log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.origin.toLowerCase().includes(q);
                              const matchesOrigin = logsOriginFilter === "All" || log.origin === logsOriginFilter;
                              return matchesSearch && matchesOrigin;
                            }).length
                          })
                        </h3>
                        <p className="text-xs text-neutral-500">Exhaustive historical security, validation, and pipeline trigger telemetry logging.</p>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm("Reset current display logs list to defaults?")) {
                            loadDashboardData();
                          }
                        }}
                        className="px-3.5 py-1.5 border border-neutral-200 bg-white text-xs font-semibold rounded-lg hover:bg-neutral-50 text-neutral-600 cursor-pointer flex items-center space-x-1.5 shadow-xs animate-none"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Reset Default Logs</span>
                      </button>
                    </div>

                    {/* Interactive Filter Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-150">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-sans">Query Filter Text</label>
                        <input 
                          type="text"
                          value={logsSearchText}
                          onChange={(e) => setLogsSearchText(e.target.value)}
                          placeholder="Search action keyword, context..."
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block font-sans">Filter by System Node Origin</label>
                        <select
                          value={logsOriginFilter}
                          onChange={(e) => setLogsOriginFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none cursor-pointer"
                        >
                          <option value="All">All Origins</option>
                          <option value="Local Client Connection">Local Client Connection</option>
                          <option value="Active UI Session Frame">Active UI Session Frame</option>
                          <option value="Edge Node Asia-Southeast">Edge Node Asia-Southeast</option>
                          <option value="US-East Cloud Instance">US-East Cloud Instance</option>
                          <option value="Europe-West Relay">Europe-West Relay</option>
                          <option value="Security System Portal">Security System Portal</option>
                          <option value="Global System Settings">Global System Settings</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-neutral-150">
                      {logs.filter(log => {
                        const q = logsSearchText.trim().toLowerCase();
                        const matchesSearch = !q || log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.origin.toLowerCase().includes(q);
                        const matchesOrigin = logsOriginFilter === "All" || log.origin === logsOriginFilter;
                        return matchesSearch && matchesOrigin;
                      }).length > 0 ? (

                        logs.filter(log => {
                          const q = logsSearchText.trim().toLowerCase();
                          const matchesSearch = !q || log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.origin.toLowerCase().includes(q);
                          const matchesOrigin = logsOriginFilter === "All" || log.origin === logsOriginFilter;
                          return matchesSearch && matchesOrigin;
                        }).map((log) => (
                          <div key={log.id} className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1 pr-6">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[9px] px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded font-semibold text-neutral-600">
                                  ID: {log.id}
                                </span>
                                <span className="font-mono text-[9px] px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-blue-700 font-bold">
                                  {log.origin}
                                </span>
                                <span className="text-xs font-bold text-neutral-950">{log.action}</span>
                              </div>
                              <p className="text-xs text-neutral-600 leading-relaxed font-sans">{log.details}</p>
                              <span className="block text-[10px] text-neutral-400 font-mono">
                                Registered: {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>

                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-2 border border-neutral-200 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer sm:shrink-0"
                              title="Delete log record locally"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-neutral-400 flex flex-col items-center justify-center space-y-2 select-none">
                          <div className="p-3 bg-neutral-50 rounded-full border border-neutral-150">
                            <Database className="h-6 w-6 text-neutral-300" />
                          </div>
                          <p className="font-bold text-neutral-800 text-sm">No activity telemetry found</p>
                          <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">
                            Use the System Insights tab to dispatch a custom operational event!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SECRET KEYS TAB */}
                {activeTab === "keys" && (
                  <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-neutral-900 text-lg">StratoSync API Access Handles</h3>
                      <p className="text-xs text-neutral-500">Provide direct communication to regional edge nodes from remote command lines securely.</p>
                    </div>

                    <div className="border border-indigo-100 bg-indigo-50/35 p-4 rounded-xl flex items-start space-x-3 text-xs text-indigo-700 leading-relaxed">
                      <Key className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Developer Access Credential Information</span>
                        <p className="mt-0.5">
                          Keys should remain securely guarded. Avoid committing raw API credentials directly into Git repositories. Store production variables as secrets natively within your Cloud project console space.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-neutral-800 block">Console Command Access key</span>
                          <code className="text-[11px] bg-neutral-50 border border-neutral-150 rounded px-2.5 py-1 text-neutral-600 font-mono inline-block">
                            stratosync_live_dev_{user?.uid.slice(0, 10)}...••••••••
                          </code>
                        </div>
                        <span className="bg-green-50 text-green-700 rounded-full font-bold text-[10px] px-2.5 py-0.5 border border-green-100 uppercase tracking-widest block select-none">
                          Active State
                        </span>
                      </div>

                      <div className="border border-neutral-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-neutral-800 block">Edge Webhook Client Access Handle</span>
                          <code className="text-[11px] bg-neutral-50 border border-neutral-150 rounded px-2.5 py-1 text-neutral-600 font-mono inline-block">
                            stratosync_webhook_sign_{user?.uid.slice(0, 8)}...••••••••
                          </code>
                        </div>
                        <span className="bg-green-50 text-green-700 rounded-full font-bold text-[10px] px-2.5 py-0.5 border border-green-100 uppercase tracking-widest block select-none">
                          Active State
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* GLOBAL SETTINGS TAB */}
                {activeTab === "settings" && (
                  <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-xs space-y-6">
                    <div>
                      <h3 className="font-display font-bold text-neutral-900 text-lg">Console Space Configuration Parameters</h3>
                      <p className="text-xs text-neutral-500 text-neutral-400">Configure global parameters and verify security compliance checks.</p>
                    </div>

                    <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-150 font-sans">
                      
                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-neutral-800 block">Strict Secure Handshakes</span>
                          <p className="text-xs text-neutral-400 mt-0.5">Enforce mandatory JWT token handshakes for all browser-to-server operations.</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <div className="w-11 h-6 bg-blue-600 rounded-full transition-colors">
                            <div className="absolute top-[2px] right-[2px] bg-white w-5 h-5 rounded-full transition-all"></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-neutral-800 block">Telemetry Aggregation Pipeline</span>
                          <p className="text-xs text-neutral-400 mt-0.5">Allow automatic collection of cloud performance telemetry logs regionally.</p>
                        </div>
                        <div className="relative inline-flex items-center cursor-pointer">
                          <div className="w-11 h-6 bg-blue-600 rounded-full transition-colors">
                            <div className="absolute top-[2px] right-[2px] bg-white w-5 h-5 rounded-full transition-all5"></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-bold text-red-600 block">Erase Current Console Telemetry</span>
                          <p className="text-xs text-neutral-400 mt-0.5">Irreversibly wipe simulated logs and reset system insights to start state.</p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to completely erase current active display logs?")) {
                              setLogs([]);
                              if (insights) setInsights({ ...insights, apiCallsThisMonth: 0 });
                            }
                          }}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-100 transition-colors cursor-pointer"
                        >
                          Wipe Telemetry
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* PERSONAL NOTES TAB */}
                {activeTab === "notes" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
                    {/* Left List Pane (span 4/12) */}
                    <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-display font-extrabold text-neutral-900 text-sm">Notes Index</h3>
                        <button
                          onClick={handleCreateNote}
                          disabled={noteSaving}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>New Note</span>
                        </button>
                      </div>

                      {/* Search Index Input */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search personal notes..."
                          value={notesSearch}
                          onChange={(e) => setNotesSearch(e.target.value)}
                          className="w-full text-xs font-semibold px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-neutral-55/40 hover:bg-neutral-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all font-sans"
                        />
                      </div>

                      {/* Scrollable list of items */}
                      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                        {notes.filter(n =>
                          (n.title || "").toLowerCase().includes(notesSearch.toLowerCase()) ||
                          (n.content || "").toLowerCase().includes(notesSearch.toLowerCase())
                        ).length === 0 ? (
                          <div className="text-center py-12 px-4 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
                            <span className="text-neutral-400 font-mono text-[10px] uppercase font-bold tracking-wider">No matching notes found</span>
                          </div>
                        ) : (
                          notes.filter(n =>
                            (n.title || "").toLowerCase().includes(notesSearch.toLowerCase()) ||
                            (n.content || "").toLowerCase().includes(notesSearch.toLowerCase())
                          ).map((note) => {
                            const isCurrent = selectedNote?.id === note.id;
                            const snippet = note.content.length > 55 ? note.content.substring(0, 55) + "..." : note.content || "Empty description.";
                            return (
                              <div
                                key={note.id}
                                onClick={() => {
                                  setSelectedNote(note);
                                  setNoteTitle(note.title);
                                  setNoteContent(note.content);
                                }}
                                className={`group p-3.5 rounded-xl border transition-all cursor-pointer relative text-left ${
                                  isCurrent
                                    ? "bg-blue-50/60 border-blue-200 text-blue-950 font-medium shadow-2xs"
                                    : "bg-white border-neutral-200 hover:border-neutral-300 text-neutral-800 hover:bg-neutral-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-sans text-xs font-bold truncate group-hover:text-blue-600 transition-colors">
                                      {note.title || "Untitled Note"}
                                    </h4>
                                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                                      {snippet}
                                    </p>
                                    <span className="text-[9px] font-mono text-neutral-400 font-bold block mt-2.5">
                                      {new Date(note.updatedAt).toLocaleDateString()} at {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteNote(note.id);
                                    }}
                                    disabled={noteDeleting === note.id}
                                    className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-neutral-100/60 transition-colors cursor-pointer shrink-0"
                                    title="Delete Note"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Right Editor Screen (span 8/12) */}
                    <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm min-h-[480px] flex flex-col justify-between">
                      {selectedNote ? (
                        <div className="h-full flex flex-col justify-between space-y-5">
                          {/* Rich Head Row */}
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-150 pb-4">
                              <div className="min-w-0 flex-1 text-left">
                                <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold tracking-wider">Note Editor Active</span>
                                <input
                                  type="text"
                                  value={noteTitle}
                                  onChange={(e) => setNoteTitle(e.target.value)}
                                  placeholder="Untitled Note"
                                  className="w-full text-base font-extrabold text-neutral-900 border-none bg-transparent focus:outline-hidden focus:ring-0 p-0 mt-1 placeholder-neutral-300"
                                />
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    setNoteTitle(selectedNote.title);
                                    setNoteContent(selectedNote.content);
                                  }}
                                  disabled={noteSaving}
                                  className="px-3 py-1.5 border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  Revert Edits
                                </button>
                                <button
                                  onClick={handleSaveNote}
                                  disabled={noteSaving}
                                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                                >
                                  {noteSaving ? (
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Save className="h-3.5 w-3.5" />
                                  )}
                                  <span>Save Note</span>
                                </button>
                              </div>
                            </div>

                            {/* Dynamic text area editor */}
                            <div className="mt-4">
                              <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Type your core developer adjustments, API payloads, credentials logs, or configuration specifications..."
                                className="w-full h-80 text-xs font-semibold font-mono p-4 border border-neutral-200 rounded-xl bg-neutral-50/20 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none leading-relaxed text-neutral-800 placeholder-neutral-400"
                              />
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-150 flex items-center justify-between text-[10px] text-neutral-400 font-mono font-bold">
                            <span>Secured Identity Path: /personal_notes/{selectedNote.id}</span>
                            <span>Char Count: {noteContent.length} / 50,000</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 my-auto">
                          <div className="p-4 bg-blue-50 rounded-2xl">
                            <BookOpen className="h-8 w-8 text-blue-600 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="font-display font-extrabold text-neutral-900 text-base">No Personal Note Active</h4>
                            <p className="text-xs text-neutral-400 mt-1 max-w-sm leading-relaxed">
                              Choose an entry from the notes index sidebar or draft a brand-new developer notebook item to start recording security logs and workspace adjustments.
                            </p>
                            <button
                              onClick={handleCreateNote}
                              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                              Draft a Note
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info displaying database setup comments */}
        <footer className="h-12 bg-white border-t border-neutral-200/60 px-6 sm:px-8 flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider select-none shrink-0">
          <div className="flex gap-4">
            <span>Integration Adaptor Ready: Firebase & Supabase Configurable</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Telemetry Frequency: Balanced</span>
          </div>
          <span>Aegis Portal console</span>
        </footer>
      </main>
    </div>
  );
}
