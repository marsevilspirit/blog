import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

async function source(path: string): Promise<string> {
	return readFile(new URL(`../../${path}`, import.meta.url), 'utf8');
}

const mainTargets = [
	{
		path: 'src/pages/[lang]/index.astro',
		importStatement: "import { mainContentTransition } from '../../transitions';",
	},
	{
		path: 'src/pages/[lang]/posts/index.astro',
		importStatement: "import { mainContentTransition } from '../../../transitions';",
	},
	{
		path: 'src/pages/[lang]/about.astro',
		importStatement: "import { mainContentTransition } from '../../transitions';",
	},
	{
		path: 'src/layouts/BlogPost.astro',
		importStatement: "import { mainContentTransition } from '../transitions';",
	},
	{
		path: 'src/pages/404.astro',
		importStatement: "import { mainContentTransition } from '../transitions';",
	},
];

describe('page transition wiring', () => {
	it('enables the Astro client router in the shared head without changing the root redirect', async () => {
		const baseHead = await source('src/components/BaseHead.astro');
		expect(baseHead).toContain("import { ClientRouter } from 'astro:transitions';");
		expect(baseHead).toContain('<ClientRouter />');

		const redirectPage = await source('src/pages/index.astro');
		expect(redirectPage).not.toContain('ClientRouter');
		expect(redirectPage).not.toContain('BaseHead');
	});

	it('marks each normal page main element with the shared content transition', async () => {
		for (const target of mainTargets) {
			const content = await source(target.path);
			expect(content).toContain(target.importStatement);
			expect(content).toMatch(
				/<main\s+transition:name="main"\s+transition:animate=\{mainContentTransition\}>/,
			);
		}
	});

	it('defines a calm shared main content transition and reduced-motion CSS', async () => {
		const helper = await source('src/transitions.ts');
		expect(helper).toContain('export const mainContentTransition');
		expect(helper).toContain("name: 'main-content-out'");
		expect(helper).toContain("name: 'main-content-in'");
		expect(helper).toContain("duration: '180ms'");
		expect(helper).toContain("duration: '220ms'");

		const css = await source('src/styles/global.css');
		expect(css).toContain('@keyframes main-content-in');
		expect(css).toContain('transform: translateY(10px)');
		expect(css).toContain('@keyframes main-content-out');
		expect(css).toContain('transform: translateY(-6px)');
		expect(css).toContain('@media (prefers-reduced-motion: reduce)');
		expect(css).toContain('animation: none !important');
	});

	it('uses Astro navigation for language switching and keeps RSS links out of client routing', async () => {
		const languageSelect = await source('src/components/LanguageSelect.astro');
		expect(languageSelect).toContain("import { navigate } from 'astro:transitions/client';");
		expect(languageSelect).toContain('navigate(href);');
		expect(languageSelect).not.toContain('window.location.href');

		for (const path of [
			'src/pages/[lang]/index.astro',
			'src/pages/[lang]/about.astro',
			'src/components/Footer.astro',
		]) {
			const content = await source(path);
			expect(content).toContain("data-astro-reload={link.label === 'RSS' ? true : undefined}");
		}
	});
});
