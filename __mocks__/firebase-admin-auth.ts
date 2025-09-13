export type DecodedIdToken = { uid: string; email?: string } & Record<string, any>;

export const getAuth = jest.fn(() => ({
  verifyIdToken: jest.fn(async (_t: string) => ({ uid: 'test' } as DecodedIdToken)),
  createCustomToken: jest.fn(async (_: string) => 'token')
}));
