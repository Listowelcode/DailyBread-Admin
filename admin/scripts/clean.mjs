import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const adminRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const generatedPaths = [
  resolve(adminRoot, ".next"),
  resolve(adminRoot, "out"),
  resolve(adminRoot, "tsconfig.tsbuildinfo"),
];

for (const target of generatedPaths) {
  await rm(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
}

console.log("Admin generated files cleaned. Start with: npm run dev");
