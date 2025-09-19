import type { UseAuthResult } from "../../src/hooks/useAuth";

export const mockUseAuthValue: UseAuthResult = {
  user: { 
    uid: "test-uid", 
    email: "coach@example.com", 
    displayName: "Coach Test", 
    roles: ["coach"],
    teamId: "test-team-id",
    getIdToken: async () => "test-token"
  },
  loading: false,
  signIn: async () => {},
  signOut: async () => {},
};
