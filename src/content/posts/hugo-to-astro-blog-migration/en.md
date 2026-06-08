---
title: 'From Hugo to Astro: A Blog Migration Built with AI'
description: 'I once migrated my blog from Hexo to Hugo. Now I have moved it from Hugo to Astro, and this time AI was part of the whole process.'
pubDate: '2026-06-08T15:20:00+08:00'
---

A few years ago, I migrated my blog from Hexo to Hugo. At that time, Hugo felt extremely fast, and Go felt familiar to me. Hugo Module was especially attractive because it allowed me to separate the theme from the content. The blog could contain only articles, and the theme could contain only code. That separation between content and code felt very elegant to me.

I still think so today. Hugo is a very good static site generator, and Hugo Module is a beautiful design. The Congo theme also stayed with me for a long time. It allowed me to focus on writing instead of always working on the blog itself.

But as I wanted more control over my own blog, I started to feel that some parts of Hugo were not suitable for me anymore.

The biggest problem was Go Template. I do not like writing it. When it is mixed with HTML, it always feels strange to me. I dislike writing a large amount of HTML and then inserting template logic inside it. That is not the way I like to express structure. I prefer something closer to functional components, where the logic, parameters, and component structure are all clear.

Another problem was freedom. Hugo is powerful, but when I wanted to fully control the page structure, the route shape, the relationship between languages, and the way RSS was generated, I felt that I was not completely controlling my blog. I was adjusting things inside a structure already given by a theme and a framework. That is not wrong, but it is not what I want now.

So this time, I moved from Hugo to Astro.

Astro feels very direct to me. `src/pages` is routing, `src/content` is content, and components are components. Writing `.astro` files feels more like writing page functions with inputs and outputs, rather than struggling to insert template syntax into HTML. This feeling is very important to me.

I did not want to simply change to another theme. I wanted a blog structure that truly belonged to me.

The most special part of this migration is that AI directly participated in the whole process. It was not just helping me complete a few lines of code. I described my requirements one by one, and AI turned them into code, content structure, and deployment configuration.

At first, I only wanted a style close to Bear Blog, and I did not want to use the official template anymore. Then the requirements became clearer: I wanted a complete `/en/` and `/zh/` site split, posts with the same slug, language only shown in the route prefix, each post stored as `src/content/posts/<slug>/en.md` and `zh.md`, no language link when a translation does not exist, language-specific RSS, a Profile-style home page, simple navigation, TOML-based configuration, and direct deployment on Cloudflare Pages.

Of course, I could have written all of this by myself. But I probably would have stopped at some small detail, such as i18n alternates, RSS, date consistency validation, or Cloudflare build settings. This is where AI became useful. It did not decide what my blog should be. It quickly turned the ideas I had already described into a working system.

I made the decisions, and it built the structure. I made the trade-offs, and it handled the details. I reviewed the result, and it fixed the problems.

This is a new way of writing code for me.

Now this blog has complete bilingual routes. English is under `/en/`, and Chinese is under `/zh/`. The post list, post pages, About page, and RSS are all split by language. The home page keeps a Profile style. Post excerpts are long enough to feel close to two lines, instead of being so short that the page looks empty. The language switcher is just a simple select box. It does not explain too much and does not take too much space. Cloudflare Pages has also been migrated to v3. The build command is simply `pnpm build`, and the output directory is `dist`.

These things may look like configuration and pages, but when they are combined together, I finally feel that this blog is back in my hands.

In the past, I thought the theme was very important. A good theme could make a blog beautiful very quickly, and it could save me from dealing with many details. But now I care more about malleability. I want to change the home page whenever I want, adjust language logic whenever I want, change the post list whenever I want, and turn an idea into a page whenever I want.

Astro gives me this sense of control. AI makes it much faster to turn that sense of control into reality.

This does not mean Hugo is bad. Hugo is still good. It is fast, stable, and elegant. If I only wanted to write posts and did not want to touch the page structure, it would still be a great choice. But what I want now is not just a blog theme. I want a personal tool that I can keep shaping.

This migration made me regain control of my blog.

I did not just change a framework. I took back the shape of my blog.
