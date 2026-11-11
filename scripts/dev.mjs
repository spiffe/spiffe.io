import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { repo } from "./content.mjs";

const run = (cmd, args, cwd) =>
  new Promise((resolve) =>
    spawn(cmd, args, { cwd, stdio: "inherit" }).on("exit", (code) =>
      resolve(code === 0),
    ),
  );
const prepare = () =>
  run(process.execPath, ["scripts/prepare.mjs", "--drafts"]);
const pullExternal = () => run("python3", ["pull_external.py"], repo);

if (!(await prepare())) process.exit(1);

const astro = spawn("node_modules/.bin/astro", ["dev"], { stdio: "inherit" });
astro.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => astro.kill(signal));

// Rebuilds are serialised; changes made during one queue a single follow-up.
let running = false,
  queued = false,
  pull = false,
  timer;
async function rebuild() {
  if (running) return void (queued = true);
  running = true;
  do {
    queued = false;
    const pulling = pull;
    pull = false;
    if (!pulling || (await pullExternal())) await prepare();
  } while (queued || pull);
  running = false;
}
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 200);
};

for (const dir of ["content", "data", "static"])
  fs.watch(path.join(repo, dir), { recursive: true }, schedule);
// Watch the directory, since editors often replace files rather than write them.
fs.watch(repo, (_, file) => {
  if (file !== "external.yaml") return;
  pull = true;
  schedule();
});
