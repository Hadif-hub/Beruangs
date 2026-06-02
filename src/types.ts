export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export interface BearComment {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string | null;
  text: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  success: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearStatus: () => void;
}
