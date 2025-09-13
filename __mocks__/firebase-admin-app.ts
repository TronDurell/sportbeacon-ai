export interface FirebaseApp {
  name: string;
  options: any;
}

export interface MockFirebaseApp extends FirebaseApp {
  delete: jest.MockedFunction<() => Promise<void>>;
}

const createMockApp = (name: string = 'default'): MockFirebaseApp => ({
  name,
  options: {},
  delete: jest.fn().mockResolvedValue(undefined)
});

const mockApps: MockFirebaseApp[] = [];
const mockApp = createMockApp();
mockApps.push(mockApp);

export const initializeApp = jest.fn().mockImplementation((options?: any, name?: string) => {
  const app = createMockApp(name);
  mockApps.push(app);
  return app;
});

export const getApps = jest.fn().mockReturnValue(mockApps);

export const getApp = jest.fn().mockImplementation((name?: string) => {
  if (name) {
    return mockApps.find(app => app.name === name) || mockApp;
  }
  return mockApp;
});

export const app = mockApp;
