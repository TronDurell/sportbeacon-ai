import fs from "node:fs";

const target = "reports/AGENT_VALIDATION.md";
const matrix = process.env.AGENT_MATRIX || "";

fs.mkdirSync("reports", { recursive: true });
fs.writeFileSync(target, `# Agent Validation Matrix\n\n${matrix}\n`, "utf8");
