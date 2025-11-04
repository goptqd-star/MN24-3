import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode, useMemo } from 'react';
import { User } from '../types';
import { getDb, auth } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';

// --- State and Dispatch combined ---
interface AuthContextType {
  currentUser: User | null;
  authLoading: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const db = getDb();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            
            const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                if (docSnap.exists()) {
                    setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
                } else {
                    console.error("User profile not found in Firestore for UID:", firebaseUser.uid);
                    signOut(auth); 
                    setCurrentUser(null);
                }
                setAuthLoading(false);
            }, (error) => {
                console.error("Error fetching user profile:", error);
                signOut(auth);
                setCurrentUser(null);
                setAuthLoading(false);
            });

            return () => unsubscribeUser();
        } else {
            setCurrentUser(null);
            setAuthLoading(false);
        }
    });

    return () => unsubscribe();
  }, [db]);

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const changePassword = useCallback(async (newPass: string) => {
    if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPass);
    } else {
        throw new Error("No user is currently signed in.");
    }
  }, []);
  
  const value = useMemo(() => ({
    currentUser,
    authLoading,
    signInWithEmail,
    signOutUser,
    changePassword
  }), [currentUser, authLoading, signInWithEmail, signOutUser, changePassword]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
