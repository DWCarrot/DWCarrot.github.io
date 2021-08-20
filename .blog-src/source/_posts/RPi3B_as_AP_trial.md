---
title: 树莓派3B做无线热点(1)
tags:
  - rpi
  - network
categories:
  - Coding
date: 2021-01-30 01:15:03
---

笔记本的RJ45网卡接口坏了，而主路由器是个超老的TPLink，功率不足造成联网经常会断开/处于信号不稳定状态——就是看b站480p都会卡的这种。于是看向这个吃灰多年的树莓派3B+，打算将其改造成无线热点。

网上关于树莓派做AP的资料有不少。最"方便"的方法是使用[RaspAP](https://raspap.com)，具有仿路由器的控制界面和一键配置功能；然而安装脚本在国内是不能使用的。

于是决定采用单纯`hostapd`+`dnsmasq`+`iptables`的方法（RaspAP的核心也是这个不过配置了服务器及php脚本进行控制）

### 环境

树莓派3B+ ，操作系统为RPi-OS，Debian-10(buster)的变种，预先装好系统并开启了ssh；配置apt源为清华源。

主要参考资料为官方[Setting up a Raspberry Pi as a routed wireless access point](https://www.raspberrypi.org/documentation/configuration/wireless/access-point-routed.md)，不过没有完全按着做；*吐个槽 中文资料几乎都没什么用*

### 结构

```
                                         +- RPi -------+
                                     +---+ 192.168.1.104          +- Laptop ----+
                                     |   |     WLAN AP +-)))  (((-+ WLAN Client |
                                     |   | 192.168.4.1 |          | 192.168.4.2 |
                                     |   +-------------+          +-------------+
                 +- Router ----+     |
                 | Firewall    |     |   +- DEVICE#2 --+
(Internet)---WAN-+ DHCP server +-LAN-+---+ 192.168.1.103
                 | 192.168.1.1 |     |   +-------------+
                 +-------------+     |
                                     |   +- DEVICE#3 --+
                                     +---+ 192.168.1.102
                                         +-------------+
```

### 操作

1. 安装配置hostapd

   hostapd 是能使无线网卡工作在软AP（Access Point）模式的核心软件；

   首先通过apt安装：

   ```shell
   sudo apt-get install hostapd
   ```

   不过安装完成时如果查看hostapd的状态
   ```shell
   sudo service hostapd status
   ```
   会显示失败的日志，原因是masked。因此需要激活一下：

   ```shell
   sudo systemctl unmask hostapd
   sudo systemctl enable hostapd
   ```

   此时安装完成。

   接下来就是配置热点参数了。打开配置文件

   ```shell
   sudo nano /etc/hostapd/hostapd.conf
   ```

    加入

   ```shell
   country_code=CN

   # This is the name of the WiFi interface we configured above
   interface=wlan0

   # Use the nl80211 driver with the brcmfmac driver
   driver=nl80211

   # This is the name of the network
   ssid=<name>

   # Use the 2.4GHz band
   hw_mode=g

   # Use channel auto
   channel=11

   # Enable 802.11n
   ieee80211n=1

   # Enable WMM
   wmm_enabled=1

   # Enable 40MHz channels with 20ns guard interval
   ht_capab=[HT40][SHORT-GI-20][DSSS_CCK-40]

   # Accept all MAC addresses
   macaddr_acl=0

   # Use WPA authentication
   auth_algs=1

   # Require clients to know the network name
   ignore_broadcast_ssid=0

   # Use WPA2
   wpa=2

   # Use a pre-shared key
   wpa_key_mgmt=WPA-PSK

   # The network passphrase
   wpa_passphrase=<password>

   # Use AES, instead of TKIP
   rsn_pairwise=CCMP
   ```

   hw_mode理论上可选`g`(2.4GHz)、`a`(5GHz)。不过这个树莓派上似乎不支持5GHz；

   channel是个与模式有关的量。可以使用`iw reg get`获取频带信息，或者[wiki](https://en.wikipedia.org/wiki/List_of_WLAN_channels)搜频道表。但是实际上好像某些看上去可以的频道最后无法使用。我这里最后使用了11频道。

   使用`sudo hostapd /etc/hostapd/hostapd.conf` 可以试运行并检查配置。

2. 修改路由

   ```shell
   sudo nano /etc/sysctl.d/routed-ap.conf
   ```

   将文件内容修改为

   ```shell
   # https://www.raspberrypi.org/documentation/configuration/wireless/access-point-routed.md
   # Enable IPv4 routing
   net.ipv4.ip_forward=1
   ```
   另一方面，修改路由规则：

   ```shell
   sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
   ```

   不过使用该指令只能在本次开机以内使用这个规则，一旦重启又没了。
   因此我安装了iptables-persistent来保存规则。

   ```shell
   sudo apt-get install iptables-persistent
   ```
   安装后会自动保存路由规则并在开机时自动加载。

3. 安装配置DHCP and DNS 服务

   主要使用dnsmasq

   ```shell
   sudo apt install dnsmasq
   ```

   配置DHCP：

   ```shell
   sudo nano /etc/dhcpcd.conf
   ```

   在末尾追加

   ```shell
   interface wlan0
       static ip_address=192.168.4.1/24
       nohook wpa_supplicant
   ```

   wlan0是树莓派的无线网卡接口。

   中间的静态ip我理解是树莓派的AP热点子网的网关地址（树莓派自身）。而树莓派在主路由器子网中也有一个地址，可以通过查看路由器DHCP表得到。使用了不同的网段使得主路由器本身也可以（在wifi中）被访问到，且树莓派的内外ip均可以使用ssh访问。

   然后修改：

   ```shell
   sudo cp /etc/dnsmasq.conf /etc/dnsmasq.conf.bak
   sudo nano /etc/dnsmasq.conf
   ```

   在文件中加入

   ```shell
   interface=wlan0 # Listening interface
   dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
                   # Pool of IP addresses served via DHCP
   domain=wlan     # Local wireless DNS domain
   address=/gw.wlan/192.168.4.1
                   # Alias for this router
   ```

   这配置了树莓派在192.168.4.2 到 192.168.4.20分配ip，保留时间24h

   同时给网关一个“域名” gw.wlan

4. 重启设备



这样大概就完成了。

### 测试

速度测试：download - 30M。

延迟测试：（玩了一局wows）延迟由38ms上涨至42ms-50ms跳变

还能用吧……

### TODO

1. 更好的路由规则和防火墙规则；
2. 更好的dns规则；
3. 把clash应用上去(?)
4. 想办法读出状态数据并显示在网页上。