/**
 * pi-chassis was pi-halo. The old environment variables still work when the new ones are unset,
 * and a user's halo.json settings carry over to chassis.json the first time the default path is used.
 */

import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";

const saved = { ...process.env };
afterEach(() => {
	for (const key of ["PI_CHASSIS_STATE", "PI_HALO_STATE", "PI_CODING_AGENT_DIR", "PI_CHASSIS_ICONS", "PI_HALO_ICONS"]) {
		if (saved[key] === undefined) delete process.env[key];
		else process.env[key] = saved[key];
	}
});

let fresh = 0;
/** A new copy of api.ts, so its one-time migration runs again. */
const freshApi = () => import(`../extensions/chassis/api.ts?copy=${++fresh}`);

test("PI_HALO_STATE is used when PI_CHASSIS_STATE is unset, and PI_CHASSIS_STATE wins over it", async () => {
	const api = await freshApi();
	delete process.env.PI_CHASSIS_STATE;
	process.env.PI_HALO_STATE = "/tmp/old.json";
	assert.equal(api.statePath(), "/tmp/old.json");
	process.env.PI_CHASSIS_STATE = "/tmp/new.json";
	assert.equal(api.statePath(), "/tmp/new.json");
});

test("halo.json is copied to chassis.json when only the old file exists", async () => {
	const dir = mkdtempSync(join(tmpdir(), "chassis-migrate-"));
	writeFileSync(join(dir, "halo.json"), `${JSON.stringify({ icons: "nerd", disabledWidgets: ["aws"] })}\n`);
	delete process.env.PI_CHASSIS_STATE;
	delete process.env.PI_HALO_STATE;
	process.env.PI_CODING_AGENT_DIR = dir;
	const api = await freshApi();
	const path = api.statePath();
	assert.equal(path, join(dir, "chassis.json"));
	assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), { icons: "nerd", disabledWidgets: ["aws"] });
	assert.ok(existsSync(join(dir, "halo.json")), "the old file is left in place");
});

test("an existing chassis.json is never overwritten by halo.json", async () => {
	const dir = mkdtempSync(join(tmpdir(), "chassis-migrate-"));
	writeFileSync(join(dir, "halo.json"), `${JSON.stringify({ icons: "nerd" })}\n`);
	writeFileSync(join(dir, "chassis.json"), `${JSON.stringify({ icons: "plain" })}\n`);
	delete process.env.PI_CHASSIS_STATE;
	delete process.env.PI_HALO_STATE;
	process.env.PI_CODING_AGENT_DIR = dir;
	const api = await freshApi();
	assert.deepEqual(JSON.parse(readFileSync(api.statePath(), "utf8")), { icons: "plain" });
});

test("PI_HALO_ICONS picks the icon set when PI_CHASSIS_ICONS is unset", async () => {
	const dir = mkdtempSync(join(tmpdir(), "chassis-icons-env-"));
	process.env.PI_CHASSIS_STATE = join(dir, "state.json");
	delete process.env.PI_CHASSIS_ICONS;
	process.env.PI_HALO_ICONS = "nerd";
	const I = await import("../extensions/chassis/icons.ts");
	assert.equal(I.iconSet(), "nerd");
	assert.equal(I.iconSource(), "env");
	process.env.PI_CHASSIS_ICONS = "plain";
	assert.equal(I.iconSet(), "plain");
});
