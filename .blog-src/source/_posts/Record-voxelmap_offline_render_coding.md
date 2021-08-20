---
title: '[补档]voxelmap离线渲染器'
tags: 
  - minecraft
  - rust
categories: 
  - Coding
date: 2021-02-10 10:15:03
---

> voxelmap算是比较流行的小地图mod了~~以及另外一件事是journeymap咕得跟鹅叔一样~~，每次使用时会在本地留下缓存（而不是像journeymap一样直接保留图片）；因此写了一个工具把缓存文件渲染成图片；
>
> *其实voxelmap自带实时渲染功能，在voxelmap.properties中加入项Output Images:true即可，不过代价是fps降到1*
> voxelmap缓存 指存放在`.minecraft\voxelmap\cache\<server>\<world>\<dimension>`(1.16及以后) 下的一系列文件，文件名均为`<x>,<z>.zip`
>

事情的起因大约就是这样。

然而这个项目从2019年1月开始开发，中间从思路、编程语言到模组本身和参考资料都发生了巨大的变化。在整个过程中，我也学会了如何获取和读懂java反编译代码，实践了Rust语言的很多特性。于是决定补个档，记录一下自己的思路和探索过程。

## voxelmap cache 格式 & 探索

voxelmap是非开源的，搜了一遍只发现了[有个人在跟我做一样的事情](https://github.com/Gjum/voxelmap-cache/blob/master/voxelmap-cache-format.md) *才发现他也是用的Rust哈哈哈哈*。

> one .zip per region with a file named `data`
>
> 17 byte per column:
>

然后看看文件大小：1,179,648 字节 $1179648=256\times256\times18$
噔噔咚

不过后来想到之前听说mojang更新了生物群系，考虑考虑+对比了下二进制觉得是生物群系部分多了一个字节，试验了下也如此。于是就先这么用着。

#### Minecraft 1.16 分割线

然后它就[坏了](https://github.com/DWCarrot/voxelmap-cache-render/issues/1) 。检查大致定位到cache格式改变，这回不能靠猜了。于是打算使用反编译找到对应的格式。

反编译工具使用[JD-GUI](http://java-decompiler.github.io/)，反编译整个包为一个工程后用vscode打开。*震惊，voxelmap编译的时候是把局部变量名表编译进去的。*

注意到voxelmap-cache的压缩包内多了一个文件`control`。因此想到源文件中一定会有读取该文件的代码，考虑路径字符串一般是原始的，于是搜索`"control"`，果然找到了加载函数

```java
/* CachedRegion.java */
/*      */   private void loadCachedData() {
/*      */     try {
/*  728 */       File cachedRegionFileDir = new File((class_310.method_1551()).field_1697, "/voxelmap/cache/" + this.worldNamePathPart + "/" + this.subworldNamePathPart + this.dimensionNamePathPart);
/*  729 */       cachedRegionFileDir.mkdirs();
  ...
/*  776 */         if (total == this.data.getWidth() * this.data.getHeight() * 18 && hashBiMap != null) {
/*  777 */           byteData = new byte[this.data.getWidth() * this.data.getHeight() * 18];
/*  778 */           System.arraycopy(decompressedByteData, 0, byteData, 0, byteData.length);
/*  779 */           this.data.setData(byteData, (BiMap<class_2680, Integer>)hashBiMap, version);
/*  780 */           this.empty = false;
/*  781 */           this.dataUpdated = true;
/*      */         } else {
  ...
```

于是发现数据读出后保存在`this.data`中。查找定义：

```java
/* 106   */   private CompressibleMapData data;
```

定位`CompressibleMapData`类。果然文件的格式读写在此处。

最终整理如下：

```markdown
size: 256 x 256

channel: 18byte

format:
- version = 1:  Matrix height x width x channel
- version = 2:  Matrix channel x height x width

channel-format:
- <layer> surface layer [0..4] 
- <layer> seafloor(oceanfloor) layer [4..8]
- <layer> transparent layer [8..12]
- <layer> foliage layer [12..16]
- <uint16 big-endian> biome [16..18]

layer-format
- <uint8> height
- <uint16 big-endian> blockstate id : refer to `key`
- <union uint4,uint4> sky light & block light
```

## 渲染颜色表的生成

先说下渲染：

同样是反编译操作查看了渲染的流程，大概是：

1. 检查是否`surface`为空（高度为0），是则设置为空并退出；
2. 计算`surface`颜色为基础色；
3. 分别计算`seafloor`、`transparent`、`foliage`颜色，并与基础色进行alpha-blend

而各个层计算颜色基本上是方块表面颜色平均+生物群系颜色调整+光照调整。

于是想到生成一张颜色表。

Minecraft的方块模型渲染格式在[wiki上有写](https://minecraft.gamepedia.com/Model)；但是考虑到`multiparts`的排列组合，如果直接针对每一个block-state进行渲染恐怕颜色表的大小就是个天文数字了。

所以又重新思考了一下颜色获取：每个像素点获取的颜色是方块上表面合成图的单取样。这个单取样实际实现就是做平均。那么，`multiparts`每个部分给平均像素可以吗？并不能，因为还缺少信息。最后引入了权重来解决这个问题，像素颜色使用各个`multiparts`组分的加权平均。

颜色表生成最后拿python写了，方便些。

## Rust实践

其实最开始写渲染器拿的是c++……结果嘛：

“实现了生物群系颜色渲染功能，测试一下“
Debug模式：一切正常
Release -O1：怎么图全黑了？
Release -O2: segment fault

Pia!(ｏ ‵-′)ノ”(ノ﹏<。)

算了，c++这种东西不是我等菜鸡可以驾驭的。

但是这个玩意又对性能有一定的要求。后来看到依云大大在尝试Rust，好奇学了一下（emm一年），感觉还不错，就用在这个应用上了。

*hmm忽然不知道这部分写啥……那算了*

```rust
pub fn view<'a>(&'a self) -> Box<dyn View<'a, EN=ElementNode<'a>, LN=LayerNode<'a>> + 'a> {
```

遇到的最大的坑大概是这个……Box内trait object的本身生命周期和它内部类型的生命周期。

然后就是，有了rust的帮助，很容易就能实现多线程渲染（针对多个tile）。这边考虑方便起见，没有使用任务队列等经典结构，而是在扫描文件时直接就把任务分配好，直接送入对应线程。

后面又加入了tile-map生成功能等。

## TODO

-[ ] 其实想按最标准的流程，从烘培模型开始渲染；
-[ ] 能不能实现直接从mc-chunk文件进行渲染呢？
-[ ] 话说1.17更新世界高度这东西要没了吧……要命.jpg

----

最后丢一张图

{% asset_img hitech.png 喵窝科技特区vm卫星图 %}