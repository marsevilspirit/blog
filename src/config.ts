import { readFileSync } from 'node:fs';
import { z } from 'astro/zod';
import { parse } from 'smol-toml';

const SUPPORTED_LANGUAGES = ['en', 'zh'] as const;
const language = z.enum(SUPPORTED_LANGUAGES);
const nonEmptyString = z.string().min(1);
const dateOption = z.enum(['numeric', '2-digit', 'long', 'short', 'narrow']);

const languageConfigSchema = z.object({
	description: nonEmptyString,
	htmlLang: nonEmptyString,
	dateLocale: nonEmptyString,
	dateOptions: z
		.object({ year: dateOption, month: dateOption, day: dateOption })
		.transform((options) => options as Intl.DateTimeFormatOptions),
	nav: z.object({ posts: nonEmptyString, about: nonEmptyString, language: nonEmptyString }),
	home: z.object({ recentPosts: nonEmptyString, allPosts: nonEmptyString }),
	posts: z.object({ title: nonEmptyString, description: nonEmptyString }),
	footer: z.object({ authorLinks: nonEmptyString }),
	authorHeadline: nonEmptyString,
	authorBio: nonEmptyString,
});

const siteConfigSchema = z
	.object({
		title: nonEmptyString,
		defaultLang: language,
		languages: z
			.array(language)
			.refine((languages) => SUPPORTED_LANGUAGES.every((lang) => languages.includes(lang)), {
				message: 'config/site.toml languages must include en and zh',
			}),
		timeZone: nonEmptyString.refine(
			(value) => {
				try {
					new Intl.DateTimeFormat('en', { timeZone: value });
					return true;
				} catch {
					return false;
				}
			},
			{ message: 'config TOML timeZone must be a valid IANA time zone' },
		),
		author: z.object({
			name: nonEmptyString,
			links: z.array(z.object({ label: nonEmptyString, href: nonEmptyString })),
		}),
	})
	.refine((config) => config.languages.includes(config.defaultLang), {
		message: 'config/site.toml defaultLang must be listed in languages',
	});

function readTomlFile(path: string) {
	return parse(readFileSync(path, 'utf8'));
}

function readSiteConfig() {
	const config = siteConfigSchema.parse(readTomlFile('config/site.toml'));
	const site = Object.fromEntries(
		config.languages.map((lang) => [
			lang,
			languageConfigSchema.parse(readTomlFile(`config/${lang}.toml`)),
		]),
	) as Record<Lang, z.infer<typeof languageConfigSchema>>;
	return { ...config, site };
}

const siteConfig = readSiteConfig();

export const SITE_TITLE = siteConfig.title;
export const DEFAULT_LANG = siteConfig.defaultLang;
export const LANGUAGES: readonly Lang[] = siteConfig.languages;
export const SITE_TIME_ZONE = siteConfig.timeZone;

export type Lang = z.infer<typeof language>;

export const SITE = siteConfig.site;
export const AUTHOR_NAME = siteConfig.author.name;
export const AUTHOR_LINKS = siteConfig.author.links;
