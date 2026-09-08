import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PostEntry } from '../../src/i18n.ts';
import {
	buildPostGroups,
	defaultAlternate,
	formatDate,
	groupAlternates,
	groupByYear,
	groupsForLang,
	languageLabel,
	postIdParts,
	publishedPostGroups,
	sitePageAlternates,
	validateAbout,
} from '../../src/i18n.ts';

function postEntry(id: string, pubDate: string, draft = false): PostEntry {
	return {
		id,
		data: {
			pubDate: new Date(pubDate),
			draft,
		},
	} as PostEntry;
}

describe('i18n routing helpers', () => {
	it('parses post content ids and rejects unsupported languages', () => {
		assert.deepEqual(postIdParts('hello-world/en'), { slug: 'hello-world', lang: 'en' });
		assert.deepEqual(postIdParts('hello-world/zh'), { slug: 'hello-world', lang: 'zh' });
		assert.throws(() => postIdParts('hello-world/fr'), /Unsupported language: fr/);
		assert.throws(() => postIdParts('/en'), /Post content id is missing slug: \/en/);
		assert.throws(
			() => postIdParts('hello-world'),
			/Post content id must be <slug>\/<lang>, got hello-world/,
		);
	});

	it('builds date-sorted translation groups and alternates', () => {
		const groups = buildPostGroups([
			postEntry('older/en', '2025-01-01T00:00:00.000Z'),
			postEntry('newer/en', '2026-01-01T00:00:00.000Z'),
			postEntry('older/zh', '2025-01-01T00:00:00.000Z'),
		]);

		assert.deepEqual(
			groups.map((group) => group.slug),
			['newer', 'older'],
		);
		assert.deepEqual(groupAlternates(groups[1]), {
			en: '/en/posts/older/',
			zh: '/zh/posts/older/',
		});
	});

	it('rejects duplicate translations and mismatched translation dates', () => {
		assert.throws(
			() =>
				buildPostGroups([
					postEntry('duplicate/en', '2026-01-01T00:00:00.000Z'),
					postEntry('duplicate/en', '2026-01-01T00:00:00.000Z'),
				]),
			/Duplicate en entry for post duplicate/,
		);

		assert.throws(
			() =>
				buildPostGroups([
					postEntry('mismatch/en', '2026-01-01T00:00:00.000Z'),
					postEntry('mismatch/zh', '2026-01-02T00:00:00.000Z'),
				]),
			/Post mismatch translations must share pubDate/,
		);
	});

	it('filters drafts per language without dropping published translations', () => {
		const groups = publishedPostGroups([
			postEntry('mixed/en', '2026-01-01T00:00:00.000Z', true),
			postEntry('mixed/zh', '2026-01-01T00:00:00.000Z'),
			postEntry('draft-only/en', '2026-02-01T00:00:00.000Z', true),
		]);

		assert.deepEqual(
			groups.map((group) => group.slug),
			['mixed'],
		);
		assert.equal(groups[0].entries.en, undefined);
		assert.equal(groups[0].entries.zh?.id, 'mixed/zh');
	});

	it('groups posts by language and year', () => {
		const groups = buildPostGroups([
			postEntry('current/en', '2026-01-01T00:00:00+08:00'),
			postEntry('current/zh', '2026-01-01T00:00:00+08:00'),
			postEntry('previous/en', '2025-01-01T00:00:00+08:00'),
		]);

		assert.deepEqual(
			groupsForLang(groups, 'zh').map((group) => group.slug),
			['current'],
		);
		assert.deepEqual(groupByYear(groups), [
			{ year: 2026, groups: [groups[0]] },
			{ year: 2025, groups: [groups[1]] },
		]);
	});

	it('formats dates in the configured site time zone', () => {
		const date = new Date('2026-07-16T00:00:00+08:00');
		assert.equal(formatDate(date, 'en'), '16 July 2026');
		assert.equal(formatDate(date, 'zh'), '2026年7月16日');
	});

	it('formats dates and groups years in the site time zone', () => {
		const groups = buildPostGroups([
			postEntry('new-year/en', '2025-12-31T16:00:00.000Z'),
			postEntry('year-end/en', '2025-12-31T15:59:59.000Z'),
		]);

		assert.equal(formatDate(new Date('2025-05-26T01:24:31+08:00'), 'en'), '26 May 2025');
		assert.equal(formatDate(new Date('2025-05-26T01:24:31+08:00'), 'zh'), '2025年5月26日');
		assert.equal(formatDate(groups[0].date, 'en'), '1 January 2026');
		assert.equal(formatDate(groups[1].date, 'zh'), '2025年12月31日');
		assert.deepEqual(groupByYear(groups), [
			{ year: 2026, groups: [groups[0]] },
			{ year: 2025, groups: [groups[1]] },
		]);
	});

	it('returns configured page alternates and language labels', () => {
		assert.deepEqual(sitePageAlternates('about'), {
			en: '/en/about/',
			zh: '/zh/about/',
		});
		assert.equal(languageLabel('en'), 'English');
		assert.equal(languageLabel('zh'), '中文');
		assert.equal(defaultAlternate({ en: '/en/', zh: '/zh/' }), '/en/');
		assert.equal(defaultAlternate({ zh: '/zh/' }), undefined);
	});

	it('requires one about page per supported language', () => {
		const about = validateAbout([{ id: 'en' }, { id: 'zh' }] as Parameters<
			typeof validateAbout
		>[0]);

		assert.equal(about.en.id, 'en');
		assert.equal(about.zh.id, 'zh');
		assert.throws(
			() => validateAbout([{ id: 'en' }] as Parameters<typeof validateAbout>[0]),
			/Missing about\/zh\.md/,
		);
	});
});
