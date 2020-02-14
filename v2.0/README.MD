# Screeps 个人代码归档V2.0

## 从多线程到多进程

### 对比V1.0:

1. 细分creeps职能

    减少harvester数量，避免道路堵塞

    增加新职业transfer，负责从container中搬运Energy

2. 充分利用Extension，对于各个职能的creeps都给予部件加强，使creeps数量减少的同时增加工作效率

3. 有效降低CPU的使用，从之前的平均 4 CPU、峰值 5 CPU，降低至几乎全程 3 CPU

### 工作链

1. 一号矿：

    harvester采矿，Energy自动进入container

    htransfer在container取得Energy，再依次存入Spawn、Extension和Tower

2. 二号矿：

    uharvester采矿，Energy自动进入container

    utransfer在container取得Energy，再存入Controller旁的Energy

    builder在container取得Energy，进行建造和维修作业（按需）

3. Controller

    upgrader在container取得Energy，再进行updrade

