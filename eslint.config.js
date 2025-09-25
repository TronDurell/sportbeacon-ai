export default [
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
      "**/.cache/**",
      "**/reports/**",
      "**/artifacts/**",
      "**/deploy_snapshots/**",
      "**/testenv/**",
      "**/logs/**",
      "**/launch_logs/**"
    ]
  },
  {
    files: ["frontend/src/**/*.{ts,tsx,js,jsx}", "functions/src/**/*.ts", "packages/memory-sdk/src/**/*.ts", "packages/mcp-server/src/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // Basic rules without TypeScript-specific ones for now
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "warn"
    }
  }
];
