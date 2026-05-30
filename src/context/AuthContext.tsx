import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, AuthContextType } from "../types";
import { auth } from "../firebase";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "firebase/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseUser = (firebaseUser: any): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  photoURL: firebaseUser.photoURL,
  emailVerified: firebaseUser.emailVerified
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize and check for real Firebase auth session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Auth state change error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearStatus = () => {
    setError(null);
    setSuccess(null);
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const mapped = mapFirebaseUser(result.user);

      setUser(mapped);
      setSuccess("Successfully authenticated via Google Account.");
    } catch (err: any) {
      console.error("Google authentication failed:", err);
      setError(err?.message || "Failed to authenticate with Google.");
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!email || !password) {
        throw new Error("Email and password fields are required.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      const mapped = mapFirebaseUser(result.user);

      setUser(mapped);
      setSuccess("Successfully signed in.");
    } catch (err: any) {
      console.error("Email sign-in failed:", err);
      setError(err?.message || "Failed to sign in. Verify details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!email || !password || !displayName) {
        throw new Error("All registration fields must be provided.");
      }

      if (password.length < 6) {
        throw new Error("Choose a secure password at least 6 characters long.");
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      
      // Force reload auth user to sync structural fields
      await result.user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser) {
        setUser(mapFirebaseUser(updatedUser));
      }
      setSuccess("Account successfully established! Welcome to the portal.");
    } catch (err: any) {
      console.error("Email sign-up failed:", err);
      setError(err?.message || "An issue occurred establishing your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await firebaseSignOut(auth);
      setUser(null);
      setSuccess("Successfully logged out of portal.");
    } catch (err: any) {
      console.error("Sign out failed:", err);
      setError(err?.message || "There was an issue parsing your exit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        success,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        clearStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be wrapped inside AuthProvider context container.");
  }
  return context;
}
