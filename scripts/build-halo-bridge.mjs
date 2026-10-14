#!/usr/bin/env node
/**
 * Prepare compat/pi-halo, the package published under the old name: it bundles this exact build of
 * pi-chassis and loads its extensions, so `pi install npm:pi-halo` and `pi-halo/client` keep
 * working. The release workflow runs it after publishing pi-chassis, then publishes the bridge.
 *
 *   node scripts/build-halo-bridge.mjs
 *
 * It sets the bridge's version and its pi-chassis dependency to this package's version, copies the
 * peer dependencies, points `pi.extensions` at the bundled copy, packs this package and installs
 * the tarball into compat/pi-halo/node_modules (without peers, which pi supplies). It never
 * publishes. Run `pnpm build` first (the release workflow has, through `pnpm check`).
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(join(root, "dist"))) {
	console.error("build-halo-bridge: no dist/ yet. Run `pnpm build` first.");
	process.exit(1);
}
const bridgeDir = join(root, "compat", "pi-halo");
const main = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const bridgePath = join(bridgeDir, "package.json");
const bridge = JSON.parse(readFileSync(bridgePath, "utf8"));

bridge.version = main.version;
bridge.dependencies = { [main.name]: main.version };
bridge.peerDependencies = main.peerDependencies;
bridge.engines = main.engines;
bridge.pi = { extensions: main.pi.extensions.map((p) => `node_modules/${main.name}/${p.replace(/^\.\//, "")}`) };
writeFileSync(bridgePath, `${JSON.stringify(bridge, null, 2)}\n`);

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
const tarball = run("npm", ["pack", "--silent", "--ignore-scripts", "--pack-destination", bridgeDir], root).split("\n").pop();
rmSync(join(bridgeDir, "node_modules"), { recursive: true, force: true });
run("npm", ["install", `./${tarball}`, "--no-save", "--omit=peer", "--ignore-scripts", "--no-audit", "--no-fund"], bridgeDir);
rmSync(join(bridgeDir, tarball));
console.log(`compat/pi-halo ready: pi-halo ${bridge.version} bundling ${main.name} ${main.version}`);
