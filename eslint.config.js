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
      "**/.storybook/**",
      "**/*.stories.*",
      "**/reports/**",
      "**/artifacts/**",
      "**/node_modules/**",
      "**/build/**",
      "**/out/**",
      "**/.next/**",
      "**/functions/test/**",
      "**/functions/__tests__/**",
      "**/packages/*/test/**",
      "**/packages/*/__tests__/**",
      "**/legacy-src/**", // Legacy src directory
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
  // Core app - relaxed for stabilization
  {
    files: ["frontend/src/**/*.{ts,tsx,js,jsx}", "functions/src/**/*.{ts,tsx,js,jsx}", "packages/*/src/**/*.{ts,tsx,js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    },
    settings: { react: { version: "detect" } }
  },
  // Tests - relaxed rules
  {
    files: ["**/__tests__/**", "tests/**", "**/*.test.ts?(x)"],
    languageOptions: { 
      globals: { 
        jest: true,
        node: true 
      } 
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  },
  // Scripts/tools/configs - relaxed rules
  {
    files: ["scripts/**", "tools/**", "**/*.config.*", "**/*.rc.*"],
    languageOptions: { 
      globals: { 
        node: true 
      } 
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "no-console": "off"
    }
  }
];