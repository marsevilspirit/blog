// @ts-check

import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.marsevilspirit.com',
	integrations: [sitemap()],
	markdown: {
		processor: unified({
			rehypePlugins: [
				() => (tree) => {
					function visit(node) {
						if (node.tagName === 'img') {
							Object.assign(node.properties, {
								// Match the 42rem content column at 18px, with a 2x option.
								width: 756,
								widths: [378, 756, 1512],
								sizes: 'auto, (min-width: 792px) 756px, calc(100vw - 2rem)',
							});
						}
						node.children?.forEach(visit);
					}
					visit(tree);
				},
			],
		}),
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
