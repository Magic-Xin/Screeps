# Screeps 个人代码归档V1.0

## 适合新房间开荒

### Creeps分配：

<b>harvester x3</b> 负责采矿及运输，保证生产线不会亏空

<b>upgrader x3</b> 负责采矿升级controller，并在科技快速上升的同时不与harvester发生冲突

<b>builder x2(按需)</b> 负责采矿进行建筑建造

### 特色：

1. 在spawning时将各个工种的sourceID写入creeps memory，在moudle中调用分配一二号矿

    不仅避免同一矿区creeps数量过多，也方便在失控时手动修改操作

2. 按需调配spawning优先级、是否spawn builder

3. 调配Tower职能及优先级