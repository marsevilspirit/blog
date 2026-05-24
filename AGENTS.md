# AGENTS.md

此文件为 Codex (Codex.ai/code) 在此仓库中工作提供指导。

## 项目概述

这是一个使用 **Hugo** 静态网站生成器构建的个人博客，使用 **Congo v2** 主题。博客支持中英文双语内容，部署在 Cloudflare Pages 上。

## 命令

```sh
# 启动本地开发服务器（包含草稿）
hugo server --disableFastRender -D
```

## 内容结构

- **文章**: `content/posts/<文章名称>/index.md` (英文) 和 `index.zh.md` (中文)
- **页面**: `content/<页面名称>/index.md` (例如 `about/index.md`)
- **图片**: 与文章内容存放在同一目录下
- **模板**: `archetypes/default.md` 用于新建文章的模板

## Hugo 配置

配置文件位于 `config/_default/`:
- `hugo.toml` - Hugo 主配置 (baseURL、输出格式、隐私设置等)
- `languages.en.toml` / `languages.zh.toml` - 语言特定设置
- `menus.en.toml` / `menus.zh.toml` - 导航菜单定义
- `params.toml` - 主题参数
- `module.toml` - Hugo 模块依赖 (Congo 主题)

## 国际化 (i18n)

文章支持双语言版本:
- 英文: 目录中的 `index.md`
- 中文: 同一目录中的 `index.zh.md`

**规则**:
1. 修改任一语言版本时，必须同步更新另一种语言版本。
2. 中文内容中避免用分号连接句子，句子之间用句号分开。

语言选择器已内置于 Congo 主题中。
