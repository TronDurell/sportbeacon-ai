import { createContext, useContext } from "react";
import type { AuthSession } from "../api/client";

export type AuthView =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: { uid: string; email: string | null } }
  | { status: "error"; message: string };

export type AuthContextValue = {
  view: AuthView;
  session: AuthSession;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
