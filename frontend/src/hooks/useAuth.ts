import { useEffect, useState } from "react";

export type AuthUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  roles?: string[];
  teamId?: string;
  getIdToken?: () => Promise<string>;
};

export type UseAuthResult = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (opts?: unknown) => Promise<void>;
  signOut: () => Promise<void>;
};

export function useAuth(): UseAuthResult {
  // TODO: If Firebase client auth is available, wire it here.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Placeholder: keep null in prod by default; real impl should subscribe to Firebase Auth.
    // This prevents undefined access while remaining a no-op until wired.
    setUser(null);
  }, []);

  return {
    user,
    loading,
    signIn: async () => {},
    signOut: async () => {},
  };
}
