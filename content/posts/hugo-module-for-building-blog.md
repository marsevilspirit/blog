+++
date = '2025-05-14T23:50:10+08:00'
draft = false
title = 'Hugo Module for Building Blog'

+++

I think using Hugo modules is the best way to create a personal blog. Some people believe that Hugo modules are better for websites with many dependencies, but I think even just using Hugo modules for the theme is the best choice.

My previous blog was built with Hexo, and I had a good experience with it. Writing themes felt the same as with Hugo. The main reason I chose Hugo is that it is written in Go language, while Hexo is written in TypeScript. I am good at Go, so I find Hugo more comfortable to work with, which is why I switched to it.

After switching to Hugo, I discovered more advantages. The speed of Hexo is okay; it takes a few seconds to start up, but Hugo is incredibly fast, only a few milliseconds. It really surprised me! One feature that makes me continue to use Hugo is the Hugo module. It allows the separation of blog posts and themes, truly achieving a separation between content and code. This design pattern is simply art!

I no longer need to create a theme directory in my blog folder. I can just focus on the content of my articles. The commands for Hugo modules are just like Go modules, which makes it very comfortable to use. The version control is excellent, and compared to npm, which I’m not very familiar with, it’s almost unbeatable!

My current blog uses a theme I created called [Magellanic](https://github.com/marsevilspirit/magellanic), and my [blog](https://github.com/marsevilspirit/blog) is built with it. If you check it out, you’ll see that Magellanic contains only code, while the blog only has articles. This separation is beautiful to me! I deployed it using Cloudflare Pages. Using Cloudflare Pages was another great decision. The deployment environment is very smart; it has a built-in Go environment and great support for HTTP/3 (I am a loyal supporter of HTTP/3). I hardly need to configure anything because Cloudflare handles everything for me. They really have done an incredible job!

To sum it up, I believe that Hugo modules are the best choice for building a blog, without a doubt.