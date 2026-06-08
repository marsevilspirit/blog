# Page Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add smooth internal page transitions to the Astro blog, using a light fade-in with small vertical motion on the main content only.

**Architecture:** Use Astro's `<ClientRouter />` in the shared head to enable internal client-side navigation. Apply one shared custom transition object to each top-level `<main>` element, keep the page shell stable, and use `navigate()` for language switching. RSS/internal XML links opt out with `data-astro-reload`.

**Tech Stack:** Astro 6, `astro:transitions`, `astro:transitions/client`, TypeScript, Vitest, CSS keyframes.

---

## Scope Check

This plan implements one subsystem: internal page transition behavior for the existing Astro blog. It does not change content modeling, routing shape, layout structure, theme design, or deployment configuration.

## File Structure

- Create: `tests/unit/page-transition.test.ts`
  - Source-level regression tests for transition wiring across Astro components and pages.
- Create: `src/transitions.ts`
  - Shared transition object consumed by Astro `transition:animate`.
- Modify: `src/components/BaseHead.astro`
  - Import and render Astro `<ClientRouter />`.
- Modify: `src/styles/global.css`
  - Add transition keyframes and reduced-motion override.
- Modify: `src/pages/[lang]/index.astro`
  - Import shared transition, mark `<main>`, and opt RSS author link out of client routing.
- Modify: `src/pages/[lang]/posts/index.astro`
  - Import shared transition and mark `<main>`.
- Modify: `src/pages/[lang]/about.astro`
  - Import shared transition, mark `<main>`, and opt RSS author link out of client routing.
- Modify: `src/layouts/BlogPost.astro`
  - Import shared transition and mark `<main>` for post detail pages.
- Modify: `src/pages/404.astro`
  - Import shared transition and mark `<main>`.
- Modify: `src/components/LanguageSelect.astro`
  - Replace hard `window.location.href` navigation with Astro `navigate()`.
- Modify: `src/components/Footer.astro`
  - Opt RSS footer link out of client routing.

## Task 1: Add Failing Transition Wiring Tests

**Files:**

- Create: `tests/unit/page-transition.test.ts`

- [ ] **Step 1: Create the source-level regression test**

Create `tests/unit/page-transition.test.ts` with this complete content:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm vitest run tests/unit/page-transition.test.ts
```

Expected: the command exits non-zero. The first failure should mention that `BaseHead.astro` does not contain `ClientRouter` yet.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add tests/unit/page-transition.test.ts
git commit -m "test: add page transition wiring coverage"
```

Expected: a commit is created with only `tests/unit/page-transition.test.ts`.

## Task 2: Add Shared Transition Helper And CSS

**Files:**

- Create: `src/transitions.ts`
- Modify: `src/styles/global.css`
- Test: `tests/unit/page-transition.test.ts`

- [ ] **Step 1: Create the shared transition helper**

Create `src/transitions.ts` with this complete content:

```ts
const mainContentAnimation = {
	old: {
		name: 'main-content-out',
		duration: '180ms',
		easing: 'cubic-bezier(0.4, 0, 1, 1)',
		fillMode: 'both',
	},
	new: {
		name: 'main-content-in',
		duration: '220ms',
		easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
		fillMode: 'both',
	},
} as const;

export const mainContentTransition = {
	forwards: mainContentAnimation,
	backwards: mainContentAnimation,
} as const;
```

- [ ] **Step 2: Add global keyframes and reduced-motion override**

Append this block to `src/styles/global.css` before the existing `@media (max-width: 720px)` block:

```css
@keyframes main-content-in {
	from {
		opacity: 0;
		transform: translateY(10px);
	}

	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes main-content-out {
	from {
		opacity: 1;
		transform: translateY(0);
	}

	to {
		opacity: 0;
		transform: translateY(-6px);
	}
}

@media (prefers-reduced-motion: reduce) {
	::view-transition-old(main),
	::view-transition-new(main) {
		animation: none !important;
	}
}
```

- [ ] **Step 3: Run the focused test and verify remaining failures**

Run:

```bash
pnpm vitest run tests/unit/page-transition.test.ts
```

Expected: the transition helper and CSS assertions pass. Remaining failures should point to missing `ClientRouter`, missing `<main>` transition attributes, `LanguageSelect.astro`, and RSS opt-out attributes.

- [ ] **Step 4: Commit the transition helper and CSS**

Run:

```bash
git add src/transitions.ts src/styles/global.css
git commit -m "feat: add main content transition definition"
```

Expected: a commit is created with `src/transitions.ts` and `src/styles/global.css`.

## Task 3: Wire Astro ClientRouter And Main Content Targets

**Files:**

- Modify: `src/components/BaseHead.astro`
- Modify: `src/pages/[lang]/index.astro`
- Modify: `src/pages/[lang]/posts/index.astro`
- Modify: `src/pages/[lang]/about.astro`
- Modify: `src/layouts/BlogPost.astro`
- Modify: `src/pages/404.astro`
- Test: `tests/unit/page-transition.test.ts`

- [ ] **Step 1: Add ClientRouter to the shared head**

In `src/components/BaseHead.astro`, add this import in frontmatter:

```astro
import {ClientRouter} from 'astro:transitions';
```

Add this component after `<Font cssVariable="--font-atkinson" preload />`:

```astro
<ClientRouter />
```

- [ ] **Step 2: Mark the language home page main content**

In `src/pages/[lang]/index.astro`, add this import:

```astro
import {mainContentTransition} from '../../transitions';
```

Replace the opening `<main>` tag with:

```astro
<main transition:name="main" transition:animate={mainContentTransition}></main>
```

- [ ] **Step 3: Mark the post list page main content**

In `src/pages/[lang]/posts/index.astro`, add this import:

```astro
import {mainContentTransition} from '../../../transitions';
```

Replace the opening `<main>` tag with:

```astro
<main transition:name="main" transition:animate={mainContentTransition}></main>
```

- [ ] **Step 4: Mark the about page main content**

In `src/pages/[lang]/about.astro`, add this import:

```astro
import {mainContentTransition} from '../../transitions';
```

Replace the opening `<main>` tag with:

```astro
<main transition:name="main" transition:animate={mainContentTransition}></main>
```

- [ ] **Step 5: Mark post detail layout main content**

In `src/layouts/BlogPost.astro`, add this import:

```astro
import {mainContentTransition} from '../transitions';
```

Replace the opening `<main>` tag with:

```astro
<main transition:name="main" transition:animate={mainContentTransition}></main>
```

- [ ] **Step 6: Mark the 404 page main content**

In `src/pages/404.astro`, add this import:

```astro
import {mainContentTransition} from '../transitions';
```

Replace the opening `<main>` tag with:

```astro
<main transition:name="main" transition:animate={mainContentTransition}></main>
```

- [ ] **Step 7: Run the focused test and verify remaining failures**

Run:

```bash
pnpm vitest run tests/unit/page-transition.test.ts
```

Expected: ClientRouter and `<main>` assertions pass. Remaining failures should point to `LanguageSelect.astro` and RSS opt-out attributes.

- [ ] **Step 8: Run build to catch Astro directive or import errors**

Run:

```bash
pnpm run build
```

Expected: build exits 0. If Astro rejects the transition object shape, adjust `src/transitions.ts` before continuing.

- [ ] **Step 9: Commit the router and main target wiring**

Run:

```bash
git add src/components/BaseHead.astro 'src/pages/[lang]/index.astro' 'src/pages/[lang]/posts/index.astro' 'src/pages/[lang]/about.astro' src/layouts/BlogPost.astro src/pages/404.astro
git commit -m "feat: wire main content page transitions"
```

Expected: a commit is created with the shared head and page template changes.

## Task 4: Route Language Switching Through Astro And Opt RSS Out

**Files:**

- Modify: `src/components/LanguageSelect.astro`
- Modify: `src/pages/[lang]/index.astro`
- Modify: `src/pages/[lang]/about.astro`
- Modify: `src/components/Footer.astro`
- Test: `tests/unit/page-transition.test.ts`

- [ ] **Step 1: Replace the language select script**

In `src/components/LanguageSelect.astro`, replace the entire `<script>` block with:

```astro
<script>
	import { navigate } from 'astro:transitions/client';

	document.addEventListener('change', (event) => {
		const target = event.target;
		if (!(target instanceof HTMLSelectElement) || !target.closest('.language-select')) {
			return;
		}

		const href = target.value;
		if (!href || href === window.location.pathname) {
			return;
		}

		navigate(href);
	});
</script>
```

- [ ] **Step 2: Opt the home page RSS author link out of client routing**

In `src/pages/[lang]/index.astro`, replace the author link anchor with:

```astro
<a
	href={link.href}
	target={link.href.startsWith('http') ? '_blank' : undefined}
	data-astro-reload={link.label === 'RSS' ? true : undefined}
>
	{link.label}
</a>
```

- [ ] **Step 3: Opt the about page RSS author link out of client routing**

In `src/pages/[lang]/about.astro`, replace the author link anchor with:

```astro
<a
	href={link.href}
	target={link.href.startsWith('http') ? '_blank' : undefined}
	data-astro-reload={link.label === 'RSS' ? true : undefined}
>
	{link.label}
</a>
```

- [ ] **Step 4: Opt the footer RSS link out of client routing**

In `src/components/Footer.astro`, replace the footer author link anchor with:

```astro
<a
	href={link.href}
	target={link.href.startsWith('http') ? '_blank' : undefined}
	data-astro-reload={link.label === 'RSS' ? true : undefined}
>
	{link.label}
</a>
```

- [ ] **Step 5: Run the focused transition wiring test**

Run:

```bash
pnpm vitest run tests/unit/page-transition.test.ts
```

Expected: all tests in `tests/unit/page-transition.test.ts` pass.

- [ ] **Step 6: Run the full unit test suite**

Run:

```bash
pnpm run test:unit
```

Expected: all Vitest tests pass.

- [ ] **Step 7: Commit navigation and RSS scope changes**

Run:

```bash
git add src/components/LanguageSelect.astro 'src/pages/[lang]/index.astro' 'src/pages/[lang]/about.astro' src/components/Footer.astro
git commit -m "feat: route language switch through transitions"
```

Expected: a commit is created with the language switch and RSS opt-out changes.

## Task 5: Format, Verify, And Manually Check Browser Behavior

**Files:**

- Verify: all modified files

- [ ] **Step 1: Run Prettier on modified files**

Run:

```bash
pnpm prettier --write tests/unit/page-transition.test.ts src/transitions.ts src/styles/global.css src/components/BaseHead.astro 'src/pages/[lang]/index.astro' 'src/pages/[lang]/posts/index.astro' 'src/pages/[lang]/about.astro' src/layouts/BlogPost.astro src/pages/404.astro src/components/LanguageSelect.astro src/components/Footer.astro
```

Expected: Prettier completes and may rewrite formatting only.

- [ ] **Step 2: Run the full project check**

Run:

```bash
pnpm run check
```

Expected: lint, format check, unit tests, build, and i18n verification all exit 0.

- [ ] **Step 3: Start a local dev server**

Run:

```bash
pnpm dev -- --host 127.0.0.1
```

Expected: Astro prints a local URL, usually `http://127.0.0.1:4321/`.

- [ ] **Step 4: Verify internal page transitions in a browser**

Open the local URL from Step 3 and perform these checks:

```text
1. Open /zh/.
2. Click the posts navigation link.
3. Click a post detail link.
4. Click the about navigation link.
5. Return to the post list with the browser Back button.
```

Expected:

```text
- The URL changes normally on each internal navigation.
- Header and footer do not visibly slide or fade.
- The main content lightly fades in and moves upward.
- New page visits start near the top.
- Browser Back returns to the previous page and restores the previous list position when possible.
```

- [ ] **Step 5: Verify language switching**

In the browser:

```text
1. Open a normal content page such as /en/about/.
2. Use the language select to switch to 中文.
3. Use the language select to switch back to English.
```

Expected:

```text
- The selected page changes to the alternate language path.
- The transition matches the same light main-content animation.
- No full-page flash is visible during the language switch.
```

- [ ] **Step 6: Verify opt-out scope**

In the browser:

```text
1. Open /en/.
2. Click the RSS link in the author links.
3. Open /en/ again.
4. Click the GitHub author link.
5. Open /.
```

Expected:

```text
- The RSS link loads as a normal XML document and is not animated as a content page.
- External author links use normal browser navigation or a new tab according to their target.
- The root / page still redirects to /en/ as before.
```

- [ ] **Step 7: Commit formatting and verification fixes**

Run:

```bash
git status --short
git add tests/unit/page-transition.test.ts src/transitions.ts src/styles/global.css src/components/BaseHead.astro 'src/pages/[lang]/index.astro' 'src/pages/[lang]/posts/index.astro' 'src/pages/[lang]/about.astro' src/layouts/BlogPost.astro src/pages/404.astro src/components/LanguageSelect.astro src/components/Footer.astro
git commit -m "chore: verify page transition implementation"
```

Expected: create this commit only if Step 1 or verification fixes changed files after Task 4. If `git status --short` shows no tracked implementation changes, skip this commit.

## Final Review Checklist

- `tests/unit/page-transition.test.ts` passes.
- `pnpm run check` passes.
- `src/pages/index.astro` remains a standalone redirect page without `BaseHead` or `ClientRouter`.
- Exactly one top-level `<main>` on each normal page has `transition:name="main"`.
- RSS links in home, about, and footer include `data-astro-reload`.
- `LanguageSelect.astro` uses `navigate(href)` and no longer uses `window.location.href`.
- The implementation leaves `.superpowers/` untracked.
