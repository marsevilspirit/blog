import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { parse, stringify } from 'smol-toml';

test('reads TOML config and rejects invalid fields without changing repository config', () => {
	const directory = mkdtempSync(join(tmpdir(), 'blog-config-'));
	const files = ['site', 'en', 'zh'];
	const config = Object.fromEntries(
		files.map((name) => [
			name,
			parse(readFileSync(new URL(`../../config/${name}.toml`, import.meta.url), 'utf8')),
		]),
	);
	const cases: Array<[string, Parameters<typeof stringify>[0]]> = [
		['site', { title: 'Temporary TOML configuration' }],
		['site', { title: '' }],
		['site', { author: [] }],
		['site', { author: { name: 'author', links: 'invalid' } }],
		['site', { languages: ['en'] }],
		['site', { languages: ['en', 'zh', 'fr'] }],
		['site', { defaultLang: 'fr' }],
		['site', { timeZone: 'invalid/time-zone' }],
		['en', { description: '' }],
		['en', { nav: [] }],
		['en', { dateOptions: { year: 'numeric', month: 'invalid', day: 'numeric' } }],
	];
	try {
		mkdirSync(join(directory, 'config'));
		for (const [index, [file, fields]] of cases.entries()) {
			for (const name of files) {
				writeFileSync(
					join(directory, `config/${name}.toml`),
					stringify({ ...config[name], ...(name === file ? fields : {}) }),
				);
			}
			const result = spawnSync(
				process.execPath,
				[
					'--input-type=module',
					'-e',
					`const config = await import(${JSON.stringify(new URL('../../src/config.ts', import.meta.url).href)}); console.log(config.SITE_TITLE)`,
				],
				{ cwd: directory, encoding: 'utf8' },
			);
			assert.equal(result.status, index === 0 ? 0 : 1, result.stderr);
			if (index === 0) assert.equal(result.stdout.trim(), fields.title);
			else assert.match(result.stderr, /ZodError/);
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
