export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  globalTeardown: "<rootDir>/src/__tests__/teardown.ts",
  transform: { 
    "^.+\\.(ts|tsx)$": ["ts-jest", { 
      isolatedModules: true, 
      tsconfig: "<rootDir>/tsconfig.json" 
    }] 
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json", "mjs"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/lib/"],
  testTimeout: 60000,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/index.ts"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  transformIgnorePatterns: [
    "node_modules/(?!(chai|firebase-functions-test)/)"
  ],
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true
    }
  }
};
