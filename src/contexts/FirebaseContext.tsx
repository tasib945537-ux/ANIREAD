import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  auth,
  db,
  ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
  signInWithGooglePopup,
  signOutFirebase,
  clampStr,
} from '../services/firebase';

interface FirebaseContextValue {
  user: User | null;
  authReady: boolean;
  profileReady: boolean;
  isAdminUser: boolean;
  authBusy: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logoutUser: () => Promise<void>;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextValue>({
  user: null,
  authReady: false,
  profileReady: false,
  isAdminUser: false,
  authBusy: false,
  authError: null,
  signInWithGoogle: async () => {},
  logoutUser: async () => {},
  clearAuthError: () => {},
});

async function ensureUserDocuments(currentUser: User): Promise<boolean> {
  if (!currentUser.emailVerified) return false;

  const uid = clampStr(currentUser.uid, 128);
  const displayName = clampStr(currentUser.displayName || 'ANIREAD User', 100) || 'ANIREAD User';
  const photoURL = clampStr(currentUser.photoURL || '', 500);
  const email = clampStr(currentUser.email || '', 254);

  const userDocPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid,
        displayName,
        photoURL,
        role: 'user',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName,
        photoURL,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userDocPath);
  }

  if (email) {
    const privatePath = `users/${uid}/private/info`;
    const privateRef = doc(db, 'users', uid, 'private', 'info');
    try {
      const privSnap = await getDoc(privateRef);
      if (!privSnap.exists()) {
        await setDoc(privateRef, {
          userId: uid,
          email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(privateRef, {
          email,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, privatePath);
    }
  }

  return true;
}

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setProfileReady(false);
        setIsAdminUser(false);
        return;
      }

      try {
        const synced = await ensureUserDocuments(nextUser);
        setProfileReady(synced);

        let admin = Boolean(
          nextUser.emailVerified && nextUser.email === ADMIN_EMAIL
        );

        if (!admin && nextUser.emailVerified) {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', nextUser.uid));
            if (adminDoc.exists()) {
              admin = true;
            }
          } catch {
            // Standard non-admin users may not have an admins doc
          }
        }
        setIsAdminUser(admin);
      } catch (err) {
        console.warn('[FirebaseContext] Failed to sync user profile:', err);
        setProfileReady(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setAuthError(message);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const logoutUser = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await signOutFirebase();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-out failed.';
      setAuthError(message);
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <FirebaseContext.Provider
      value={{
        user,
        authReady,
        profileReady,
        isAdminUser,
        authBusy,
        authError,
        signInWithGoogle,
        logoutUser,
        clearAuthError,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase(): FirebaseContextValue {
  return useContext(FirebaseContext);
}
