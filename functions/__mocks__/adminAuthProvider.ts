export const AdminAuthProvider = {
  verifyIdToken: async (_token: string) => ({ uid: "test-admin-uid" }),
};
