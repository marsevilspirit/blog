# 站点维护手册

这份文档说明当前博客站点的内容结构、路由规则、常见修改入口，以及新增文章时需要遵守的约束。

配置字段的详细说明见 [配置说明](./configuration.md)。

## 当前架构

这个项目是 Astro 静态博客。核心结构如下：

```text
src/
  components/        通用组件：头部、页脚、语言下拉、日期格式、SEO head
  content/           Markdown 内容集合
    about/           About 页面内容，固定 en.md / zh.md
    posts/           文章内容，按 slug 分组
  layouts/           文章页布局
  pages/             Astro 路由页面
  styles/            全站样式
  config.ts          读取并校验 config/*.toml，导出站点常量
  i18n.ts            i18n 路由、内容分组、日期、alternate 逻辑
public/
  img/               作者头像等公共图片
  posts/             文章图片，按文章 slug 放
  robots.txt         爬虫配置
  site.webmanifest   PWA/站点 manifest
scripts/
  verify-i18n.mjs    自定义 i18n 结构校验
config/
  site.toml          全局 TOML 配置：标题、语言列表、作者、链接
  en.toml            英文站点文案
  zh.toml            中文站点文案
```

路由由 `src/pages/` 生成：

```text
/                         静态跳转到 /en/
/en/                      英文首页
/zh/                      中文首页
/en/posts/                英文文章列表
/zh/posts/                中文文章列表
/en/posts/<slug>/         英文文章详情
/zh/posts/<slug>/         中文文章详情
/en/about/                英文 About
/zh/about/                中文 About
/en/rss.xml               英文 RSS
/zh/rss.xml               中文 RSS
/404.html                 根英文 404
```

站点不保留旧 `/blog/`、根 `/about/`、根 `/rss.xml`。内部链接都应该使用尾斜杠。

## 新建文章

文章目录名就是 slug，不要在 frontmatter 里写 `slug`。

新建一篇文章时，在 `src/content/posts/` 下建目录：

```text
src/content/posts/my-new-post/
  en.md
  zh.md
```

不强制每篇文章双语。只有英文就只放 `en.md`，只有中文就只放 `zh.md`。如果同一个 slug 同时有 `en.md` 和 `zh.md`，两边的 `pubDate` 必须完全一致。

文章 frontmatter 格式：

```md
---
title: "My New Post"
description: "Short description for list, meta, and RSS."
pubDate: 2026-06-08T12:00:00+08:00
---

Article body...
```

可选字段：

```md
draft: true
updatedDate: 2026-06-09T12:00:00+08:00
```

`draft: true` 的文章不会发布，也不会进入 RSS。默认没有 `draft` 时就是发布状态。

首页和文章列表里的摘要会优先从正文前几个自然段生成，长度约 165 个字符，用来接近两行展示。`description` 仍然需要填写，它用于 SEO、RSS，以及正文为空时的兜底摘要。

## 文章图片

只允许使用 `public` 里的绝对路径图片或外链图片。

推荐按文章 slug 放图片：

```text
public/posts/my-new-post/cover.jpg
```

Markdown 里这样引用：

```md
![Cover](/posts/my-new-post/cover.jpg)
```

不要写相对路径，例如 `./cover.jpg` 或 `cover.jpg`。

## 修改 About 页面

About 内容在：

```text
src/content/about/en.md
src/content/about/zh.md
```

About 必须同时有英文和中文两个文件。标题和描述按语言独立：

```md
---
title: "About Me"
description: "About page description."
---

About body...
```

英文 URL 是 `/en/about/`，中文 URL 是 `/zh/about/`。

## 修改首页 Profile

首页是 Profile 风格，页面文件在：

```text
src/pages/[lang]/index.astro
```

常改内容主要在 `config/site.toml` 和对应语言文件：

```toml
# config/site.toml
[author]
name = "marsevilspirit"
avatar = "/img/author.png"

# config/en.toml
authorHeadline = "software engineer"
authorBio = "..."

# config/zh.toml
authorHeadline = "软件工程师"
authorBio = "..."
```

作者头像在：

```text
public/img/author.png
```

如果只换头像，保持文件名不变最省事。要改路径，则同步修改 `config/site.toml` 里的 `author.avatar`。

首页最近文章数量目前是 5 篇，在 `src/pages/[lang]/index.astro` 里改 `slice(0, 5)`。

## 修改导航、页脚和语言下拉

导航组件：

```text
src/components/Header.astro
src/components/HeaderLink.astro
src/components/LanguageSelect.astro
```

导航文案在对应语言文件里，例如：

```toml
# config/en.toml
[nav]
posts = "Posts"
about = "About"
language = "Language"

# config/zh.toml
[nav]
posts = "文章"
about = "关于"
language = "语言"
```

语言下拉当前只显示 `English` / `中文` 选项，不显示额外的 `Language` 或 `语言` 可见文字。`language` 文案仍作为 `aria-label` 使用，给屏幕阅读器和可访问性保留。

页脚组件：

```text
src/components/Footer.astro
```

作者链接在 `config/site.toml`：

```toml
[[author.links]]
label = "GitHub"
href = "https://github.com/marsevilspirit"

[[author.links]]
label = "RSS"
href = "/rss.xml"
```

这些 label 不本地化。RSS 链接会在组件里自动切换为 `/en/rss.xml` 或 `/zh/rss.xml`。

## 修改站点级文案和 SEO

站点标题、作者、语言列表在：

```text
config/site.toml
```

各语言的描述、日期格式、导航、首页文案、文章列表标题分别在：

```text
config/en.toml
config/zh.toml
```

`src/config.ts` 会在构建时先读取 `config/site.toml`，再根据 `languages` 自动读取 `config/<lang>.toml`，并向页面和组件导出 `SITE_TITLE`、`SITE`、`AUTHOR_NAME`、`AUTHOR_LINKS` 等常量。

SEO 和 hreflang 输出在：

```text
src/components/BaseHead.astro
src/i18n.ts
```

当前规则：

- `/en` 使用 `<html lang="en">`
- `/zh` 使用 `<html lang="zh-CN">`
- 页面存在英文版本时输出 `x-default`，指向英文版本
- sitemap 使用 Astro 默认 sitemap，只列出页面 URL，不输出 alternate 扩展

## 修改样式

全站样式在：

```text
src/styles/global.css
```

当前风格是 BearBlog 方向：窄内容宽度、普通文本排版、少装饰、少卡片。修改样式时优先保持这种轻量文本博客风格。

局部组件样式一般写在对应 `.astro` 文件底部的 `<style>` 中。

## RSS、sitemap 和 robots

RSS 路由：

```text
src/pages/[lang]/rss.xml.js
```

只生成：

```text
/en/rss.xml
/zh/rss.xml
```

`draft: true` 的文章不会进入 RSS。

站点域名在：

```text
astro.config.mjs
```

robots 文件在：

```text
public/robots.txt
```

如果换域名，要同时检查 `astro.config.mjs` 和 `public/robots.txt` 里的 sitemap 地址。

## i18n 逻辑

核心 i18n 工具在：

```text
src/i18n.ts
```

它负责：

- 校验语言是否只允许 `en` / `zh`
- 从 `src/content/posts/<slug>/<lang>.md` 解析 slug 和语言
- 按文章组排序
- 同 slug 多语言共享日期校验
- 过滤草稿
- 生成 `/en/posts/<slug>/` 和 `/zh/posts/<slug>/`
- 生成 hreflang alternate
- 按语言格式化日期

内容 schema 在：

```text
src/content.config.ts
```

这里定义文章和 About 的 frontmatter 字段。

## 关于 bot 页面

当前项目没有独立的 bot 页面或 bot 组件。如果你说的是 About、Profile、导航、页脚这些界面，可以按上面的对应文件修改。

如果以后要新增一个 bot 页面，建议走当前 i18n 路由结构：

```text
src/pages/[lang]/bot.astro
```

然后在 `src/i18n.ts` 增加对应路径 helper 和 alternates 逻辑，在 `config/en.toml` / `config/zh.toml` 增加站点文案，并在 `Header.astro` 里加入导航入口。

## 发布前检查

修改内容或结构后，建议跑：

```bash
pnpm build
pnpm run test:i18n
```

`pnpm run test:i18n` 会检查：

- 旧 `src/content/blog` 和旧 `/blog` 页面源码不存在
- `config/site.toml`、`config/en.toml`、`config/zh.toml` 存在，并且站点级文案从 TOML 读取
- About 同时有 `en.md` 和 `zh.md`
- 文章语言文件只允许 `en.md` / `zh.md`
- 文章 frontmatter 有 `title`、`description`、`pubDate`
- 同 slug 多语言日期一致
- frontmatter 不写 `slug`
- Markdown 图片只用 public 绝对路径或外链
- 草稿不生成页面，也不进入 RSS
- 首页、文章列表、文章页、About、RSS 路由按语言生成
- sitemap 不输出 alternate 扩展

如果只是改文档，不需要跑构建。
