const fs = require('fs');
const path = require('path');

// Read ESLint results
const resultsPath = path.join(__dirname, '../../artifacts/eslint-results.json');
if (!fs.existsSync(resultsPath)) {
  console.error('ESLint results file not found:', resultsPath);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// Calculate totals
const errors = results.reduce((acc, file) => acc + file.errorCount, 0);
const warnings = results.reduce((acc, file) => acc + file.warningCount, 0);

// Gate thresholds
const MAX_WARN = 200; // tighten over time
const MAX_ERRORS = 0;

console.log(`ESLint Results Summary:`);
console.log(`  Files checked: ${results.length}`);
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);
console.log(`  Max allowed warnings: ${MAX_WARN}`);

// Check gates
if (errors > MAX_ERRORS) {
  console.error(`❌ ESLint gate FAILED: ${errors} errors found (max allowed: ${MAX_ERRORS})`);
  process.exit(1);
}

if (warnings > MAX_WARN) {
  console.error(`❌ ESLint gate FAILED: ${warnings} warnings found (max allowed: ${MAX_WARN})`);
  process.exit(1);
}

console.log(`✅ ESLint gate PASSED: errors=${errors}, warnings=${warnings}`);
process.exit(0);
