import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const build = spawnSync(npm, ["--prefix", "client", "run", "build"], { stdio: "inherit", shell: process.platform === "win32" });
if (build.status !== 0) process.exit(build.status || 1);

const server = spawn(process.execPath, [join("server", "src", "server.js")], { stdio: "inherit" });
server.on("exit", (code) => process.exit(code || 0));
process.on("SIGINT", () => server.kill("SIGINT"));
process.on("SIGTERM", () => server.kill("SIGTERM"));
