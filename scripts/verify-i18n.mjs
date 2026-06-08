import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const languages = ['en', 'zh'];
const languageLabels = { en: 'English', zh: '中文' };

function file(path) {
	return join(root, path);
}

function read(path) {
	return readFileSync(file(path), 'utf8');
}

function assertExists(path) {
	assert.ok(existsSync(file(path)), `${path} should exist`);
}

function assertMissing(path) {
	assert.ok(!existsSync(file(path)), `${path} should not exist`);
}

function regexEscape(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function frontmatter(markdown, path) {
	const match = markdown.match(/^---\n([\s\S]*?)\n---/);
	assert.ok(match, `${path} should have YAML frontmatter`);
	return Object.fromEntries(
		match[1]
			.split('\n')
			.map((line) => line.match(/^([A-Za-z0-9_]+):\s*(.*)$/))
			.filter(Boolean)
			.map((match) => [match[1], match[2].replace(/^"|"$/g, '')]),
	);
}

function markdownData(path, requiredFields) {
	const markdown = read(path);
	const data = frontmatter(markdown, path);
	for (const field of requiredFields) {
		assert.ok(data[field], `${path} should define ${field}`);
	}
	assert.equal(data.slug, undefined, `${path} should not define frontmatter slug`);
	assert.doesNotMatch(markdown, /!\[[^\]]*]\((?!\/|https?:\/\/)/, `${path} images should use public absolute paths or external URLs`);
	return data;
}

function optionPattern(href, label) {
	return new RegExp(`<option[^>]+value="${regexEscape(href)}"[^>]*>\\s*${regexEscape(label)}\\s*<\\/option>`);
}

function isDraft(data) {
	return data.draft === 'true';
}

assertMissing('src/content/blog');
assertMissing('src/pages/blog');
assertMissing('src/pages/about.astro');
assertMissing('src/pages/rss.xml.js');
assertMissing('src/assets/blog-placeholder-1.jpg');
assertMissing('src/site-config.ts');
assertMissing('site.config.toml');
assertExists('config/site.toml');
assertExists('config/en.toml');
assertExists('config/zh.toml');

const zhConfigToml = read('config/zh.toml');
assert.match(zhConfigToml, /authorBio = "用人类的逻辑写出优雅的代码，这是我活着的意义。"/);

const configSource = read('src/config.ts');
assert.match(configSource, /readSiteConfig/);
assert.doesNotMatch(configSource, /authorBio: '用人类的逻辑写出优雅的代码，这是我活着的意义。'/);

const aboutFiles = readdirSync(file('src/content/about')).filter((name) => name.endsWith('.md')).sort();
assert.deepEqual(aboutFiles, ['en.md', 'zh.md'], 'about should contain exactly en.md and zh.md');
for (const lang of languages) {
	markdownData(`src/content/about/${lang}.md`, ['title', 'description']);
}

const postSlugs = readdirSync(file('src/content/posts'), { withFileTypes: true })
	.filter((entry) => entry.isDirectory())
	.map((entry) => entry.name)
	.sort();
assert.ok(postSlugs.length > 0, 'src/content/posts should contain post groups');

const postsByLang = Object.fromEntries(languages.map((lang) => [lang, []]));

for (const slug of postSlugs) {
	const files = readdirSync(file(`src/content/posts/${slug}`))
		.filter((name) => name.endsWith('.md'))
		.sort();
	assert.ok(files.length > 0, `${slug} should contain at least one language file`);

	const entries = new Map();
	for (const name of files) {
		const lang = name.replace(/\.md$/, '');
		assert.ok(languages.includes(lang), `${slug}/${name} should use only en.md or zh.md`);
		assert.ok(!entries.has(lang), `${slug} should not duplicate ${lang}`);
		const path = `src/content/posts/${slug}/${name}`;
		const data = markdownData(path, ['title', 'description', 'pubDate']);
		entries.set(lang, data);
		postsByLang[lang].push({ slug, data });
	}

	const dates = new Set([...entries.values()].map((data) => data.pubDate));
	assert.equal(dates.size, 1, `${slug} translations should share pubDate`);

	for (const lang of languages) {
		const entry = entries.get(lang);
		const outputPath = `dist/${lang}/posts/${slug}/index.html`;
		if (!entry || isDraft(entry)) {
			assertMissing(outputPath);
			continue;
		}

		assertExists(outputPath);
		const html = read(outputPath);
		assert.match(html, new RegExp(`<html lang="${lang === 'en' ? 'en' : 'zh-CN'}"`));
		assert.match(html, new RegExp(`href="https://www\\.marsevilspirit\\.com/${lang}/posts/${regexEscape(slug)}/"`));
		assert.match(html, optionPattern(`/${lang}/posts/${slug}/`, languageLabels[lang]));

		for (const candidate of languages) {
			const candidateEntry = entries.get(candidate);
			const candidateOption = optionPattern(`/${candidate}/posts/${slug}/`, languageLabels[candidate]);
			if (candidateEntry && !isDraft(candidateEntry)) {
				assert.match(html, candidateOption);
			} else {
				assert.doesNotMatch(html, candidateOption);
			}
		}
	}
}

assertExists('public/robots.txt');
assertExists('dist/en/index.html');
assertExists('dist/zh/index.html');
assertExists('dist/en/posts/index.html');
assertExists('dist/zh/posts/index.html');
assertExists('dist/en/about/index.html');
assertExists('dist/zh/about/index.html');
assertExists('dist/en/rss.xml');
assertExists('dist/zh/rss.xml');
assertExists('dist/404.html');

assertMissing('dist/blog/index.html');
assertMissing('dist/about/index.html');
assertMissing('dist/rss.xml');

const rootHtml = read('dist/index.html');
assert.match(rootHtml, /url=\/en\//i);
assert.match(rootHtml, /location\.replace\('\/en\/'\)/);

const enHome = read('dist/en/index.html');
assert.match(enHome, /<html lang="en"/);
assert.match(enHome, /software engineer/);
assert.match(enHome, /Recent posts/);
assert.match(enHome, /The story began with a trip to Japan/);
assert.match(enHome, /no other music player can reach the high quality of sound/);
assert.match(enHome, /aria-label="Author links"/);
assert.match(enHome, /<select[^>]+aria-label="Language"/);
assert.doesNotMatch(enHome, /<span[^>]*>\s*Language\s*<\/span>/);
assert.match(enHome, optionPattern('/zh/', '中文'));
assert.doesNotMatch(enHome, /2025 年总结/);

const zhHome = read('dist/zh/index.html');
assert.match(zhHome, /<html lang="zh-CN"/);
assert.match(zhHome, /软件工程师/);
assert.match(zhHome, /最近文章/);
assert.match(zhHome, /aria-label="作者链接"/);
assert.match(zhHome, /<select[^>]+aria-label="语言"/);
assert.doesNotMatch(zhHome, /<span[^>]*>\s*语言\s*<\/span>/);
assert.match(zhHome, optionPattern('/en/', 'English'));
assert.doesNotMatch(zhHome, /2025 Summary/);

const enPosts = read('dist/en/posts/index.html');
assert.match(enPosts, /<h2[^>]*>2025<\/h2>/);
assert.doesNotMatch(enPosts, /Apple Music 对比 Spotify/);

const zhPosts = read('dist/zh/posts/index.html');
assert.match(zhPosts, /<h2[^>]*>2025<\/h2>/);
assert.doesNotMatch(zhPosts, /Apple Music VS Spotify/);

for (const lang of languages) {
	const rss = read(`dist/${lang}/rss.xml`);
	for (const { data } of postsByLang[lang]) {
		if (isDraft(data)) {
			assert.ok(!rss.includes(data.title), `${lang} RSS should not include draft ${data.title}`);
		} else {
			assert.ok(rss.includes(data.title), `${lang} RSS should include ${data.title}`);
		}
	}
}

const sitemap = read('dist/sitemap-0.xml');
assert.doesNotMatch(sitemap, /<xhtml:link/, 'sitemap should not include alternate extensions');

const robots = read('public/robots.txt');
assert.match(robots, /Sitemap: https:\/\/www\.marsevilspirit\.com\/sitemap-index\.xml/);

console.log('i18n verification passed');
