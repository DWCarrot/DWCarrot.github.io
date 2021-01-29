---
title: 补档-voxelmap离线渲染器
tags:
- rust
- minecraft
categories: 
- Coding
---

# 写的一个voxelmap离线渲染器

> voxelmap算是比较流行的小地图mod了~~以及另外一件事是journeymap咕得跟鹅叔一样~~，每次使用时会在本地留下缓存（而不是像journeymap一样直接保留图片）；因此写了一个工具把缓存文件渲染成图片；
>
> *其实voxelmap自带实时渲染功能，在voxelmap.properties中加入项Output Images:true即可，不过代价是fps降到1*
> voxelmap缓存 指存放在`.minecraft\voxelmap\cache\<server>\<world>\<dimension>`(1.16及以后) 下的一系列文件，文件名均为`<x>,<z>.zip`
>

事情的起因大约就是这样。

然而这个项目从2019年1月开始开发，中间从思路、编程语言到模组本身和参考资料都发生了巨大的变化。在整个过程中，我也学会了如何获取和读懂java反编译代码，实践了Rust语言的很多特性。于是决定补个档，记录一下自己的思路和探索过程。

## voxelmap cache 格式 & 探索

## 渲染颜色表的生成

## Rust实践




