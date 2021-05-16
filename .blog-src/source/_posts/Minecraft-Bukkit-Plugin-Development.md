---
title: Minecraft Bukkit 插件开发笔记
tags:
  - minecraft
  - java
  - debug 
categories:
  - Coding
date: 2021-05-14 11:28:21
---

# Minecraft Bukkit 插件开发笔记

接了NyaaCat/PlayerTimeTracker的活(顺便练练java工程开发)，然后发现软件工具都不怎么会用，调试环境搭建也花了不少时间。因此记录一下相关的过程。

*着重点并不是bukkit插件怎么开发

## idea下gradle项目编译打包 & 调试环境搭建

1. 编译打包bukkit插件

  gradle项目构建由项目下build.gradle文件描述。需要利用idea的gradle插件进行启动编译与打包。

  `View -> Tools Window -> Gradle`打开自带的gradle插件。

  {% asset_img idea-ops1.jpg idea-gradle插件ui %}

  __Tasks__ 展开到最后一级双击可执行任务。在这个插件的开发中用到打包是 __publish__ 。

2. 调试环境搭建

   1. 搭建服务器：部署一个bukkit服务器。这里用的paper-1.16.4；

   2. 复制编译完成的插件到plugin文件夹下；为了方便这里在build.gradle中添加一条拷贝任务：

      ```groovy
      task copyToDebug(type: Copy) {
          from "build/libs"
          into project.getProperties().get("target")
          exclude("*-javadoc.jar", "*-sources.jar")
      }
      ```

      这里利用了命令行参数制定拷贝目标文件夹。`project.getProperties()`获取gradle命令行参数后`-Pkey=value`的属性。这个插件开发中实际添加的命令行参数为`-Ptarget=<server-root>/plugins`；

   3. 调试任务：Jar Application

      `Run -> Edit Configurations`选择`Jar Application` ，填写目标是服务器的 `<server>.jar`，注意把Working Directory改到服务器根目录下。这样当对这个`Jar Application`Task 进行调试启动，实际上就是调试编写的插件了。

3. 杂项

   1) 整个项目都必须连接外网。在idea中`File -> Settings -> Http Proxy`设置代理即可。

   2) mojang认证服务器有时也难连接上，可能需要对整个测试服务器设置代理。采用的方法是JVM参数`-Dhttp.proxyHost= -Dhttp.proxyPort=` 和`-Dhttps.proxyHost= -Dhttps.proxyPort=` 。



## 插件开发相关

### 关于数据库与查询结构

WIP

### 异步

WIP

### 动态加载依赖
