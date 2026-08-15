import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase/app";
import type { AuthSession } from "../api/client";
import { AuthContext, type AuthView } from "./context";

function toView(user: User | null): AuthView {
  if (!user) {
    return { status: "signedOut" };
  }
  return { status: "signedIn", user: { uid: user.uid, email: user.email } };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AuthView>({ status: "loading" });

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setView(toView(user));
      },
      () => {
        setView({ status: "error", message: "Authentication is unavailable" });
      },
    );
    return unsubscribe;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(getFirebaseAuth());
  }, []);

  const session = useMemo<AuthSession>(
    () => ({
      get currentUser() {
        return getFirebaseAuth().currentUser;
      },
      signOut,
    }),
    [signOut],
  );

  const value = useMemo(
    () => ({ view, session, signUp, signIn, resetPassword, signOut }),
    [view, session, signUp, signIn, resetPassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
