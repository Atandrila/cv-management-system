import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prismaCli = join(root, "node_modules", "prisma", "build", "index.js");
const database = join(root, "prisma", "dev.db");
const run = (...args) => {
  const result = spawnSync(process.execPath, [prismaCli, ...args], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
};

run("generate");
if (!existsSync(database)) {
  run("db", "execute", "--file", "prisma/init.sql", "--schema", "prisma/schema.prisma");
}
const seed = spawnSync(process.execPath, [join(root, "prisma", "seed.js")], { cwd: root, stdio: "inherit" });
process.exit(seed.status || 0);
