import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
	cpSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));
const fixtureRoot = mkdtempSync(join(tmpdir(), 'blog-post-navigation-'));

before(() => {
	cpSync(join(root, 'src'), join(fixtureRoot, 'src'), {
		recursive: true,
		filter: (path) => path !== join(root, 'src/content/posts'),
	});
	for (const path of ['config', 'scripts', 'package.json', 'astro.config.mjs', 'tsconfig.json']) {
		cpSync(join(root, path), join(fixtureRoot, path), { recursive: true });
	}
	symlinkSync(join(root, 'node_modules'), join(fixtureRoot, 'node_modules'), 'dir');

	const posts = [
		['newest', 'en', '2026-01-06', 'Newest post'],
		['newest', 'zh', '2026-01-06', '最新文章'],
		['zh-only', 'zh', '2026-01-05', '仅中文文章'],
		['draft-only', 'en', '2026-01-04', 'Draft post', true],
		['draft-only', 'zh', '2026-01-04', '草稿文章', true],
		['mixed', 'en', '2026-01-03', 'English draft', true],
		['mixed', 'zh', '2026-01-03', '已发布的中文译文'],
		['middle', 'en', '2026-01-02', 'Middle post'],
		['middle', 'zh', '2026-01-02', '中间文章'],
		['中文文章', 'en', '2026-01-01', 'Post with a Unicode slug'],
		['oldest', 'en', '2025-12-31', 'Oldest post'],
		['oldest', 'zh', '2025-12-31', '最早文章'],
	] as const;
	for (const [slug, lang, date, title, draft = false] of posts) {
		const directory = join(fixtureRoot, 'src/content/posts', slug);
		mkdirSync(directory, { recursive: true });
		writeFileSync(
			join(directory, `${lang}.md`),
			`---\ntitle: ${title}\ndescription: Navigation fixture.\npubDate: ${date}T00:00:00+08:00\ndraft: ${draft}\n---\n\nNavigation fixture body.\n`,
		);
	}
	execFileSync(process.execPath, [join(root, 'node_modules/astro/bin/astro.mjs'), 'build'], {
		cwd: fixtureRoot,
		env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
	});
});

after(() => rmSync(fixtureRoot, { recursive: true, force: true }));

function navigationLinks(lang: 'en' | 'zh', slug: string) {
	const html = readFileSync(join(fixtureRoot, 'dist', lang, 'posts', slug, 'index.html'), 'utf8');
	const label = lang === 'zh' ? '文章导航' : 'Post navigation';
	const navigation = html.match(
		new RegExp(`<nav\\b[^>]*aria-label="${label}"[^>]*>([\\s\\S]*?)<\\/nav>`),
	);
	assert.ok(navigation, `${lang}/${slug} should have localized article navigation`);
	assert.ok(html.indexOf('Navigation fixture body.') < navigation.index!);
	return [...navigation[1].matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)].map(
		([, href, title]) => [href, title.trim()],
	);
}

describe('article navigation', () => {
	it('skips missing and draft English translations when choosing the next older post', () => {
		assert.deepEqual(navigationLinks('en', 'newest'), [
			['/en/posts/', 'Back to posts'],
			['/en/posts/middle/', 'Next: Middle post'],
		]);
	});

	it('keeps Chinese links and titles while retaining published translations of drafts', () => {
		assert.deepEqual(navigationLinks('zh', 'newest'), [
			['/zh/posts/', '返回文章列表'],
			['/zh/posts/zh-only/', '下一篇：仅中文文章'],
		]);
		assert.deepEqual(navigationLinks('zh', 'zh-only'), [
			['/zh/posts/', '返回文章列表'],
			['/zh/posts/mixed/', '下一篇：已发布的中文译文'],
		]);
	});

	it('finds the next post when the current slug is URL-encoded', () => {
		assert.deepEqual(navigationLinks('en', '中文文章'), [
			['/en/posts/', 'Back to posts'],
			['/en/posts/oldest/', 'Next: Oldest post'],
		]);
	});

	it('leaves only the list link at the oldest post in either language', () => {
		assert.deepEqual(navigationLinks('en', 'oldest'), [['/en/posts/', 'Back to posts']]);
		assert.deepEqual(navigationLinks('zh', 'oldest'), [['/zh/posts/', '返回文章列表']]);
	});
});
