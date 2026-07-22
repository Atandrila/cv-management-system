import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const childOptions = { stdio: "inherit", shell: process.platform === "win32" };
const children = [
  spawn(npm, ["--prefix", "server", "run", "dev"], childOptions),
  spawn(npm, ["--prefix", "client", "run", "dev"], childOptions),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill();
  process.exit(exitCode);
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(error);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!stopping && code && code !== 0) stop(code);
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
