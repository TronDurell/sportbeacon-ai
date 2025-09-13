import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

console.log("🔍 Running Lighthouse CI for web validation...");

try {
  // Check if localhost:5173 is available (Vite dev server)
  const response = await fetch('http://localhost:5173');
  if (!response.ok) {
    console.log("⚠️ Local dev server not available, skipping Lighthouse CI");
    console.log("💡 To run Lighthouse CI, start the dev server with: npm run dev");
    
    // Create a placeholder report
    const placeholderReport = {
      timestamp: new Date().toISOString(),
      status: "skipped",
      reason: "Dev server not available",
      instructions: "Start dev server with 'npm run dev' to enable Lighthouse CI"
    };
    
    writeFileSync('reports/web-lighthouse.json', JSON.stringify(placeholderReport, null, 2));
    console.log("📄 Created placeholder Lighthouse report: reports/web-lighthouse.json");
    return;
  }

  // Run Lighthouse
  console.log("🚀 Running Lighthouse audit...");
  const lighthouseCommand = `npx lighthouse http://localhost:5173 --output=json --output-path=reports/web-lighthouse.json --chrome-flags="--headless" --quiet`;
  
  execSync(lighthouseCommand, { stdio: "inherit" });
  
  console.log("✅ Lighthouse CI completed successfully");
  console.log("📄 Report saved to: reports/web-lighthouse.json");
  
} catch (error) {
  console.error("❌ Lighthouse CI failed:", error.message);
  
  // Create error report
  const errorReport = {
    timestamp: new Date().toISOString(),
    status: "error",
    error: error.message,
    instructions: "Check that Lighthouse is installed: npm install -g lighthouse"
  };
  
  writeFileSync('reports/web-lighthouse.json', JSON.stringify(errorReport, null, 2));
  console.log("📄 Created error Lighthouse report: reports/web-lighthouse.json");
}
