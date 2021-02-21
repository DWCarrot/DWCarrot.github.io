---
title: Rust交叉编译环境配置
tags:
  - rpi
  - rust
categories:
  - Coding
date: 2021-02-20 01:00:48
---

*其实本来是打算在树莓派上安装bitwarden_rs的……不过最后编译还是失败了。于是记录一下交叉编译环境的配置~~水一篇~~*

Rust编译过于吃资源，在树莓派上直接编译rust有点不现实。于是打算配置下交叉编译环境。

## 配置查询

执行

```shell
uname -m
```
输出对应架构。手头这块是`armv7l`，听说RPi4是`aarch64`？

然后宿主机选择wsl。虽然交叉编译工具有windows版的，但是试了一下似乎是不能用；又没有其他的linux系统的设备，于是就这样了。

##安装基础Rust环境

首先，是wsl安装rust环境。这个[在官网上有](https://www.rust-lang.org/learn/get-started)。

不过wsl在安装 nightly-toolchain的时候出了一点问题 ：

```shell
failed to install component: 'rust-docs-x86_64-unknown-linux-gnu', detected conflict: '"share/doc/rust/html/std/keyword.self.html"'
```
 [查了半天解决方案](https://github.com/rust-lang/rust/issues/75833)，最后使用
```shell
rustup set profile minimal
```
后面得改过来就是了。

## 安装交叉编译工具链

```shell
rustup target add --toolchain <toolchain> armv7-unknown-linux-gnueabihf`
```
为对应<toolchain>工具链添加目标。
这还没完，由于 Rust 使用了系统提供的连接器，还需要下载交叉编译工具。

可以使用
```shell
sudo apt-get install gcc-arm-linux-gnueabihf
```
不过我是去https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-a/downloads 下载了对应的arm-none-linux-gnueabihf解压使用的。注意要设置到其下`bin/`的环境变量。

## 交叉编译

在项目根目录创建 .cargo 目，并在其中创建名为 config.toml 的文件，写入：
```toml
[target.armv7-unknown-linux-gnueabihf]
linker = "arm-none-linux-gnueabihf-gcc"
```

然后执行
```shell
cargo build --target armv7-unknown-linux-gnueabihf
```

*这个是别的地方看到的，也许以后有用*
```toml
[target.aarch64-unknown-linux-gnueabihf]
linker = "aarch64-unknown-linux-gnu"
rustflags = ["-C", "target-feature=+crt-static", "-C", "link-arg=-lgcc"]
```


