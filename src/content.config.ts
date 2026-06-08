import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
	loader: glob({ base: './src/content/posts', pattern: '*/*.md' }),
	schema: () =>
		z.object({
			title: z.string(),
			description: z.string(),
			pubDate: z.coerce.date(),
			draft: z.boolean().optional().default(false),
			updatedDate: z.coerce.date().optional(),
		}),
});

const about = defineCollection({
	loader: glob({ base: './src/content/about', pattern: '*.md' }),
	schema: () =>
		z.object({
			title: z.string(),
			description: z.string(),
		}),
});

export const collections = { posts, about };
