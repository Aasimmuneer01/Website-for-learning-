import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User as UserType } from '../types';

export function getDeviceFingerprint(): string {
  const nav = window.navigator;
  const screen = window.screen;
  const raw = [
    nav.userAgent,
    nav.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
  ].join('###');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserType | null;
  loading: boolean;
  bannedMessage: string | null;
  verificationBlocked: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  clearBannedMessage: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  bannedMessage: null,
  verificationBlocked: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  forgotPassword: async () => {},
  resendVerification: async () => {},
  clearBannedMessage: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannedMessage, setBannedMessage] = useState<string | null>(null);
  const [verificationBlocked, setVerificationBlocked] = useState(false);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = undefined;
      }

      if (!authUser) {
        setUser(null);
        setUserData(null);
        setVerificationBlocked(false);
        setLoading(false);
        return;
      }

      setUser(authUser);
      const fp = getDeviceFingerprint();
      const userDocRef = doc(db, 'users', authUser.uid);

      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          // Check banned fingerprints
          const bannedFpSnap = await getDoc(doc(db, 'bannedFingerprints', fp));
          const initialStatus = bannedFpSnap.exists() ? 'suspicious' : 'active';

          const newUserData: UserType = {
            uid: authUser.uid,
            email: authUser.email || '',
            displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Student',
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            role: authUser.email === 'admin@example.com' || authUser.email === 'aasimmuneer349@gmail.com' || authUser.email === 'admin@eduplatform.com' ? 'admin' : 'user',
            isBanned: false,
            banReason: '',
            isPremium: false,
            emailVerified: authUser.emailVerified,
            verificationRequired: false,
            deviceFingerprint: fp,
            accountStatus: initialStatus,
          };

          await setDoc(userDocRef, newUserData);
        } else {
          // Update lastLogin & fingerprint
          await updateDoc(userDocRef, {
            lastLogin: serverTimestamp(),
            deviceFingerprint: fp,
            emailVerified: authUser.emailVerified,
          });
        }
      } catch (err) {
        console.error("Error setting up user doc:", err);
      }

      // Realtime snapshot listener on user doc
      unsubscribeDoc = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserType;
          setUserData(data);

          // Ban check
          if (data.isBanned) {
            setBannedMessage("You have been banned from using any material on this website by the administrator." + (data.banReason ? ` Reason: ${data.banReason}` : ""));
            await signOut(auth);
            setUser(null);
            setUserData(null);
            setLoading(false);
            return;
          }

          // Verification check
          if (data.verificationRequired && !authUser.emailVerified && !data.emailVerified) {
            setVerificationBlocked(true);
          } else {
            setVerificationBlocked(false);
          }
        }
        setLoading(false);
      }, (err) => {
        console.error("User snapshot err:", err);
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setBannedMessage(null);
  };

  const forgotPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const clearBannedMessage = () => setBannedMessage(null);

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      bannedMessage,
      verificationBlocked,
      login,
      signup,
      logout,
      forgotPassword,
      resendVerification,
      clearBannedMessage,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
