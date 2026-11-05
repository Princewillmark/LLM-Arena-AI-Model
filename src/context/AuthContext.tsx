import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  hasValidConfig,
  trackFirebaseAnalytics
} from '../lib/firebase';
import { UserProfile } from '../types/arena';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'llm_arena_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);

  useEffect(() => {
    // If Firebase Auth is initialized and configured
    if (auth && hasValidConfig) {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const profile: UserProfile = {
            id: firebaseUser.uid,
            firebaseUid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Arena Competitor',
            email: firebaseUser.email || `${firebaseUser.uid.slice(0, 8)}@arena.io`,
            photoUrl: firebaseUser.photoURL || undefined,
            accountStatus: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setUser(profile);
          setIsGuest(false);
          trackFirebaseAnalytics('login', { method: 'firebase_auth', uid: firebaseUser.uid });
        } else {
          // Check local guest session
          checkLocalSession();
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Offline / Developer / Demo session
      checkLocalSession();
      setLoading(false);
    }
  }, []);

  const checkLocalSession = () => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setIsGuest(parsed.firebaseUid.startsWith('guest_'));
      } else {
        // Automatically start with a convenient initial guest session
        const defaultGuest: UserProfile = {
          id: 'guest_' + Math.random().toString(36).substring(2, 9),
          firebaseUid: 'guest_' + Math.random().toString(36).substring(2, 9),
          displayName: 'Arena Pilot',
          email: 'pilot@arena.io',
          accountStatus: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setUser(defaultGuest);
        setIsGuest(true);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(defaultGuest));
      }
    } catch (e) {
      // Storage error fallback
    }
  };

  const loginWithGoogle = async () => {
    if (auth && googleProvider) {
      const res = await signInWithPopup(auth, googleProvider);
      const profile: UserProfile = {
        id: res.user.uid,
        firebaseUid: res.user.uid,
        displayName: res.user.displayName || 'Google Competitor',
        email: res.user.email || '',
        photoUrl: res.user.photoURL || undefined,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(profile);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      trackFirebaseAnalytics('login', { method: 'google', uid: res.user.uid });
    } else {
      // Simulation for development without cloud secrets
      const simulated: UserProfile = {
        id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
        firebaseUid: 'usr_g_' + Math.random().toString(36).substring(2, 9),
        displayName: 'Google Demo User',
        email: 'google.competitor@arena.io',
        photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(simulated);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(simulated));
      trackFirebaseAnalytics('login', { method: 'google_simulated' });
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (auth && hasValidConfig) {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        id: res.user.uid,
        firebaseUid: res.user.uid,
        displayName: res.user.displayName || email.split('@')[0],
        email: res.user.email || email,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(profile);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      trackFirebaseAnalytics('login', { method: 'email', email });
    } else {
      const simulated: UserProfile = {
        id: 'usr_em_' + Math.random().toString(36).substring(2, 9),
        firebaseUid: 'usr_em_' + Math.random().toString(36).substring(2, 9),
        displayName: email.split('@')[0],
        email: email,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(simulated);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(simulated));
      trackFirebaseAnalytics('login', { method: 'email_simulated' });
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    if (auth && hasValidConfig) {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        id: res.user.uid,
        firebaseUid: res.user.uid,
        displayName: name || email.split('@')[0],
        email: res.user.email || email,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(profile);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
      trackFirebaseAnalytics('sign_up', { method: 'email', email });
    } else {
      const simulated: UserProfile = {
        id: 'usr_reg_' + Math.random().toString(36).substring(2, 9),
        firebaseUid: 'usr_reg_' + Math.random().toString(36).substring(2, 9),
        displayName: name || email.split('@')[0],
        email: email,
        accountStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setUser(simulated);
      setIsGuest(false);
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(simulated));
      trackFirebaseAnalytics('sign_up', { method: 'email_simulated' });
    }
  };

  const resetPassword = async (email: string) => {
    if (auth && hasValidConfig) {
      await sendPasswordResetEmail(auth, email);
    }
    trackFirebaseAnalytics('password_reset_requested', { email });
  };

  const logout = async () => {
    if (auth && hasValidConfig) {
      try {
        await signOut(auth);
      } catch (e) {}
    }
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      firebaseUid: 'guest_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Arena Pilot',
      email: 'pilot@arena.io',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setUser(guestUser);
    setIsGuest(true);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
    trackFirebaseAnalytics('logout');
  };

  const continueAsGuest = () => {
    const guestUser: UserProfile = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      firebaseUid: 'guest_' + Math.random().toString(36).substring(2, 9),
      displayName: 'Arena Pilot',
      email: 'pilot@arena.io',
      accountStatus: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setUser(guestUser);
    setIsGuest(true);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(guestUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        continueAsGuest,
        isGuest
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
