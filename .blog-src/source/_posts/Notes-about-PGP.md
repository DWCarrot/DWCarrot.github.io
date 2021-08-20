---
title: 数字签名、加密和PGP简单学习笔记
tags:
  - encrypt
  - digital-sign
  - pgp
categories:
  - Coding
date: 2021-08-20 19:21:41
---

参加[开放工具人大赛](https://bbs.nyaa.cat/d/1881-openmprdb) 里面用到 OpenPGP 标准下的的密钥管理和数字签名功能；因为打算用Rust进行开发（并且开发环境是Windows系统下的）不能直接调用GnuPG 工具， 选用了sequoia-pgp 作为OpenPGP库使用；于是对数字签名、加密、PGP文件格式等简单地覆盖性地学习了一下 ~~（啊居然我一开始啥都不懂就敢接这个）~~ ，考虑到这也算计算机安全基础，记一些笔记以备以后有用到。

【因为懒，大概会粘（和引用）很多别的地方的文档】

## 加密与加密算法

加密主要是一种存在逆映射的映射算法，主要区分对称加密和非对称加密。

### 对称加密

> 1976年以前，所有的加密方法都是同一种模式：
>
> （1）发送方选择某一种加密规则，对信息进行加密；
>
> （2）接收方使用同一种规则，对信息进行解密。
>
> 由于加密和解密使用同样规则（简称"密钥"），这被称为["对称加密算法"](https://zh.wikipedia.org/zh-cn/%E5%AF%B9%E7%AD%89%E5%8A%A0%E5%AF%86)（Symmetric-key algorithm）。
>
> 这种加密模式有一个最大弱点：发送方必须把加密规则告诉接收方，否则无法解密。保存和传递密钥，就成了最头疼的问题。
>

常用的对称加密算法主要有AES，DES等等。因为涉及了唯一的密钥交换，是很难用于公开应用例如数字签名的。因此没有深入下去。

### 非对称加密

> 1976年，两位美国计算机学家Whitfield Diffie 和 Martin Hellman，提出了一种崭新构思，可以在不直接传递密钥的情况下，完成解密。这被称为["Diffie-Hellman密钥交换算法"](https://en.wikipedia.org/wiki/Diffie%E2%80%93Hellman_key_exchange)。这个算法启发了其他科学家。人们认识到，加密和解密可以使用不同的规则，只要这两种规则之间存在某种对应关系即可，这样就避免了直接传递密钥。
>
> 这种新的加密模式被称为"非对称加密算法"。
>
> （1）接收方生成两把密钥（公钥和私钥）。公钥是公开的，任何人都可以获得，私钥则是保密的。
>
> （2）发送方获取接收方的公钥，然后用它对信息加密。
>
> （3）接收方得到加密后的信息，用私钥解密。
>
> 如果公钥加密的信息只有私钥解得开，那么只要私钥不泄漏，通信就是安全的。

常用的非对称加密算法主要有RSA、椭圆函数加密算法等。

#### RSA

RSA是利用质数、质数积、欧拉函数和同余等数论理论，以“两个大质数的乘积很难（不能在多项式时间复杂度下）被拆解”作为安全性保证的一种加密算法。

_虽然原文写“很简单的数学知识”但是本人愚钝看了三遍证明愣是没看懂……就记一下流程_

密钥生成：

1. 选择两个互质的整数 $p$ ，$q$；

2. 计算乘积 $n=p \times q$；其长度（bit）为密钥长度；

3. 计算欧拉函数$\phi (n) = (p-1)(q-1)$；

   > 任意给定正整数n，请问在小于等于n的正整数之中，有多少个与n构成互质关系？计算这个值的方法就叫做[欧拉函数](https://zh.wikipedia.org/wiki/%E6%AC%A7%E6%8B%89%E5%87%BD%E6%95%B0)，以$\phi(n)$表示。
   >
   > 两个互质的整数 $p$ ，$q$和他们的积 $n=p \times q$，满足$\phi (n) =\phi (p) \times \phi (q)$

4. 在$(1, \phi(n))$内随机选取一个与 $\phi(n)$ 互质的整数$e$ ；

5. 计算$e$ 对$\phi(n)$ 的模反元素$d$，即找正整数$d$ 使得 $e \times d \equiv 1 (mod \phi (n))$

6. 将$n$和$e$封装成公钥，$n$和$d$封装成私钥。

公钥加密：

7. 对于消息$m$生成密文$c$:

   $$m^e\equiv c (mod n)$$

私钥解密：

8. 对于密文$c$ 解码为消息$m$:

   $$c^d\equiv m (mod n)$$ 

## 数字签名

数字签名并不对消息进行加密。即，消息文本是公开的，仅仅生成签名信息以表面**消息发出者持有私钥**；消息签名是对消息进行Hash后的摘要进行加密、解密操作。

签名：

1. 生成消息的Hash值；

2. 对Hash用私钥“加密”；

   对于RSA，计算摘要$h$的签名$\sigma \equiv h^d (mod n)$ 

3. 将消息本身和签名合并。

验证：

4. 读取签名消息，分解消息和签名

5. 计算消息Hash摘要

6. 对签名用公钥“解密”；

   对于RSA，验证$\sigma ^e \equiv h (mod n)$ 

> One digital signature scheme (of many) is based on [RSA](https://en.wikipedia.org/wiki/RSA_(algorithm)). To create signature keys, generate an RSA key pair containing a modulus, *N*, that is the product of two random secret distinct large primes, along with integers, *e* and *d*, such that *e* *d* [≡](https://en.wikipedia.org/wiki/Modular_arithmetic) 1 (mod *φ*(*N*)), where *φ* is the [Euler's totient function](https://en.wikipedia.org/wiki/Euler%27s_totient_function). The signer's public key consists of *N* and *e*, and the signer's secret key contains *d*.
>
> To sign a message, *m*, the signer computes a signature, *σ*, such that *σ* ≡  *m**d* (mod *N*). To verify, the receiver checks that *σ**e* ≡ *m* (mod *N*).

## OpenPGP 协议

> - PGP：由Phil Zimmermann开发，最终被赛门铁克收购，是一个商业软件，需要付费。
> - OpenPGP：一种协议，定义了加密消息、签名、私钥和用于交换公钥的证书统一标准。
> - GPG（GnuPG）：符合OpenPGP标准的开源加密软件，PGP的开源实现。

参照[rfc4880](https://datatracker.ietf.org/doc/html/rfc4880#section-3.1) 和 [sequoia-pgp](https://sequoia-pgp.org/)

1. 公钥(Public Key)，私钥（密钥）(Secret Key)构成密钥对；

2. Key ID：Key的标识符

   >  A Key ID is an eight-octet scalar that identifies a key. 
   >  Implementations SHOULD NOT assume that Key IDs are unique. 
   >

3. Fingerprint : A long identifier for certificates and keys;
   > Essentially, a v4 fingerprint is a SHA-1 hash over the key's public key packet.
   >

4. 输出格式：Binary & Forming ASCII Armor
   二进制格式 和 Armor格式（类似base64的文本）

5. Public-Key Packet & Secret-Key Packet
   Secret-Key Packet 包含 Public-Key Packet的全部信息；
   子密钥包含主密钥信息
   > A Secret-Key packet contains all the information that is found in a Public-Key packet, including the public-key material, but also includes the secret-key material after all the public-key fields.
   > A Secret-Subkey packet (tag 7) is the subkey analog of the Secret Key packet and has exactly the same format.
   > A Public-Key packet starts a series of packets that forms an OpenPGP key (sometimes called an OpenPGP certificate).
   > A Public-Subkey packet (tag 14) has exactly the same format as a Public-Key packet, but denotes a subkey.  One or more subkeys may be associated with a top-level key.  By convention, the top-level key provides signature services, and the subkeys provide encryption services.
   >

### sequoia-pgp

   注意在sequoia-pgp中，`<Cert as Serialize>::serialize`输出Public-Key Packet；`Cert::as_tsk -> serialize`输出Private-Key Packet
   > Any key in a certificate may include secret key material. To protect secret key material from being leaked, secret keys are not written out when a Cert is serialized. To also serialize secret key material, you need to serialize the object returned by Cert::as_tsk().
   >


   


