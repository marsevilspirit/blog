+++
date = '2025-06-10T00:12:57+08:00'
draft = false
title = '使用 Go Work 管理多个项目模块'
+++

在 Go 编程中，有时我们需要跨模块工作，这可能会变得相当复杂。为了使用最新的本地依赖项，我们需要使用 `replace` 语句。必须时刻保持警惕，避免将 `replace` 语句提交到远程仓库，但有时我们也会忘记，这会导致一些令人沮丧的情况。

我曾经羡慕 Rust 有 workspace 的概念来进行跨模块开发。最近，我发现 Go 也有类似的概念！通过使用 `go work` 命令，你可以创建一个 workspace，允许还要多个模块共享依赖项，而无需使用 `replace` 语句。这简直太棒了！

#### 如何使用 go work

假设我们要有以下模块：

```sh
.
├── main
├── pkg1
└── pkg2
```

main 模块是我们的应用程序，而 pkg1 和 pkg2 是 main 使用的模块。现在，让我们设置一个 workspace：

```sh
$ go work init main pkg1 pkg2
```

如果已经初始化，则执行：

```sh
$ go work use [-r] [main pkg1 pkg2 ...]
```

如果这些模块有其他外部依赖项或有任何更改，则执行：

```sh
$ go work sync 
```

执行后，将生成一个名为 `go.work` 的文件：

```go
go 1.24.4

use (
	./main
	./pkg1
	./pkg2
)
```

如果这些模块有外部依赖项，还会生成一个名为 `go.work.sum` 的文件。

之后，你就可以调用本地的 `pkg1` 和 `pkg2` 模块，而无需使用 replace 语句。这真的让很多事情变得非常方便。我非常感谢 Go 团队所做的一切，这项工作让 Go 语言变得更好。

#### go work 中的 replace

有趣的是，Go work 中也有 replace 语句，它看起来像这样：

```go
go 1.24.4

use (
	./main
	./pkg1
	./pkg2
)

replace ( 
  github.com/marsevilspirit/example => ./example
)
```

我个人觉得只用 `use` 就足够了。我还没在 `go.work` 中用过 replace 语句，可能有一些我不知道的特殊用例吧。
