# 配置说明

站点配置拆在 `config/` 目录里：

```text
config/
  site.toml   # 全局配置
  en.toml     # 英文站点文案
  zh.toml     # 中文站点文案
```

构建时由 `src/config.ts` 读取这些文件。读取顺序是：先读 `config/site.toml`，再根据 `languages` 自动读取 `config/<lang>.toml`。

## 全局配置

全局配置文件：

```text
config/site.toml
```

### title

站点标题。这个标题不按语言翻译，会显示在页面标题、导航站点名、RSS 标题等位置。

```toml
title = "marsevilspirit's blog"
```

### defaultLang

默认语言。当前根路径 `/` 会跳转到 `/en/`，所以这里保持：

```toml
defaultLang = "en"
```

### languages

启用的语言列表。当前代码只支持 `en` 和 `zh`：

```toml
languages = ["en", "zh"]
```

如果以后要新增语言，不能只改这里；还需要增加 `config/<lang>.toml`、内容结构、路由和校验逻辑。

### author

作者信息：

```toml
[author]
name = "marsevilspirit"
avatar = "/img/author.png"
```

`name` 会显示在首页 Profile、About Profile 和头像 alt 上。

`avatar` 必须使用 public 绝对路径，例如 `/img/author.png`。对应文件在：

```text
public/img/author.png
```

### author.links

作者链接列表：

```toml
[[author.links]]
label = "GitHub"
href = "https://github.com/marsevilspirit"

[[author.links]]
label = "RSS"
href = "/rss.xml"
```

这些 label 不做本地化。`GitHub`、`Mastodon`、`Email`、`RSS` 会按这里的顺序显示。

`RSS` 的 `href` 可以保持 `/rss.xml`，组件会按当前语言自动替换为 `/en/rss.xml` 或 `/zh/rss.xml`。

## 语言配置

英文配置：

```text
config/en.toml
```

中文配置：

```text
config/zh.toml
```

两个文件字段结构相同，内容按语言独立。

### description

站点级描述，用于首页 meta description、Open Graph、Twitter metadata，以及 RSS 站点描述。

```toml
description = "Marsevilspirit's personal blog about software engineering, Neovim, and infosec."
```

### htmlLang

输出到 `<html lang="...">` 的语言值。

```toml
htmlLang = "en"
```

中文目前是：

```toml
htmlLang = "zh-CN"
```

### dateLocale

日期格式化使用的 locale。

```toml
dateLocale = "en-GB"
```

中文目前是：

```toml
dateLocale = "zh-CN"
```

### authorHeadline

首页和 About Profile 中作者名后面的短身份说明。

```toml
authorHeadline = "software engineer"
```

中文：

```toml
authorHeadline = "软件工程师"
```

### authorBio

首页和 About Profile 中显示的作者简介句子。

```toml
authorBio = "To write elegant code with human logic—this is the meaning of my existence."
```

中文：

```toml
authorBio = "用人类的逻辑写出优雅的代码，这是我活着的意义。"
```

如果要改你首页 Profile 里的那句话，就改对应语言文件里的 `authorBio`。

## 日期选项

日期格式在语言文件的 `[dateOptions]` 中配置：

```toml
[dateOptions]
year = "numeric"
month = "long"
day = "numeric"
```

当前效果：

- 英文：`17 December 2025`
- 中文：`2025年12月17日`

支持值由代码校验，当前允许 `numeric`、`2-digit`、`long`、`short`、`narrow`。

## 导航文案

导航文案在 `[nav]`：

```toml
[nav]
posts = "Posts"
about = "About"
language = "Language"
```

`posts` 和 `about` 是导航里可见的链接文字。

`language` 当前不作为可见文字显示，只作为语言下拉框的 `aria-label`，用于可访问性。

## 首页文案

首页文章区域在 `[home]`：

```toml
[home]
recentPosts = "Recent posts"
allPosts = "All posts"
```

`recentPosts` 是首页最近文章标题。

`allPosts` 是跳转到文章列表页的链接文字。

## 文章列表文案

文章列表页文案在 `[posts]`：

```toml
[posts]
title = "Posts"
description = "All posts, grouped by year."
```

`title` 会显示为 `/en/posts/` 或 `/zh/posts/` 页面标题。

`description` 会显示在文章列表页标题下方，也用于该页面的 meta description。

## 页脚辅助文案

页脚链接组的可访问性标签在 `[footer]`：

```toml
[footer]
authorLinks = "Author links"
```

中文：

```toml
[footer]
authorLinks = "作者链接"
```

这不是可见文本，主要给屏幕阅读器使用。

## 读取和校验规则

配置读取代码在：

```text
src/config.ts
```

它会校验：

- `config/site.toml` 必须存在
- `languages` 只能包含当前支持的语言
- `defaultLang` 必须在 `languages` 里
- `config/<lang>.toml` 必须存在
- 必填字段必须是非空字符串
- 日期选项必须是允许值
- 作者链接必须是数组

如果 TOML 缺字段或结构不对，`pnpm build` 会失败。

## 修改后检查

改配置后建议跑：

```bash
pnpm build
pnpm run test:i18n
```

如果只是改普通文案，通常 `pnpm build` 就能发现 TOML 结构错误；`pnpm run test:i18n` 会额外确认语言路由、RSS、sitemap 和配置结构仍符合当前约束。
