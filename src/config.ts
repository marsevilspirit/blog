import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';
import { parse } from 'smol-toml';

const SUPPORTED_LANGUAGES = ['en', 'zh'] as const;

type SupportedLang = (typeof SUPPORTED_LANGUAGES)[number];

interface SiteLanguageConfig {
	description: string;
	htmlLang: string;
	dateLocale: string;
	dateOptions: Intl.DateTimeFormatOptions;
	nav: { posts: string; about: string; language: string };
	home: { recentPosts: string; allPosts: string };
	posts: { title: string; description: string };
	footer: { authorLinks: string };
	authorHeadline: string;
	authorBio: string;
}

interface SiteConfig {
	title: string;
	defaultLang: SupportedLang;
	languages: readonly SupportedLang[];
	author: {
		name: string;
		avatar: string;
		links: Array<{ label: string; href: string }>;
	};
	site: Record<SupportedLang, SiteLanguageConfig>;
}

let cachedConfig: SiteConfig | undefined;

function readSiteConfig(): SiteConfig {
	cachedConfig ??= parseSiteConfig();
	return cachedConfig;
}

function parseSiteConfig(): SiteConfig {
	const config = readTomlFile('config/site.toml');
	const languages = stringArray(config.languages, 'languages').map(assertSupportedLang);
	const defaultLang = assertSupportedLang(stringField(config, 'defaultLang'));

	if (!languages.includes(defaultLang)) {
		throw new Error('config/site.toml defaultLang must be listed in languages');
	}

	for (const lang of SUPPORTED_LANGUAGES) {
		if (!languages.includes(lang)) {
			throw new Error(`config/site.toml languages must include ${lang}`);
		}
	}

	return {
		title: stringField(config, 'title'),
		defaultLang,
		languages,
		author: readAuthor(record(config.author, 'author')),
		site: Object.fromEntries(
			languages.map((lang) => [lang, readLanguageConfig(readTomlFile(`config/${lang}.toml`))]),
		) as Record<SupportedLang, SiteLanguageConfig>,
	};
}

function readTomlFile(path: string): Record<string, unknown> {
	return record(parse(readFileSync(join(cwd(), path), 'utf8')), path);
}

function readAuthor(author: Record<string, unknown>): SiteConfig['author'] {
	const links = arrayField(author, 'links').map((link, index) => {
		const item = record(link, `author.links[${index}]`);
		return {
			label: stringField(item, 'label'),
			href: stringField(item, 'href'),
		};
	});

	return {
		name: stringField(author, 'name'),
		avatar: stringField(author, 'avatar'),
		links,
	};
}

function readLanguageConfig(config: Record<string, unknown>): SiteLanguageConfig {
	return {
		description: stringField(config, 'description'),
		htmlLang: stringField(config, 'htmlLang'),
		dateLocale: stringField(config, 'dateLocale'),
		dateOptions: readDateOptions(record(config.dateOptions, 'dateOptions')),
		nav: readStringMap(record(config.nav, 'nav'), ['posts', 'about', 'language']),
		home: readStringMap(record(config.home, 'home'), ['recentPosts', 'allPosts']),
		posts: readStringMap(record(config.posts, 'posts'), ['title', 'description']),
		footer: readStringMap(record(config.footer, 'footer'), ['authorLinks']),
		authorHeadline: stringField(config, 'authorHeadline'),
		authorBio: stringField(config, 'authorBio'),
	};
}

function readDateOptions(config: Record<string, unknown>): Intl.DateTimeFormatOptions {
	return {
		year: dateOption(config, 'year'),
		month: dateOption(config, 'month'),
		day: dateOption(config, 'day'),
	};
}

function dateOption(config: Record<string, unknown>, key: string): 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' {
	const value = stringField(config, key);
	if (!['numeric', '2-digit', 'long', 'short', 'narrow'].includes(value)) {
		throw new Error(`config TOML ${key} date option is invalid: ${value}`);
	}
	return value as 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
}

function readStringMap<const Keys extends readonly string[]>(
	config: Record<string, unknown>,
	keys: Keys,
): Record<Keys[number], string> {
	return Object.fromEntries(keys.map((key) => [key, stringField(config, key)])) as Record<Keys[number], string>;
}

function assertSupportedLang(value: string): SupportedLang {
	if (!SUPPORTED_LANGUAGES.includes(value as SupportedLang)) {
		throw new Error(`config/site.toml language is unsupported: ${value}`);
	}
	return value as SupportedLang;
}

function record(value: unknown, name: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`config TOML ${name} must be a table`);
	}
	return value as Record<string, unknown>;
}

function stringField(config: Record<string, unknown>, key: string): string {
	const value = config[key];
	if (typeof value !== 'string' || value.length === 0) {
		throw new Error(`config TOML ${key} must be a non-empty string`);
	}
	return value;
}

function stringArray(value: unknown, key: string): string[] {
	if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
		throw new Error(`config TOML ${key} must be a string array`);
	}
	return value;
}

function arrayField(config: Record<string, unknown>, key: string): unknown[] {
	const value = config[key];
	if (!Array.isArray(value)) {
		throw new Error(`config TOML ${key} must be an array`);
	}
	return value;
}

const siteConfig = readSiteConfig();

export const SITE_TITLE = siteConfig.title;
export const DEFAULT_LANG = siteConfig.defaultLang;
export const LANGUAGES = siteConfig.languages;

export type Lang = SiteConfig['languages'][number];

export const SITE = siteConfig.site;
export const AUTHOR_NAME = siteConfig.author.name;
export const AUTHOR_AVATAR = siteConfig.author.avatar;
export const AUTHOR_LINKS = siteConfig.author.links;
