# marsevilspirit's blog

Personal static blog built with Astro. The site uses a complete `/en/` and
`/zh/` route split, Bear Blog inspired styling, and a profile-first home page.

## Project Structure

```text
config/
  site.toml   # Shared site config
  en.toml     # English copy and labels
  zh.toml     # Chinese copy and labels
docs/
  configuration.md
  site-maintenance.md
public/
  img/
  posts/
src/
  content/
    about/
      en.md
      zh.md
    posts/
      <slug>/
        en.md
        zh.md
  pages/
    [lang]/
```

Post directory names are the canonical slugs. For example:

```text
src/content/posts/apple-music-vs-spotify/en.md
src/content/posts/apple-music-vs-spotify/zh.md
```

The URL language is controlled only by the route prefix:

```text
/en/posts/apple-music-vs-spotify/
/zh/posts/apple-music-vs-spotify/
```

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm run test:i18n
```

## Cloudflare Pages

This project can be deployed as a static Cloudflare Pages site.

Use these settings:

```text
Framework preset: Astro
Build command: pnpm build
Build output directory: dist
Root directory: repository root
Node version: 22.12.0 or newer
```

If Cloudflare uses an older default Node version, set this environment variable:

```text
NODE_VERSION=22.12.0
```

## Documentation

- `docs/site-maintenance.md`: how to add posts, edit pages, and understand the architecture.
- `docs/configuration.md`: how `config/site.toml`, `config/en.toml`, and `config/zh.toml` work.

## Credit

The visual style is based on the lovely
[Bear Blog](https://github.com/HermanMartinus/bearblog/).
