import type { Config } from "jest";

const config: Config = {
  roots: ["<rootDir>/frontend", "<rootDir>/functions", "<rootDir>/__tests__", "<rootDir>/tests"],
  testMatch: ["**/?(*.)+(test|spec).[jt]s?(x)"],
  transform: {
    "^.+\\.(t|j)sx?$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-typescript",
          "@babel/preset-react"
        ]
      }
    ]
  },
  testEnvironment: (process.env.JEST_ENV ?? "jsdom") as "jsdom" | "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  moduleNameMapper: {
    "^@sportbeacon/memory-sdk$": "<rootDir>/packages/memory-sdk/dist/index.cjs",
    "^react$": require.resolve("react"),
    "\\.(css|less|scss)$": "<rootDir>/tests/styleMock.js"
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/lib/"]
};

export default config;