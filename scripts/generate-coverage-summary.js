const fs = require('fs');
const path = require('path');

// Read lcov.info file
const lcovPath = path.join(__dirname, '..', 'coverage', 'lcov.info');
const outputPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');

if (!fs.existsSync(lcovPath)) {
  console.error('lcov.info not found. Run tests with coverage first.');
  process.exit(1);
}

const lcovContent = fs.readFileSync(lcovPath, 'utf8');
const lines = lcovContent.split('\n');

let totalLines = 0;
let coveredLines = 0;
let totalFunctions = 0;
let coveredFunctions = 0;
let totalBranches = 0;
let coveredBranches = 0;

lines.forEach(line => {
  if (line.startsWith('SF:')) {
    // Source file
  } else if (line.startsWith('LF:')) {
    // Lines found
    totalLines += parseInt(line.split(':')[1]);
  } else if (line.startsWith('LH:')) {
    // Lines hit
    coveredLines += parseInt(line.split(':')[1]);
  } else if (line.startsWith('FNF:')) {
    // Functions found
    totalFunctions += parseInt(line.split(':')[1]);
  } else if (line.startsWith('FNH:')) {
    // Functions hit
    coveredFunctions += parseInt(line.split(':')[1]);
  } else if (line.startsWith('BRF:')) {
    // Branches found
    totalBranches += parseInt(line.split(':')[1]);
  } else if (line.startsWith('BRH:')) {
    // Branches hit
    coveredBranches += parseInt(line.split(':')[1]);
  }
});

const coverage = {
  total: {
    statements: {
      total: totalLines,
      covered: coveredLines,
      skipped: totalLines - coveredLines,
      pct: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0
    },
    branches: {
      total: totalBranches,
      covered: coveredBranches,
      skipped: totalBranches - coveredBranches,
      pct: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0
    },
    functions: {
      total: totalFunctions,
      covered: coveredFunctions,
      skipped: totalFunctions - coveredFunctions,
      pct: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0
    },
    lines: {
      total: totalLines,
      covered: coveredLines,
      skipped: totalLines - coveredLines,
      pct: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0
    }
  }
};

// Ensure coverage directory exists
const coverageDir = path.dirname(outputPath);
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(coverage, null, 2));
console.log(`Coverage summary generated: ${outputPath}`);
console.log(`Total coverage: ${coverage.total.statements.pct}%`); 