import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
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

function unquoteFrontmatterValue(value) {
	const quote = value[0];
	if ((quote === '"' || quote === "'") && value.endsWith(quote)) {
		return value.slice(1, -1);
	}
	return value;
}

function frontmatter(markdown, path) {
	const match = markdown.match(/^---\n([\s\S]*?)\n---/);
	assert.ok(match, `${path} should have YAML frontmatter`);
	return Object.fromEntries(
		match[1]
			.split('\n')
			.map((line) => line.match(/^([A-Za-z0-9_]+):\s*(.*)$/))
			.filter(Boolean)
			.map((match) => [match[1], unquoteFrontmatterValue(match[2])]),
	);
}

function markdownData(path, requiredFields) {
	const markdown = read(path);
	const data = frontmatter(markdown, path);

	for (const field of requiredFields) {
		assert.ok(data[field], `${path} should define ${field}`);
	}

	assert.equal(data.slug, undefined, `${path} should not define frontmatter slug`);
	for (const [, src] of markdown.matchAll(/!\[[^\]]*]\(([^\s)]+)/g)) {
		if (!/^https?:\/\//.test(src)) {
			assertExists(src.startsWith('/') ? `public${src}` : join(dirname(path), src));
		}
	}

	return data;
}

function optionPattern(href, label) {
	return new RegExp(
		`<option[^>]+value="${regexEscape(href)}"[^>]*>\\s*${regexEscape(label)}\\s*<\\/option>`,
	);
}

function isDraft(data) {
	return data.draft === 'true';
}

function postSlugs() {
	return readdirSync(file('src/content/posts'), { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
}

function postLanguageFiles(slug) {
	return readdirSync(file(`src/content/posts/${slug}`))
		.filter((name) => name.endsWith('.md'))
		.sort();
}

function postGroups() {
	return postSlugs().map((slug) => {
		const entries = new Map();

		for (const name of postLanguageFiles(slug)) {
			const lang = name.replace(/\.md$/, '');
			const path = `src/content/posts/${slug}/${name}`;
			entries.set(lang, markdownData(path, ['title', 'description', 'pubDate']));
		}

		return { slug, entries };
	});
}

function postsByLang(groups = postGroups()) {
	return Object.fromEntries(
		languages.map((lang) => [
			lang,
			groups
				.filter(({ entries }) => entries.has(lang))
				.map(({ slug, entries }) => ({ slug, data: entries.get(lang) })),
		]),
	);
}

function assertLanguageOptions(html, slug, entries) {
	for (const candidate of languages) {
		const candidateEntry = entries.get(candidate);
		const candidateOption = optionPattern(
			`/${candidate}/posts/${slug}/`,
			languageLabels[candidate],
		);

		if (candidateEntry && !isDraft(candidateEntry)) {
			assert.match(html, candidateOption);
		} else {
			assert.doesNotMatch(html, candidateOption);
		}
	}
}

function assertPostMetaDoesNotShowLanguage(html, lang, outputPath) {
	const postMeta = html.match(/<div class="post-meta">[\s\S]*?<\/div>/);
	assert.ok(postMeta, `${outputPath} should render post metadata`);
	assert.doesNotMatch(
		postMeta[0],
		new RegExp(`<span>\\s*${languageLabels[lang]}\\s*<\\/span>`),
		`${outputPath} should not show a redundant language label below the title`,
	);
}

test('legacy source paths are removed and TOML config files exist', () => {
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
});

test('site copy is read from TOML config instead of hardcoded source constants', () => {
	const zhConfigToml = read('config/zh.toml');
	assert.match(zhConfigToml, /authorBio = "我喜欢把复杂的问题拆清楚，再写成简单可维护的代码。"/);

	const configSource = read('src/config.ts');
	assert.match(configSource, /readSiteConfig/);
	assert.doesNotMatch(
		configSource,
		/authorBio: '我喜欢把复杂的问题拆清楚，再写成简单可维护的代码。'/,
	);
});

test('about content has exactly one Markdown file per supported language', () => {
	const aboutFiles = readdirSync(file('src/content/about'))
		.filter((name) => name.endsWith('.md'))
		.sort();

	assert.deepEqual(aboutFiles, ['en.md', 'zh.md'], 'about should contain exactly en.md and zh.md');
	for (const lang of languages) {
		markdownData(`src/content/about/${lang}.md`, ['title', 'description']);
	}
});

test('post content groups use supported language files and shared translation dates', () => {
	const groups = postGroups();
	assert.ok(groups.length > 0, 'src/content/posts should contain post groups');

	for (const { slug, entries } of groups) {
		const files = postLanguageFiles(slug);
		assert.ok(files.length > 0, `${slug} should contain at least one language file`);

		for (const name of files) {
			const lang = name.replace(/\.md$/, '');
			assert.ok(languages.includes(lang), `${slug}/${name} should use only en.md or zh.md`);
		}

		assert.equal(entries.size, files.length, `${slug} should not duplicate a language`);
		const dates = new Set([...entries.values()].map((data) => data.pubDate));
		assert.equal(dates.size, 1, `${slug} translations should share pubDate`);
	}
});

test('built post pages match published translations and language alternates', () => {
	for (const { slug, entries } of postGroups()) {
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
			assert.match(
				html,
				new RegExp(`href="https://www\\.marsevilspirit\\.com/${lang}/posts/${regexEscape(slug)}/"`),
			);
			assert.match(html, optionPattern(`/${lang}/posts/${slug}/`, languageLabels[lang]));
			assert.match(html, /<meta property="og:type" content="article">/);
			assert.match(
				html,
				new RegExp(
					`<meta property="article:published_time" content="${regexEscape(new Date(entry.pubDate).toISOString())}">`,
				),
			);
			if (entry.updatedDate) {
				assert.match(
					html,
					new RegExp(
						`<meta property="article:modified_time" content="${regexEscape(new Date(entry.updatedDate).toISOString())}">`,
					),
				);
			} else {
				assert.doesNotMatch(html, /<meta property="article:modified_time"/);
			}
			assertPostMetaDoesNotShowLanguage(html, lang, outputPath);
			assertLanguageOptions(html, slug, entries);
		}
	}
});

test('required built routes exist and removed root routes are absent', () => {
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

	assertMissing('public/site.webmanifest');
	assertMissing('public/android-chrome-192x192.png');
	assertMissing('public/android-chrome-512x512.png');
	assertMissing('dist/site.webmanifest');
	assertMissing('dist/android-chrome-192x192.png');
	assertMissing('dist/android-chrome-512x512.png');
	assertMissing('dist/blog/index.html');
	assertMissing('dist/about/index.html');
	assertMissing('dist/rss.xml');
});

test('root page redirects to the English home page', () => {
	const rootHtml = read('dist/index.html');
	assert.match(rootHtml, /url=\/en\//i);
	assert.match(rootHtml, /location\.replace\('\/en\/'\)/);
});

test('localized home pages render expected copy and do not leak post titles from another language', () => {
	const enHome = read('dist/en/index.html');
	assert.match(enHome, /<html lang="en"/);
	assert.match(enHome, /<meta property="og:type" content="website">/);
	assert.doesNotMatch(enHome, /<meta property="article:/);
	assert.match(enHome, /software engineer/);
	assert.match(enHome, /Recent posts/);
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
});

test('localized post indexes group posts by year and do not leak titles from another language', () => {
	const enPosts = read('dist/en/posts/index.html');
	assert.match(enPosts, /<h2[^>]*>2025<\/h2>/);
	assert.doesNotMatch(enPosts, /Apple Music 对比 Spotify/);

	const zhPosts = read('dist/zh/posts/index.html');
	assert.match(zhPosts, /<h2[^>]*>2025<\/h2>/);
	assert.doesNotMatch(zhPosts, /Apple Music VS Spotify/);
});

test('RSS feeds include published posts and exclude drafts for each language', () => {
	const groupedPosts = postsByLang();

	for (const lang of languages) {
		const rss = read(`dist/${lang}/rss.xml`);
		assert.match(
			rss,
			new RegExp(`<channel>[\\s\\S]*?<link>https://www\\.marsevilspirit\\.com/${lang}/</link>`),
		);
		for (const { slug, data } of groupedPosts[lang]) {
			if (isDraft(data)) {
				assert.ok(!rss.includes(data.title), `${lang} RSS should not include draft ${data.title}`);
			} else {
				assert.ok(rss.includes(data.title), `${lang} RSS should include ${data.title}`);
				assert.ok(
					rss.includes(`<link>https://www.marsevilspirit.com/${lang}/posts/${slug}/</link>`),
				);
				assert.ok(rss.includes(`<description>${data.description}</description>`));
			}
		}
	}
});

test('navigation marks only the current page or parent section', () => {
	const groupedPosts = postsByLang();
	for (const lang of languages) {
		const pages = [
			['', undefined, undefined],
			['posts/', 'posts', 'page'],
			['about/', 'about', 'page'],
			...groupedPosts[lang]
				.filter(({ data }) => !isDraft(data))
				.map(({ slug }) => [`posts/${slug}/`, 'posts', 'true']),
		];
		for (const [page, currentSection, currentValue] of pages) {
			const html = read(`dist/${lang}/${page}index.html`);
			for (const section of ['posts', 'about']) {
				const link = html.match(new RegExp(`<a\\b[^>]*href="/${lang}/${section}/"[^>]*>`))?.[0];
				assert.ok(link);
				if (section === currentSection) {
					assert.match(link, /class="active"/);
					assert.ok(link.includes(`aria-current="${currentValue}"`));
				} else {
					assert.doesNotMatch(link, /aria-current=|class="active"/);
				}
			}
		}
	}
});

test('lists and post metadata use complete, concise descriptions', () => {
	for (const lang of languages) {
		const home = read(`dist/${lang}/index.html`);
		const index = read(`dist/${lang}/posts/index.html`);
		const posts = postsByLang()[lang].filter(({ data }) => !isDraft(data));
		const recent = [...posts]
			.sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
			.slice(0, 5);
		for (const { slug, data } of posts) {
			assert.doesNotMatch(data.description, /\.\.\.|…/);
			assert.match(data.description, /[。.!?]$/);
			assert.ok(data.description.length <= (lang === 'zh' ? 60 : 160));
			assert.ok(index.includes(`<p>${data.description}</p>`));
			if (recent.some((post) => post.slug === slug)) {
				assert.ok(home.includes(`<p>${data.description}</p>`));
			}
			const html = read(`dist/${lang}/posts/${slug}/index.html`);
			assert.ok(html.includes(`<meta name="description" content="${data.description}">`));
		}
	}
});

test('travel photos are resized WebP images with lazy loading and reserved space', () => {
	for (const lang of languages) {
		const html = read(`dist/${lang}/posts/a-trip-to-japan/index.html`);
		const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) =>
			Object.fromEntries(
				[...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]),
			),
		);
		assert.equal(images.length, 13);
		let totalBytes = 0;
		for (const image of images) {
			assert.match(image.src, /^\/_astro\/.*\.webp$/);
			assert.equal(image.width, '756');
			assert.ok(Number(image.height) > 0);
			assert.equal(image.loading, 'lazy');
			assert.equal(image.decoding, 'async');
			assert.match(image.sizes, /^auto,/);
			assert.match(image.srcset, /\.webp 378w/);
			assert.match(image.srcset, /\.webp 756w/);
			for (const candidate of image.srcset.split(', ')) {
				assertExists(`dist${candidate.split(' ')[0]}`);
			}
			totalBytes += statSync(file(`dist${image.src}`)).size;
		}
		assert.ok(
			totalBytes < 2 * 1024 * 1024,
			'the 13 default-size photos should total less than 2 MiB',
		);
	}
	for (const original of readdirSync(file('src/content/posts/a-trip-to-japan/images'))) {
		assertMissing(`dist/posts/a-trip-to-japan/${original}`);
	}
});

test('sitemap and robots output use the expected static-site shape', () => {
	const sitemap = read('dist/sitemap-0.xml');
	assert.doesNotMatch(sitemap, /<xhtml:link/, 'sitemap should not include alternate extensions');

	const robots = read('public/robots.txt');
	assert.match(robots, /Sitemap: https:\/\/www\.marsevilspirit\.com\/sitemap-index\.xml/);
});
