/**
 * Run with:
 *   pnpm test
 *
 * A widget's detail line may hold links, but only as structured pieces: { text, url }. Text that
 * comes from outside (a ticket summary, an incident title) is still stripped of every escape
 * sequence, so it can never become a link. chassis builds the OSC 8 link itself, from an https URL
 * it has checked, and only when the terminal shows links.
 */

import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";

process.env.PI_CHASSIS_STATE = join(mkdtempSync(join(tmpdir(), "chassis-")), "state.json");

const { getCapabilities, resetCapabilitiesCache, setCapabilities, visibleWidth } = await import("@earendil-works/pi-tui");
const api = await import("../extensions/chassis/api.ts");
const { safeLinkUrl } = await import("../extensions/chassis/sanitize.ts");
const { renderSidebar } = await import("../extensions/chassis/sidebar.ts");
const { createState } = await import("../extensions/chassis/state.ts");

const theme = { fg: (_c: string, t: string) => t, bold: (t: string) => t, bg: (_c: string, t: string) => t, getColorMode: () => "truecolor" } as any;
const pi = { on: () => {} } as any;
const rc = { theme, ctx: undefined, width: 60 };

const OPEN = (url: string) => `\x1b]8;;${url}\x1b\\`;
const CLOSE = "\x1b]8;;\x1b\\";
const OSC52 = "\x1b]52;c;ZXZpbA==\x07";
const OSC0 = "\x1b]0;pwned\x07";
const EVIL_LINK = "\x1b]8;;https://evil.example/\x1b\\click\x1b]8;;\x1b\\";
const CURSOR = "\x1b[2J\x1b[H\x1b[10;10H";

/** A whole OSC 8 sequence, as chassis builds it: open or close, ended by ESC and a backslash. */
const WELL_FORMED_LINK = /\x1b\]8;;[^\x1b\x07]*\x1b\\/g;
/** Everything a terminal acts on except colour (SGR) and the well-formed links chassis builds itself. */
const hasOtherSequences = (s: string) => /[\u0000-\u0008\u000a-\u001a\u001c-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]|\x1b(?!\[[0-9;:]*m)/.test(s.replace(WELL_FORMED_LINK, ""));
/** Every OSC 8 sequence in `s`. */
const osc8 = (s: string) => [...s.matchAll(/\x1b\]8;;([^\x1b]*)\x1b\\/g)].map((m) => m[1]!);

function terminalShowsLinks(on: boolean): void {
	resetCapabilitiesCache();
	setCapabilities({ ...getCapabilities(), hyperlinks: on });
}

function fresh(): void {
	const reg = api.getRegistry();
	for (const e of reg.widgets.values()) if (e.timer) clearInterval(e.timer);
	reg.widgets.clear();
	reg.disabled.clear();
	reg.ctx = {} as any;
}

function detailOf(detail: () => any): string[] {
	fresh();
	const spec = { id: "links", render: () => ({ text: "x" }), detail };
	api.registerWidget(pi, spec as any);
	return api.detailWidget(spec as any, rc as any);
}

afterEach(() => resetCapabilitiesCache());

// ---- the URL check ---------------------------------------------------------------------------------

test("safeLinkUrl accepts a plain https URL and returns it normalised", () => {
	assert.equal(safeLinkUrl("https://example.com/browse/ABC-1234"), "https://example.com/browse/ABC-1234");
	assert.equal(safeLinkUrl("https://example.com/a?b=c#d"), "https://example.com/a?b=c#d");
	assert.equal(safeLinkUrl("HTTPS://Example.COM/x"), "https://example.com/x");
});

test("safeLinkUrl refuses anything but a plain https URL", () => {
	const refused: unknown[] = [
		"http://example.com/",
		"javascript:alert(1)",
		"file:///etc/passwd",
		"data:text/html,x",
		"ftp://example.com/",
		"//example.com/x",
		"/relative/path",
		"example.com",
		"https://",
		"https:///x",
		"https://user@example.com/",
		"https://user:pass@example.com/",
		"https://example.com/a b",
		"https://example.com/\nx",
		"https://example.com/\tx",
		"https://example.com/\x1bx",
		"https://example.com/\x07x",
		"https://example.com/\x9bx",
		"https://example.com/\u202ex",
		`https://example.com/${"a".repeat(2100)}`,
		"",
		undefined,
		null,
		42,
		{ href: "https://example.com/" },
		["https://example.com/"],
	];
	for (const url of refused) assert.equal(safeLinkUrl(url), undefined, JSON.stringify(url));
});

// ---- detail lines ----------------------------------------------------------------------------------

test("a link piece becomes one OSC 8 link built by chassis, with the label as visible text", () => {
	terminalShowsLinks(true);
	const [line] = detailOf(() => [[{ text: "ABC-1234", url: "https://example.com/browse/ABC-1234" }]]);
	assert.equal(line, `${OPEN("https://example.com/browse/ABC-1234")}ABC-1234${CLOSE}`);
	assert.equal(visibleWidth(line!), "ABC-1234".length);
});

test("pieces mix plain text and links on one line; a plain string line is unchanged", () => {
	terminalShowsLinks(true);
	const lines = detailOf(() => [
		["ABC-1234", "  ", { text: "Open", url: "https://example.com/o" }, "  Define the thing"],
		"plain line",
	]);
	assert.equal(lines.length, 2);
	assert.equal(lines[0], `ABC-1234  ${OPEN("https://example.com/o")}Open${CLOSE}  Define the thing`);
	assert.equal(lines[1], "plain line");
});

test("without terminal support for links the label is shown as plain text", () => {
	terminalShowsLinks(false);
	const [line] = detailOf(() => [["see ", { text: "ABC-1234", url: "https://example.com/browse/ABC-1234" }]]);
	assert.equal(line, "see ABC-1234");
});

test("a link with a URL that fails the check is plain text, not a link", () => {
	terminalShowsLinks(true);
	for (const url of ["javascript:alert(1)", "http://example.com/", "https://user:pw@example.com/", "https://example.com/a b", "", undefined, 7]) {
		const [line] = detailOf(() => [[{ text: "label", url: url as any }]]);
		assert.equal(line, "label", JSON.stringify(url));
	}
});

test("a link whose label is empty after cleaning is dropped, so there is no invisible link", () => {
	terminalShowsLinks(true);
	const [line] = detailOf(() => [["a", { text: `${OSC52}${CURSOR}`, url: "https://example.com/" }, { text: "   ", url: "https://example.com/" }, "b"]]);
	assert.equal(osc8(line!).length, 0, JSON.stringify(line));
	assert.ok(!hasOtherSequences(line!), JSON.stringify(line));
});

test("text from outside cannot become a link: escape sequences in labels and plain pieces are stripped", () => {
	terminalShowsLinks(true);
	const nasty = `${OSC52}${EVIL_LINK}${OSC0}${CURSOR}\u202eevil\nnext`;
	const [line] = detailOf(() => [[nasty, { text: nasty, url: "https://example.com/real" }, nasty]]);
	assert.deepEqual(osc8(line!), ["https://example.com/real", ""], JSON.stringify(line));
	assert.ok(!hasOtherSequences(line!), JSON.stringify(line));
	assert.ok(!line!.includes("evil.example"), JSON.stringify(line));
	assert.ok(line!.includes("click"), "the visible word of a stripped link stays");
});

test("a plain string line carrying a link is stripped as before", () => {
	terminalShowsLinks(true);
	const [line] = detailOf(() => [`see ${EVIL_LINK} now`]);
	assert.equal(line, "see click now");
});

test("a URL cannot smuggle in a second sequence", () => {
	terminalShowsLinks(true);
	const [line] = detailOf(() => [[{ text: "x", url: "https://example.com/\x1b\\\x1b]52;c;ZXZpbA==\x07" }]]);
	assert.equal(line, "x");
});

test("a piece that is not a string or a { text, url } object is skipped, and a bad line is cleaned", () => {
	terminalShowsLinks(true);
	const lines = detailOf(() => [["a", null, 5, undefined, {}, { url: "https://example.com/" }, ["nested"], "b"], { text: "not an array", url: "https://example.com/" }]);
	assert.equal(lines[0], "ab");
	assert.ok(!osc8(lines[1] ?? "").length, JSON.stringify(lines[1]));
});

test("a widget with a cacheKey gets the same linked line back until the key changes", () => {
	terminalShowsLinks(true);
	fresh();
	let calls = 0;
	const spec = {
		id: "cached",
		cacheKey: () => "k",
		render: () => ({ text: "x" }),
		detail: () => {
			calls++;
			return [[{ text: "ABC-1", url: "https://example.com/1" }]];
		},
	};
	api.registerWidget(pi, spec as any);
	const a = api.detailWidget(spec as any, rc as any);
	const b = api.detailWidget(spec as any, rc as any);
	assert.deepEqual(a, b);
	assert.equal(calls, 1);
	assert.equal(osc8(a[0]!).length, 2);
});

// ---- the sidebar -----------------------------------------------------------------------------------

function drawSidebar(detail: () => any, width: number): string[] {
	fresh();
	api.registerWidget(pi, { id: "jira", title: "Jira", sidebar: "section", render: () => ({ text: "2 open" }), detail } as any);
	const state = createState();
	state.ctx = { cwd: "/work/project" } as any;
	return renderSidebar(state, theme, width, 24, "1.2.0");
}

test("the sidebar draws a linked line at the width of its plain text, and keeps the link", () => {
	terminalShowsLinks(true);
	const linked = () => [[{ text: "ABC-1234", url: "https://example.com/browse/ABC-1234" }, "  Open"]];
	const plain = () => ["ABC-1234  Open"];
	const a = drawSidebar(linked, 48);
	const b = drawSidebar(plain, 48);
	assert.deepEqual(a.map(visibleWidth), b.map(visibleWidth));
	assert.ok(a.join("\n").includes(OPEN("https://example.com/browse/ABC-1234")));
	for (const l of a) assert.ok(!hasOtherSequences(l), JSON.stringify(l));
});

test("a linked line cut short by a narrow sidebar still closes its link", () => {
	terminalShowsLinks(true);
	const lines = drawSidebar(() => [[{ text: "ABC-1234-A-VERY-LONG-TICKET-KEY", url: "https://example.com/browse/ABC-1234" }, "  Open  with a long summary"]], 24);
	const row = lines.find((l) => l.includes(OPEN("https://example.com/browse/ABC-1234")));
	assert.ok(row, "the linked row is drawn");
	const seqs = osc8(row!);
	assert.equal(seqs.at(-1), "", "the link is closed before the row ends");
	assert.equal(seqs.filter((u) => u !== "").length, seqs.filter((u) => u === "").length, JSON.stringify(row));
});
