import type { CollectionEntry } from 'astro:content';
import { DEFAULT_LANG, LANGUAGES, SITE, type Lang } from './config';

export type PostEntry = CollectionEntry<'posts'>;
export type AboutEntry = CollectionEntry<'about'>;
export type Alternates = Partial<Record<Lang, string>>;

export interface PostGroup {
	slug: string;
	date: Date;
	entries: Partial<Record<Lang, PostEntry>>;
}

export function isLang(value: string): value is Lang {
	return LANGUAGES.includes(value as Lang);
}

export function assertLang(value: string): Lang {
	if (!isLang(value)) {
		throw new Error(`Unsupported language: ${value}`);
	}
	return value;
}

export function postPath(lang: Lang, slug: string): string {
	return `/${lang}/posts/${slug}/`;
}

export function postsPath(lang: Lang): string {
	return `/${lang}/posts/`;
}

export function aboutPath(lang: Lang): string {
	return `/${lang}/about/`;
}

export function homePath(lang: Lang): string {
	return `/${lang}/`;
}

export function rssPath(lang: Lang): string {
	return `/${lang}/rss.xml`;
}

export function languageLabel(lang: Lang): string {
	return lang === 'en' ? 'English' : '中文';
}

export function postIdParts(id: string): { slug: string; lang: Lang } {
	const parts = id.split('/');
	if (parts.length !== 2) {
		throw new Error(`Post content id must be <slug>/<lang>, got ${id}`);
	}
	const [slug, rawLang] = parts;
	const lang = assertLang(rawLang);
	if (!slug) {
		throw new Error(`Post content id is missing slug: ${id}`);
	}
	return { slug, lang };
}

export function aboutIdLang(id: string): Lang {
	return assertLang(id);
}

export function buildPostGroups(entries: PostEntry[]): PostGroup[] {
	const groups = new Map<string, PostGroup>();

	for (const entry of entries) {
		const { slug, lang } = postIdParts(entry.id);
		const existing = groups.get(slug);
		if (existing?.entries[lang]) {
			throw new Error(`Duplicate ${lang} entry for post ${slug}`);
		}

		const date = entry.data.pubDate;
		if (!existing) {
			groups.set(slug, { slug, date, entries: { [lang]: entry } });
			continue;
		}

		if (existing.date.toISOString() !== date.toISOString()) {
			throw new Error(`Post ${slug} translations must share pubDate`);
		}
		existing.entries[lang] = entry;
	}

	return [...groups.values()].sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export function publishedPostGroups(entries: PostEntry[]): PostGroup[] {
	return buildPostGroups(entries)
		.map((group) => {
			const publishedEntries: Partial<Record<Lang, PostEntry>> = {};
			for (const lang of LANGUAGES) {
				const entry = group.entries[lang];
				if (entry && !entry.data.draft) {
					publishedEntries[lang] = entry;
				}
			}
			return { ...group, entries: publishedEntries };
		})
		.filter((group) => LANGUAGES.some((lang) => group.entries[lang]));
}

export function groupsForLang(groups: PostGroup[], lang: Lang): PostGroup[] {
	return groups.filter((group) => group.entries[lang]);
}

export function groupAlternates(group: PostGroup): Alternates {
	return Object.fromEntries(
		LANGUAGES.flatMap((lang) => {
			const entry = group.entries[lang];
			return entry ? [[lang, postPath(lang, group.slug)]] : [];
		}),
	) as Alternates;
}

export function sitePageAlternates(page: 'home' | 'posts' | 'about'): Record<Lang, string> {
	return {
		en: page === 'home' ? homePath('en') : page === 'posts' ? postsPath('en') : aboutPath('en'),
		zh: page === 'home' ? homePath('zh') : page === 'posts' ? postsPath('zh') : aboutPath('zh'),
	};
}

export function groupByYear(groups: PostGroup[]): Array<{ year: number; groups: PostGroup[] }> {
	const byYear = new Map<number, PostGroup[]>();
	for (const group of groups) {
		const year = group.date.getFullYear();
		byYear.set(year, [...(byYear.get(year) ?? []), group]);
	}
	return [...byYear.entries()]
		.sort(([a], [b]) => b - a)
		.map(([year, groups]) => ({ year, groups }));
}

export function validateAbout(entries: AboutEntry[]): Record<Lang, AboutEntry> {
	const about = Object.fromEntries(entries.map((entry) => [aboutIdLang(entry.id), entry])) as Partial<
		Record<Lang, AboutEntry>
	>;
	for (const lang of LANGUAGES) {
		if (!about[lang]) {
			throw new Error(`Missing about/${lang}.md`);
		}
	}
	return about as Record<Lang, AboutEntry>;
}

export function formatDate(date: Date, lang: Lang): string {
	return date.toLocaleDateString(SITE[lang].dateLocale, SITE[lang].dateOptions);
}

export function defaultAlternate(alternates: Alternates): string | undefined {
	return alternates[DEFAULT_LANG];
}
