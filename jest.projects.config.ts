export default {
  projects: [
    {
      displayName: "smoke",
      testMatch: ["<rootDir>/__tests__/smoke/**/*.test.(ts|tsx)"],
      transform: { "^.+\\.(t|j)sx?$": ["babel-jest", { rootMode: "upward" }] },
      testEnvironment: "jsdom",
      setupFilesAfterEnv: ["<rootDir>/__tests__/setupTests.ts"]
    },
    {
      displayName: "e2e",
      testMatch: ["<rootDir>/__tests__/e2e/**/*.test.(ts|tsx)"],
      transform: { "^.+\\.(t|j)sx?$": ["babel-jest", { rootMode: "upward" }] },
      testEnvironment: "node",
      setupFilesAfterEnv: ["<rootDir>/__tests__/setupE2E.ts"],
      testTimeout: 300000
    },
    {
      displayName: "security",
      testMatch: ["<rootDir>/__tests__/security/**/*.test.(ts|tsx)"],
      transform: { "^.+\\.(t|j)sx?$": ["babel-jest", { rootMode: "upward" }] },
      testEnvironment: "node"
    }
  ]
};
