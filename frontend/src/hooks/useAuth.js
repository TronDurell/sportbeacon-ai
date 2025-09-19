import { useEffect, useState } from "react";
export function useAuth() {
    // TODO: If Firebase client auth is available, wire it here.
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        // Placeholder: keep null in prod by default; real impl should subscribe to Firebase Auth.
        // This prevents undefined access while remaining a no-op until wired.
        setUser(null);
    }, []);
    return {
        user,
        loading,
        signIn: async () => { },
        signOut: async () => { },
    };
}
