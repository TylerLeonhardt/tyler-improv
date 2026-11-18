import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";
import { z } from "zod";

const agentFile = ".github/agents/show-manager.agent.md";

describe("show-manager custom agent", () => {
	it("exists with valid YAML identity and unrestricted tools", () => {
		const source = readFileSync(agentFile, "utf8");
		const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
		expect(match, "agent must start with YAML frontmatter").not.toBeNull();
		const document = parseDocument(match![1], { uniqueKeys: true });
		expect(document.errors).toEqual([]);
		const metadata = z.looseObject({
			name: z.literal("show-manager"),
			description: z.string().trim().min(1),
		}).parse(document.toJS());
		expect(metadata).not.toHaveProperty("tools");
	});

	it("keeps all linked repository sources resolvable, including the three skills", () => {
		const source = readFileSync(agentFile, "utf8");
		const targets = [...source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
		expect(targets).toEqual(expect.arrayContaining([
			"../skills/add-show/SKILL.md",
			"../skills/design-system/SKILL.md",
			"../skills/deploy/SKILL.md",
		]));
		for (const target of targets) {
			expect(target, "source links must be local repository paths").not.toMatch(/^[a-z]+:|^\/|#/i);
			expect(existsSync(resolve(dirname(agentFile), target)), `missing agent source: ${target}`).toBe(true);
		}
	});
});
