import js from "@eslint/js";
import ts from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Global ignores - must be first
  {
    ignores: [
      "**/dist/**",
      "**/lib/**", 
      "**/coverage/**",
      "**/*.d.ts",
      "**/scripts/**",
      "**/tools/**",
      "**/*.stories.*",
      "**/.storybook/**",
      "**/node_modules/**",
      "**/build/**",
      "**/out/**",
      "**/.next/**",
      "**/functions/test/**",
      "**/functions/__tests__/**",
      "**/packages/*/test/**",
      "**/packages/*/__tests__/**",
      "**/src/**", // Legacy src directory
      "**/town-rec-integrity/**",
      "**/townRec/**",
      "**/testenv/**",
      "**/types/**",
      "**/validate-frontend.js",
      "**/postcss.config.js",
      "**/styleMock.js",
      "**/types/interfaces.js",
      "**/functions/tsconfig.test.json",
      "**/functions/test/setup.ts",
      "**/frontend/hooks/**", // Legacy hooks directory
      "**/frontend/mocks/**", // Mock files
      "**/frontend/pages/**", // Legacy pages
      "**/frontend/services/**", // Legacy services
      "**/frontend/test/**", // Test files
      "**/frontend/public/**", // Public assets
      "**/frontend/jest.setup.js", // Jest setup
      "**/frontend/vite.config.js", // Vite config
      "**/frontend/postcss.config.cjs", // PostCSS config
      "**/functions/__mocks__/**", // Mock files
      "**/functions/agents/**", // Agent files
      "**/functions/postcss.config.cjs", // PostCSS config
      "**/infra/**", // Infrastructure files
      "**/tests/**", // Test files
      "**/frontend/test/setup/**", // Test setup
      "**/frontend/pages/TrainerView*", // Duplicate files
      "**/frontend/hooks/useWebSocket(2).ts" // Duplicate files
    ]
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["frontend/src/**/*.{ts,tsx,js,jsx}", "functions/src/**/*.{ts,tsx,js,jsx}", "packages/*/src/**/*.{ts,tsx,js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "warn"
    },
    settings: { react: { version: "detect" } }
  },
  {
    files: ["**/*.test.*", "**/__tests__/**"],
    rules: { 
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
];
