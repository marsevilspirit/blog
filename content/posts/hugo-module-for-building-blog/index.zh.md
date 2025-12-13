+++
date = '2025-05-14T23:50:10+08:00'
draft = false
title = '使用 Hugo Module 构建博客'
+++

我认为使用 Hugo modules 是创建个人博客的最佳方式。有些人认为 Hugo modules 更适合依赖较多的网站，但我认为即使只是用 Hugo modules 来管理主题，也是最佳选择。

我之前的博客是用 Hexo 搭建的，体验也不错。写主题的感觉和 Hugo 差不多。我选择 Hugo 的主要原因是它是由 Go 语言编写的，而 Hexo 是由 TypeScript 编写的。我擅长 Go，所以我觉得使用 Hugo 更舒服，这也是我切换到它的原因。

切换到 Hugo 后，我发现了更多的优势。Hexo 的速度还可以；启动需要几秒钟，但 Hugo 简直快得惊人，只需要几毫秒。真的让我很惊讶！让我继续使用 Hugo 的一个功能是 Hugo module。它允许将博客文章和主题分开，真正实现了内容和代码的分离。这种设计模式简直是艺术！

我不再需要在我的博客文件夹中创建一个 theme 目录。我可以只专注于我的文章内容。Hugo modules 的命令就像 Go modules 一样，使用起来非常舒服。版本控制非常出色，相比之下，虽然我不太熟悉 npm，但 Hugo modules 几乎是无敌的！

我目前的博客使用的是我创建的一个名为 [Magellanic](https://github.com/marsevilspirit/magellanic) 的主题，我的 [博客](https://github.com/marsevilspirit/blog) 就是用它构建的。如果你去查看，你会发现 Magellanic 只包含代码，而博客只包含文章。这种分离对我来说太美妙了！我使用 Cloudflare Pages 进行了部署。使用 Cloudflare Pages 是另一个伟大的决定。部署环境非常智能；它内置了 Go 环境，并且对 HTTP/3 有很好的支持（我是 HTTP/3 的忠实支持者）。我几乎不需要配置任何东西，因为 Cloudflare 为我处理了一切。他们真的做得非常出色！

总之，我认为 Hugo modules 毫无疑问是构建博客的最佳选择。
