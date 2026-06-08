# Page Transition Design

## Context

The blog is a static Astro site with language-prefixed routes under `/en/` and `/zh/`.
Page changes currently use normal document navigation, which makes transitions feel abrupt.

The goal is to make internal page changes feel smoother while preserving the site's quiet,
text-first reading experience.

## Confirmed Decisions

- Use a light fade-in with a small vertical offset.
- Animate only the page's main content area.
- Keep the header, navigation, and footer visually stable during transitions.
- Apply transitions to internal content navigation:
  - home pages
  - post list pages
  - post detail pages
  - about pages
  - header navigation links
  - language switching
- Do not apply transitions to:
  - external links
  - RSS links
  - file downloads
  - the root `/` redirect page
- Respect `prefers-reduced-motion: reduce` by disabling the animation.
- New internal page visits should land at the top of the new page.
- Browser back and forward should preserve scroll position as much as Astro's router supports.

## Recommended Approach

Use Astro's official `<ClientRouter />` from `astro:transitions`, added through the shared
`BaseHead.astro` component. This gives the site client-side routing for internal navigation
and access to Astro's view transition behavior without hand-rolling history, scroll, and
accessibility behavior.

Only the `<main>` element should receive a stable transition identity and a shared custom
animation. The page shell remains stable, which makes the experience feel like the content is
changing inside a persistent site frame.

## Architecture

### Shared Head

`src/components/BaseHead.astro` will import and render `<ClientRouter />`.
All normal content pages already render `BaseHead`, so this enables transitions across the
site without repeating router setup in individual pages.

The root redirect page at `src/pages/index.astro` does not use `BaseHead`, so it remains a
normal redirect and does not participate in client-side transitions.

### Main Content Transition

Every normal page template that renders a `<main>` element will mark it as the transition
target:

- `src/pages/[lang]/index.astro`
- `src/pages/[lang]/posts/index.astro`
- `src/pages/[lang]/about.astro`
- `src/layouts/BlogPost.astro`
- `src/pages/404.astro`

The transition target will use the stable name `main`, so Astro and the browser can match the
outgoing and incoming content consistently. That name must appear only once per page.

The animation should be defined as a reusable custom transition object, for example in a small
`src/transitions.ts` helper, and applied with `transition:animate={mainContentTransition}` on
each top-level `<main>`. The matching keyframes should live in `src/styles/global.css`.

The animation should only animate:

- opacity
- a small `translateY`

It should avoid blur, scaling, and horizontal motion to keep the reading experience calm.

### Language Switching

`src/components/LanguageSelect.astro` currently changes language with `window.location.href`.
That creates a hard navigation even when the target path is internal.

The script should use `navigate()` from `astro:transitions/client` for valid internal targets.
It should do nothing when the value is empty or already matches the current path.

The existing `<noscript>` fallback links should remain unchanged.

### Link Scope

Astro's router should naturally handle ordinary internal links that point to pages also using
`<ClientRouter />`. Links that do not represent normal internal content navigation should not
be forced through the router.

For this site, external author links and RSS links are already normal anchors. They should
continue to behave as normal browser navigation or external navigation. RSS links should be
marked with `data-astro-reload` because they point to internal XML documents rather than normal
content pages. If any other internal link must explicitly opt out later, it can use the same
Astro attribute.

## Accessibility

Astro's `<ClientRouter />` includes route announcement behavior for assistive technologies.
The implementation should rely on that built-in route announcement instead of creating a
custom live region.

The implementation must disable custom view transition animations under
`prefers-reduced-motion: reduce`. Astro also disables its fallback animation in this mode,
so the result should be a normal content swap without motion.

## Browser Behavior

Internal clicks should feel smoother but should still behave like normal page navigation:

- URLs update normally.
- Browser back and forward work normally.
- New pages start at the top.
- Back and forward navigation restore previous scroll positions where Astro supports it.

No custom scroll manager should be added unless verification shows Astro's built-in behavior
does not satisfy the confirmed behavior.

## Testing And Verification

Implementation should be verified with the existing project checks:

- `pnpm run lint`
- `pnpm run format:check`
- `pnpm run test:unit`
- `pnpm run build`
- `pnpm run test:i18n`

Use `pnpm run check` as the primary verification command. If it fails for an environmental or
diagnostic reason, run the individual commands above to isolate the failure.

Manual browser verification should cover:

- clicking from the home page to the post list
- clicking from the post list to a post detail page
- clicking to the about page
- switching language on a normal content page
- confirming the header and footer do not visibly animate
- confirming the main content fades in with a small upward motion
- confirming external/RSS links are not forcibly handled as internal animated navigation
- confirming the root `/` redirect still behaves as before
- confirming reduced-motion CSS disables the animation

## Risks

- Astro client-side navigation changes script execution semantics. This project has very little
  page-level JavaScript, and the language selector script should be adjusted to the router API,
  so the risk is low.
- View transition support differs by browser. Astro provides fallback behavior, and reduced
  motion is handled explicitly.
- A shared transition name must appear only once per page. The implementation should mark only
  the single top-level `<main>` element on each page.
