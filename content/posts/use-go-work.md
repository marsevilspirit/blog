+++
date = '2025-06-10T00:12:57+08:00'
draft = false
title = 'Use Go Work to Manage Multiple Project Modules'

+++

In Go programming, there are times when we need to work across modules, which can get quite complicated. To use the latest local dependencies, we need to utilize the `replace` statement. It's crucial to be vigilant and avoid committing the `replace` statements to the remote repository, but occasionally it slips our minds, which can lead to some frustrating situations.

I used to envy Rust for having the concept of workspaces for cross-module development. Recently, I discovered that Go also has a similar concept! By using the `go work` command, you can create a workspace that allows multiple modules to share dependencies without needing to use `replace` statements. It’s absolutely fantastic!

#### how to use  go work

Let's start by assuming we have the following modules:

```shell
.
├── main
├── pkg1
└── pkg2
```

The main module is our application, while pkg1 and pkg2 are the modules that main uses. Now, let's set up a workspace:

```sh
$ go work init main pkg1 pkg2
```

If it has already been initialized, then execute:

```sh
$ go work use [-r] [main pkg1 pkg2 ...]
```

If these modules have other external dependencies or if there are any changes, then execute:

```sh
$ go work sync 
```



After execution, a file named `go.work` will be generated:

```go
go 1.24.4

use (
	./main
	./pkg1
	./pkg2
)
```

If these modules have external dependencies, a file named `go.work.sum` will also be generated.



After that, you can call the local `pkg1` and `pkg2` modules without using the replace statement. This really makes many things very convenient. I am very grateful for everything that the Go team has done, this work has made the Go language better.



#### the replace in go work

Interestingly, there's also a replace statement in Go work, and it looks like this:

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

I personally feel that just using `use` would suffice. I haven't used the replace statement in `go.work`, so there might be some special use cases for it that I'm not aware of.
