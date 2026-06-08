import { describe, expect, it } from 'vitest';
import type { PostEntry } from '../../src/i18n';
import {
	buildPostGroups,
	defaultAlternate,
	groupAlternates,
	groupByYear,
	groupsForLang,
	languageLabel,
	postIdParts,
	publishedPostGroups,
	sitePageAlternates,
	validateAbout,
} from '../../src/i18n';

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
		expect(postIdParts('hello-world/en')).toEqual({ slug: 'hello-world', lang: 'en' });
		expect(postIdParts('hello-world/zh')).toEqual({ slug: 'hello-world', lang: 'zh' });
		expect(() => postIdParts('hello-world/fr')).toThrow('Unsupported language: fr');
		expect(() => postIdParts('/en')).toThrow('Post content id is missing slug: /en');
		expect(() => postIdParts('hello-world')).toThrow(
			'Post content id must be <slug>/<lang>, got hello-world',
		);
	});

	it('builds date-sorted translation groups and alternates', () => {
		const groups = buildPostGroups([
			postEntry('older/en', '2025-01-01T00:00:00.000Z'),
			postEntry('newer/en', '2026-01-01T00:00:00.000Z'),
			postEntry('older/zh', '2025-01-01T00:00:00.000Z'),
		]);

		expect(groups.map((group) => group.slug)).toEqual(['newer', 'older']);
		expect(groupAlternates(groups[1])).toEqual({
			en: '/en/posts/older/',
			zh: '/zh/posts/older/',
		});
	});

	it('rejects duplicate translations and mismatched translation dates', () => {
		expect(() =>
			buildPostGroups([
				postEntry('duplicate/en', '2026-01-01T00:00:00.000Z'),
				postEntry('duplicate/en', '2026-01-01T00:00:00.000Z'),
			]),
		).toThrow('Duplicate en entry for post duplicate');

		expect(() =>
			buildPostGroups([
				postEntry('mismatch/en', '2026-01-01T00:00:00.000Z'),
				postEntry('mismatch/zh', '2026-01-02T00:00:00.000Z'),
			]),
		).toThrow('Post mismatch translations must share pubDate');
	});

	it('filters drafts per language without dropping published translations', () => {
		const groups = publishedPostGroups([
			postEntry('mixed/en', '2026-01-01T00:00:00.000Z', true),
			postEntry('mixed/zh', '2026-01-01T00:00:00.000Z'),
			postEntry('draft-only/en', '2026-02-01T00:00:00.000Z', true),
		]);

		expect(groups.map((group) => group.slug)).toEqual(['mixed']);
		expect(groups[0].entries.en).toBeUndefined();
		expect(groups[0].entries.zh?.id).toBe('mixed/zh');
	});

	it('groups posts by language and year', () => {
		const groups = buildPostGroups([
			postEntry('current/en', '2026-01-01T00:00:00.000Z'),
			postEntry('current/zh', '2026-01-01T00:00:00.000Z'),
			postEntry('previous/en', '2025-01-01T00:00:00.000Z'),
		]);

		expect(groupsForLang(groups, 'zh').map((group) => group.slug)).toEqual(['current']);
		expect(groupByYear(groups)).toEqual([
			{ year: 2026, groups: [groups[0]] },
			{ year: 2025, groups: [groups[1]] },
		]);
	});

	it('returns configured page alternates and language labels', () => {
		expect(sitePageAlternates('about')).toEqual({
			en: '/en/about/',
			zh: '/zh/about/',
		});
		expect(languageLabel('en')).toBe('English');
		expect(languageLabel('zh')).toBe('中文');
		expect(defaultAlternate({ en: '/en/', zh: '/zh/' })).toBe('/en/');
		expect(defaultAlternate({ zh: '/zh/' })).toBeUndefined();
	});

	it('requires one about page per supported language', () => {
		const about = validateAbout([{ id: 'en' }, { id: 'zh' }] as Parameters<
			typeof validateAbout
		>[0]);

		expect(about.en.id).toBe('en');
		expect(about.zh.id).toBe('zh');
		expect(() => validateAbout([{ id: 'en' }] as Parameters<typeof validateAbout>[0])).toThrow(
			'Missing about/zh.md',
		);
	});
});
