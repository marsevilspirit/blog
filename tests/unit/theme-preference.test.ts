import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createContext, runInContext } from 'node:vm';

function inlineScript(file: string) {
	const script = readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8').match(
		/<script is:inline>([\s\S]*?)<\/script>/,
	);
	assert.ok(script, `${file} should include an inline script`);
	return script[1];
}

const initialize = inlineScript('src/layouts/SiteLayout.astro');
const interact = inlineScript('src/components/Header.astro');

function themePage({
	systemDark,
	storedTheme = null,
	storageBlocked = false,
	writesBlocked = false,
}: {
	systemDark: boolean;
	storedTheme?: string | null;
	storageBlocked?: boolean;
	writesBlocked?: boolean;
}) {
	const root = { dataset: { theme: 'light' }, classList: new Set<string>() };
	const button = new EventTarget();
	const system = Object.assign(new EventTarget(), { matches: systemDark });
	const storedValues = new Map<string, string>();
	if (storedTheme !== null) storedValues.set('color-theme', storedTheme);
	const context = createContext({
		document: {
			documentElement: root,
			querySelector: (selector: string) => (selector === '.theme-toggle' ? button : null),
		},
		matchMedia(query: string) {
			assert.equal(query, '(prefers-color-scheme: dark)');
			return system;
		},
		get localStorage() {
			if (storageBlocked) throw new Error('Storage access denied');
			return {
				getItem: (key: string) => storedValues.get(key) ?? null,
				setItem(key: string, value: string) {
					if (writesBlocked) throw new Error('Storage write failed');
					storedValues.set(key, value);
				},
			};
		},
	});
	runInContext(initialize, context);
	const initialTheme = root.dataset.theme;
	assert.ok(root.classList.has('has-js'));
	runInContext(interact, context);
	return {
		root,
		initialTheme,
		storedValues,
		click: () => button.dispatchEvent(new Event('click')),
		changeSystem(matches: boolean) {
			system.matches = matches;
			system.dispatchEvent(Object.assign(new Event('change'), { matches }));
		},
	};
}

describe('theme preference', () => {
	for (const [storedTheme, systemDark, expected] of [
		[null, false, 'light'],
		[null, true, 'dark'],
		['light', true, 'light'],
		['dark', false, 'dark'],
		['invalid', true, 'dark'],
	] as const) {
		it(`initializes ${expected} before the header with stored=${storedTheme}, systemDark=${systemDark}`, () => {
			const page = themePage({ storedTheme, systemDark });
			assert.equal(page.initialTheme, expected);
			assert.equal(page.root.dataset.theme, expected);
		});
	}

	for (const storedTheme of [null, 'invalid']) {
		it(`follows system changes without a valid manual preference (${storedTheme})`, () => {
			const page = themePage({ systemDark: false, storedTheme });
			page.changeSystem(true);
			assert.equal(page.root.dataset.theme, 'dark');
			page.changeSystem(false);
			assert.equal(page.root.dataset.theme, 'light');
			assert.equal(page.storedValues.get('color-theme') ?? null, storedTheme);
		});
	}

	for (const storedTheme of ['light', 'dark']) {
		it(`keeps stored ${storedTheme} when the system changes`, () => {
			const page = themePage({ systemDark: true, storedTheme });
			page.changeSystem(false);
			assert.equal(page.root.dataset.theme, storedTheme);
			page.changeSystem(true);
			assert.equal(page.root.dataset.theme, storedTheme);
		});
	}

	it('persists both manual choices and stops following the system after a click', () => {
		const page = themePage({ systemDark: false });
		page.click();
		assert.equal(page.root.dataset.theme, 'dark');
		assert.equal(page.storedValues.get('color-theme'), 'dark');
		page.changeSystem(true);
		page.changeSystem(false);
		assert.equal(page.root.dataset.theme, 'dark');
		page.click();
		assert.equal(page.root.dataset.theme, 'light');
		assert.equal(page.storedValues.get('color-theme'), 'light');
		page.changeSystem(true);
		assert.equal(page.root.dataset.theme, 'light');
	});

	for (const [systemDark, expected] of [
		[false, 'light'],
		[true, 'dark'],
	] as const) {
		it(`initializes ${expected} when storage access throws`, () => {
			const page = themePage({ systemDark, storageBlocked: true });
			assert.equal(page.initialTheme, expected);
		});
	}

	for (const options of [{ storageBlocked: true }, { writesBlocked: true }]) {
		it(`keeps manual toggles working when storage fails (${JSON.stringify(options)})`, () => {
			const page = themePage({ systemDark: false, ...options });
			page.changeSystem(true);
			assert.equal(page.root.dataset.theme, 'dark');
			page.click();
			assert.equal(page.root.dataset.theme, 'light');
			page.changeSystem(false);
			page.changeSystem(true);
			assert.equal(page.root.dataset.theme, 'light');
			page.click();
			assert.equal(page.root.dataset.theme, 'dark');
			assert.equal(page.storedValues.size, 0);
		});
	}
});
