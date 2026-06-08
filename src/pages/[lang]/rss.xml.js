import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { LANGUAGES, SITE, SITE_TITLE } from '../../config';
import { groupsForLang, postPath, publishedPostGroups } from '../../i18n';

export function getStaticPaths() {
	return LANGUAGES.map((lang) => ({
		params: { lang },
		props: { lang },
	}));
}

export async function GET(context) {
	const { lang } = context.props;
	const groups = groupsForLang(publishedPostGroups(await getCollection('posts')), lang);
	return rss({
		title: SITE_TITLE,
		description: SITE[lang].description,
		site: context.site,
		items: groups.map((group) => {
			const post = group.entries[lang];
			return {
				...post.data,
				link: postPath(lang, group.slug),
			};
		}),
	});
}
