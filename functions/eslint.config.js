import js from "@eslint/js";
import ts from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  { ignores: ["lib", "dist", "coverage", "node_modules", "*.config.js"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { 
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        global: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "quotes": ["error", "double"],
      "indent": "off",
      "max-len": ["warn", {"code": 120}],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "valid-jsdoc": "off",
      "linebreak-style": "off",
      "import/no-unresolved": "off",
    },
  },
  prettier,
];