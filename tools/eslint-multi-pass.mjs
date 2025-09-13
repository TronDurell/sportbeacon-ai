import { execSync } from "node:child_process";

const passes = [
  'npx eslint --fix --max-warnings=0 "frontend/src/**/*.{ts,tsx,js,jsx}"',
  'npx eslint --fix --max-warnings=0 "functions/src/**/*.ts"'
];

console.log("🧹 Running ESLint multi-pass cleanup...");

for (const cmd of passes) {
  try {
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
    console.log("✅ Pass completed successfully");
  } catch (error) {
    console.log("⚠️ Pass completed with warnings/errors (continuing...)");
  }
}

console.log("🎉 ESLint multi-pass cleanup completed");