import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function readPost(lang, slug) {
	return readFileSync(new URL(`../dist/${lang}/posts/${slug}/index.html`, import.meta.url), 'utf8');
}

function contents(html, label, targets) {
	const toc = html.match(/<details\b[^>]*class="table-of-contents"[^>]*>[\s\S]*?<\/details>/)?.[0];
	assert.ok(toc, 'Long posts should have a collapsible table of contents');
	assert.doesNotMatch(toc, /^<details\b[^>]*\bopen(?:\s|=|>)/);
	assert.match(toc, new RegExp(`<summary[^>]*>\\s*${label}\\s*</summary>`));
	assert.match(toc, new RegExp(`<nav\\b[^>]*aria-label="${label}"`));
	assert.deepEqual(
		Array.from(toc.matchAll(/<a\b[^>]*href="#([^"]+)"/g), (match) => match[1]),
		targets,
	);
	for (const target of targets) {
		const headings = html.matchAll(new RegExp(`<h[23]\\b[^>]*id="${target}"`, 'g'));
		assert.equal(Array.from(headings).length, 1, `#${target} should identify one real heading`);
	}
	assert.ok(html.indexOf(toc) < html.search(/<h[23]\b/), 'Contents should precede the body');
	return toc;
}

for (const [lang, label, migrationTargets, japanTargets] of [
	[
		'en',
		'Contents',
		['why-i-moved-to-astro', 'ai-in-the-migration', 'the-final-blog-structure'],
		['osaka', 'january-7', 'january-8'],
	],
	[
		'zh',
		'目录',
		['为什么迁移到-astro', 'ai-的参与', '最终的博客结构'],
		['大阪', '1-月-7-日', '1-月-8-日'],
	],
]) {
	test(`${lang}: migration sections have a localized, initially collapsed table of contents`, () => {
		contents(readPost(lang, 'hugo-to-astro-blog-migration'), label, migrationTargets);
	});

	test(`${lang}: travel subsections are nested under their city`, () => {
		const toc = contents(readPost(lang, 'a-trip-to-japan'), label, japanTargets);
		assert.match(
			toc,
			new RegExp(`<li[^>]*>\\s*<a[^>]*href="#${japanTargets[0]}"[^>]*>[^<]*</a>\\s*<ul\\b`),
		);
	});

	test(`${lang}: short posts have no empty table of contents`, () => {
		assert.doesNotMatch(readPost(lang, 'apple-music-vs-spotify'), /class="table-of-contents"/);
	});
}
