---
title: Hexo-blog 折腾 & 试水-(1)
date: 2020-12-19 00:01:38
tags: 
- hexo
- hello-world
categories: 
- Coding
---



第二次尝试使用hexo搭建静态博客了。。。

## 安装环境

那么第一次问题是啥呢？装了一般网络问题导致 npm 依赖错误然后一通操作彻底GG。于是这次首先解决这个问题：

首先查看 npm 源地址和下载下来的cache和全局module安装路径

```
> npm config list
metrics-registry = "▮▮▮▮▮"
scope = ""
user-agent = "npm/6.14.9 node/v14.15.3 win32 x64"

; userconfig C:\Users\▮▮▮\.npmrc
cache = "▮▮▮\\npm_cache"
prefix = "▮▮▮\\npm_modules"
registry = "https://registry.npm.taobao.org/"
```

修改cache和全局module安装路径

```
> npm config set prefix "▮▮▮\\npm_modules"
> npm config set cache "▮▮▮\\npm_cache" 
```

使用淘宝镜像

```
> npm set registry https://registry.npm.taobao.org/
```

安装完hexo-cli后[^1] ，程序入口是在`prefix`里面的。

## 项目结构和blog构建

{% blockquote %}

设置 Git，然后在 GitHub 上创建两个 repo。一个 Public repo 用作 GitHub Pages，一个 Private repo 用作存储 Hexo。
将 Private repo clone 到本地。

{% endblockquote %}

一般来说给的教程[^2]是这样的……不过我似乎没法这样用：
1. 暂时不考虑源文本的隐私性 ~~（毕竟我这玩意谁会看啊）~~ 
2. 个人github.io除了用于展示blog还作为一个简单的图片站（for bbs.nyaa.cat）以及一些自己写的工具性网页，不能直接挂载在根目录下。


于是采用了诡异的操作：在项目文件下建立`.blog-src/`文件夹储存hexo工程，重定向工程输出到`blog/`；写自动跳转`index.html`从`https://dwcarrot.github.io/`自动跳转至`https://dwcarrot.github.io/blog`

具体来说：修改`_config.yml`

```
# URL
## If your site is put in a subdirectory, set url as 'http://example.com/child' and root as '/child/'
url: https://dwcarrot.github.io/blog
root: /blog/

# Directory
public_dir: ../blog

# Writing
post_asset_folder: true
```

第三条用于添加图片。

__Tips:__ 发现 git 项目下子文件夹`.gitignore`可以对子文件夹下的文件修改做过滤


## TODO

- [ ] 图片添加方法
- [ ] 迁移以前（裸markdown 文件时期）写的内容
- [ ] 恢复`pic-host/`简单图片站；【是的，现在我在喵毛论坛的图片都挂了】
- [ ] 恢复`pages/` 小工具网页
- [ ] 找一个好看的主题theme

[^1]: https://hexo.io/docs/

[^2]: https://timeout.moe/archives/145/

 