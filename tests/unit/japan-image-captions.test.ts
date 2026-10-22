import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import config from '../../astro.config.mjs';

const processor = config.markdown?.processor;
assert.ok(processor && typeof processor === 'object');
const renderer = await processor.createRenderer({ syntaxHighlight: 'prism' });

test('adjacent captioned images become separate figures without empty paragraphs', async () => {
	const { code } = await renderer.render(
		'![First](/first.jpg "First caption")\n![Second](/second.jpg "Second caption")',
	);
	assert.deepEqual(
		[...code.matchAll(/<figcaption>(.*?)<\/figcaption>/g)].map(([, caption]) => caption),
		['First caption', 'Second caption'],
	);
	assert.equal([...code.matchAll(/<figure>/g)].length, 2);
	assert.doesNotMatch(code, /<p>|\btitle=/);
	assert.ok(code.indexOf('src="/first.jpg"') < code.indexOf('src="/second.jpg"'));
});

test('captioned images split mixed paragraphs while preserving text and inline markup', async () => {
	const { code } = await renderer.render(
		'> Before **the photo**\n> ![View](/view.jpg "The view")\n> After [the photo](/after/)',
	);
	assert.match(code, /<blockquote>\s*<p>Before <strong>the photo<\/strong>\s*<\/p>/);
	assert.match(code, /<\/p>\s*<figure><img\b[^>]*><figcaption>The view<\/figcaption><\/figure>/);
	assert.match(code, /<\/figure>\s*<p>\s*After <a href="\/after\/">the photo<\/a><\/p>/);
	assert.doesNotMatch(code, /<p>(?:(?!<\/p>)[^])*<figure>/);
});

test('external image captions are plain text and preserve the image URL and alt', async () => {
	const { code } = await renderer.render(
		'![Remote view](https://example.com/photo.jpg "A <b>view</b> & caption")',
	);
	assert.match(code, /<figure><img\b[^>]*src="https:\/\/example.com\/photo.jpg"/);
	assert.match(code, /alt="Remote view"/);
	assert.match(code, /<figcaption>[^<]*view[^<]*caption<\/figcaption>/);
	assert.doesNotMatch(code, /<b>|\btitle=/);
});

test('images without nonempty titles keep normal paragraph rendering', async () => {
	const { code } = await renderer.render(
		'![Plain](/plain.jpg)\n![Remote](https://example.com/plain.jpg)\n![Empty](/empty.jpg "")\n![Space](/space.jpg "   ")',
	);
	assert.equal([...code.matchAll(/<img\b/g)].length, 4);
	assert.match(code, /^<p><img\b/);
	assert.match(code, /src="https:\/\/example.com\/plain.jpg"/);
	assert.doesNotMatch(code, /<figure|<figcaption/);
});

test('an uncaptioned image between captioned neighbors stays in order', async () => {
	const { code } = await renderer.render(
		'![First](/first.jpg "First")\n![Plain](/plain.jpg)\n![Last](/last.jpg "Last")',
	);
	assert.match(code, /<\/figure>\s*<p>\s*<img\b[^>]*src="\/plain.jpg"[^>]*>\s*<\/p>\s*<figure>/);
	assert.ok(code.indexOf('src="/first.jpg"') < code.indexOf('src="/plain.jpg"'));
	assert.ok(code.indexOf('src="/plain.jpg"') < code.indexOf('src="/last.jpg"'));
});

for (const lang of ['en', 'zh']) {
	test(`Japan travel photos have 13 visible ${lang} captions in source order`, async () => {
		const source = readFileSync(
			new URL(`../../src/content/posts/a-trip-to-japan/${lang}.md`, import.meta.url),
			'utf8',
		);
		const { code } = await renderer.render(source);
		assert.equal([...code.matchAll(/<figure>/g)].length, 13);
		assert.equal([...code.matchAll(/<figcaption>[^<]+<\/figcaption>/g)].length, 13);
		assert.deepEqual(
			[...code.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(([, src]) => src),
			[...source.matchAll(/!\[[^\]]*\]\(([^\s)]+)/g)].map(([, src]) => src),
		);
	});
}
