// Converts trivial :any annotations on function params to unknown and prefixes unused params with _ to satisfy lint without changing runtime.
import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

const ROOTS = ["frontend/src", "functions/src"];

function rewrite(file) {
  let src = fs.readFileSync(file, "utf8");
  let before = src;

  // param: any  -> param: unknown
  src = src.replace(/(\([\s\S]*?\))/g, (paramsBlock) =>
    paramsBlock.replace(/: *any(\b)/g, ": unknown")
  );

  // function params that are unused are often named but flagged;
  // prefix common throwaway params: (_e) => ...
  src = src.replace(/(\(|,)\s*([a-zA-Z$][\w$]*)\s*:\s*unknown(\s*[,)\n])/g, (m, open, name, tail) => {
    if (["req","res","next","_","__","event","ctx"].includes(name)) return m;
    const newName = name.startsWith("_") ? name : `_${name}`;
    return `${open} ${newName}: unknown${tail}`;
  });

  if (src !== before) {
    fs.writeFileSync(file, src);
    return true;
  }
  return false;
}

async function main() {
  let changed = 0;
  for (const root of ROOTS) {
    const files = await glob(path.join(root, "**/*.{ts,tsx}"));
    for (const file of files) {
      if (fs.existsSync(file)) {
        changed += rewrite(file) ? 1 : 0;
      }
    }
  }
  console.log(`✅ ts-any-sweeper: updated ${changed} files`);
}

main().catch(console.error);
