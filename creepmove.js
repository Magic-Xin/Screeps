/*
creep对穿+跨房间寻路+寻路缓存 
跑的比香港记者还快从你做起
应用此模块会导致creep.moveTo可选参数中这些项失效：reusePath、serializeMemory、noPathFinding、ignore、avoid、serialize
保留creep.moveTo中其他全部可选参数如visualizePathStyle、range、ignoreDestructibleStructures、ignoreCreeps、ignoreRoad等
新增creep.moveTo中可选参数ignoreSwamps，会无视swamp与road的移动力损耗差异，一律与plain相同处理，用于方便pc和眼，默认false
例：creep.moveTo(controller, {ignoreSwamps: true});
新增creep.moveTo中可选参数bypassHostileCreeps，被creep挡路时若此项为true则绕过别人的creep，默认为true，设为false用于近战攻击
例：creep.moveTo(controller, {bypassHostileCreeps: false});
新增creep.moveTo中可选参数bypassRange，被creep挡路准备绕路时的绕路半径，默认为5
例：creep.moveTo(controller, {bypassRange: 10});
新增creep.moveTo中可选参数noPathDelay，寻得的路是不完全路径时的再次寻路延迟，默认为10
例：creep.moveTo(controller, {noPathDelay: 5});
新增返回值ERR_INVALID_ARGS，表示range或者bypassRange类型错误

遇到己方creep自动进行对穿，遇到自己设置了不想被对穿的creep（或bypassHostileCreeps设为true时遇到他人creep）会自动绕过
会将新手墙和部署中的invaderCore处理为无法通过
会绕过非终点的portal，不影响creep.moveTo(portal)
不使用Memory及global，不会因此干扰外部代码
不会在Creep.prototype、PowerCreep.prototype上增加官方未有的键值，不会因此干扰外部代码
本模块不可用于sim，在sim会因为房间名格式不对返回ERR_INVALID_TARGET
版本号规则：alpha test = 0.1.x，beta test = 0.9.x，publish >= 1.0.0

author: Scorpior
debug helpers: fangxm, czc
inspired by: Yuandiaodiaodiao
date: 2020/3/5
version: 0.9.2(beta test)

Usage:
module :main

require('超级移动优化');
module.exports.loop=function() {

    //your codes go here

}

changelog:
0.1.0:  maybe not runnable
0.1.1： still maybe not runnable，修了一些typo，完成正向移动，修改isObstacleStructure
0.1.2： maybe runnable，some bugs are fixed
0.1.3:  修正工地位置寻路错误，调整打印格式
0.1.4:  补充pc对穿，打印中增加cache hits统计
0.9.0:  启用自动清理缓存，保留ignoreCreeps参数，调整对穿顺序+增加在storage附近检查对穿，
        正确识别敌对rampart，正确查询带range路径，打印中增加对穿频率统计
0.9.1:  增加正常逻辑开销统计，修改cache搜索开销统计为cache miss开销统计，绕路bugfix，跨房检测bugfix，other bugfix
0.9.2:  修改缓存策略减少查找耗时增加命中率，增加核心区对穿次数统计，对穿bugfix，other bugfix


ps:
1.默认ignoreCreeps为true，主动设置ignoreCreeps为false会在撞到creep时重新寻路
2.对于不想被对穿的creep（比如没有脚的中央搬运工）, 设置memory：
creep.memory.dontPullMe = true;
3.战斗中遇到敌方pc不断产生新rampart挡路的情况，目前是撞上建筑物才重新寻路（原版moveTo撞上也继续撞），如果觉得需要手动提前激活重新寻路则联系我讨论
4.在控制台输入require('超级移动优化').print()获取性能信息，鼓励发给作者用于优化
*/

/***************************************
 *  模块参数
 */
let config = {  // 初始化参数
    地图房号最大数字超过100: false,
    changeMove: true,   // 【未启用】为creep.move增加对穿能力
    changeMoveTo: true, // 全面优化creep.moveTo，跨房移动也可以一个moveTo解决问题
    changeFindClostestByPath: true,     // 【未启用】轻度修改findClosestByPath，使得默认按照ignoreCreeps寻找最短
    observer: [],  // 【未启用】如果想用ob寻路，把ob的id放这里 ['id1', 'id2', ...]
    enableFlee: false   // 【未启用】是否添加flee()函数，注意这会在Creep.prototype上添加官方未有键值，flee()用法见最底下module.exports处
}
let pathClearDelay = 5000;  // 运行时参数，清理相应时间内都未被再次使用的路径，同时清理死亡creep的缓存，设为undefined表示不清除缓存
let neutralCostMatrixClearDelay = 30000; // 运行时参数，自动清理相应时间前创建的costMatrix，30000tick约等于1天，清理后才能发现新手墙消失或中央房portal变化，你可以手动清理costMatrix，设为undefined表示不自动清除缓存
let hostileCostMatrixClearDelay = 500; // 运行时参数，自动清理相应时间前创建的其他玩家房间的costMatrix
let coreLayoutRange = 3; // 运行时参数，核心布局半径，在离storage这个范围内频繁检查对穿（减少堵路的等待
let avoidRooms = ['E19N2', 'E18N3', 'E35N6', 'E18S8', 'E19S6', 
                'E18S6', 'E28N7', 'E28N9', 'E29N9', 'E29N6', 
                'E28N14', 'E41N8']      // 【未启用】运行时参数

/***************************************
 *  局部缓存
 */
let obTimer = {};   // 【未启用】用于登记ob调用，在相应的tick查看房间对象
/** @type {Paths} */
let globalPathCache = {};     // 缓存path
/** @type {MoveTimer} */
let pathCacheTimer = {}; // 用于记录path被使用的时间，清理长期未被使用的path
/** @type {CreepPaths} */
let creepPathCache = {};    // 缓存每个creep使用path的情况
let creepMoveCache = {};    // 缓存每个creep最后一次移动的tick
let emptyCostMatrix = new PathFinder.CostMatrix;
/** @type {CMs} */
let costMatrixCache = {};    // true存ignoreDestructibleStructures==true的，false同理
/** @type {{ [time: number]:string[] }} */
let costMatrixCacheTimer = {}; // 用于记录costMatrix的创建时间，清理过期costMatrix
let autoClearTick = Game.time;  // 用于避免重复清理缓存

const obstacles = new Set(OBSTACLE_OBJECT_TYPES);
const originMove = Creep.prototype.move;
const originMoveTo = Creep.prototype.moveTo;
const originFindClosestByPath = RoomPosition.prototype.findClosestByPath;

// 统计变量
let startCacheSearch;
let analyzeCPU= { // 统计相关函数总耗时
    move: {sum: 0, calls: 0},
    moveTo: {sum: 0, calls: 0},
    findClosestByPath: {sum: 0, calls: 0}
};
let pathCounter = {total: 0, totalLength: 0};
let testCacheHits = 0;
let testCacheMiss = 0;
let testNormal = 0;
let testNearStorageCheck = 0;
let testNearStorageCross = 0;
let testTryCross = 0;
let testBypass = 0;
let cacheHitsReverse = 0;
let normalLogicalCost = 0;
let cacheHitCost = 0;
let cacheMissCost = 0;

/***************************************
 *  util functions
 */
let reg1 = /^([WE])([0-9]+)([NS])([0-9]+)$/;    // parse得到['E28N7','E','28','N','7']
/**
 *  统一到大地图坐标，平均单次开销0.00005
 * @param {RoomPosition} pos 
 */
function formalize (pos) {
    let splited = reg1.exec(pos.roomName);
    if(splited && splited.length == 5) {
        return{ // 如果这里出现类型错误，那么意味着房间名字不是正确格式但通过了parse，小概率事件
            x: (splited[1] === 'W'? -splited[2] : +splited[2]+1)*50 + pos.x,
            y: (splited[3] === 'N'? -splited[4] : +splited[4]+1)*50 + pos.y
        }
    } // else 房间名字不是正确格式
    return {}
}

function getAdjacents (pos) {
    let posArray = [];
    for(let i = -1; i<=1; i++) {
        for(let j = -1; j<=1; j++) {
            posArray.push({
                x: pos.x + i,
                y: pos.y + j
            })
        }
    }
    return posArray;
}

/**
 *  阉割版isEqualTo，提速
 * @param {RoomPosition} pos1 
 * @param {RoomPosition} pos2 
 */
function isEqual (pos1, pos2) {   
    return pos1.x == pos2.x && pos1.y == pos2.y && pos1.roomName == pos2.roomName;
}

/**
 *  兼容房间边界
 *  参数具有x和y属性就行
 * @param {RoomPosition} pos1 
 * @param {RoomPosition} pos2 
 */
function isNear (pos1, pos2) {   
    if(pos1.roomName == pos2.roomName) {    // undefined == undefined 也成立
        return -1 <= pos1.x - pos2.x && pos1.x - pos2.x <= 1 && -1 <= pos1.y - pos2.y && pos1.y - pos2.y <= 1;
    }else if(pos1.roomName && pos2.roomName) {    // 是完整的RoomPosition
        if(pos1.x + pos2.x != 49 && pos1.y + pos2.y != 49) return false;    // 肯定不是两个边界点, 0.00003 cpu
        // start
        let splited1 = reg1.exec(pos1.roomName);
        let splited2 = reg1.exec(pos2.roomName);
        if(splited1 && splited1.length == 5 && splited2 && splited2.length == 5){
            // 统一到大地图坐标
            let formalizedEW = (splited1[1] === 'W'? -splited1[2] : +splited1[2]+1)*50 + pos1.x - (splited2[1] === 'W'? -splited2[2] : +splited2[2]+1)*50 - pos2.x;
            let formalizedNS = (splited1[3] === 'N'? -splited1[4] : +splited1[4]+1)*50 + pos1.y - (splited2[3] === 'N'? -splited2[4] : +splited2[4]+1)*50 - pos2.y;
            return -1 <= formalizedEW && formalizedEW <= 1 && -1 <= formalizedNS && formalizedNS <= 1;
        }
        // end - start = 0.00077 cpu
    }
    return false
}

/** 
* @param {RoomPosition} pos1 
* @param {RoomPosition} pos2 
*/
function inRange (pos1, pos2, range) {
    if(pos1.roomName == pos2.roomName){
        return -range <= pos1.x - pos2.x && pos1.x - pos2.x <= range && -range <= pos1.y - pos2.y && pos1.y - pos2.y <= range;
    } else {
        pos1 = formalize(pos1);
        pos2 = formalize(pos2);
        return pos1.x && pos2.x && inRange(pos1, pos2);
    }
}

/**
 *  fromPos和toPos是pathFinder寻出的路径上的，只可能是同房相邻点或者跨房边界点
 * @param {RoomPosition} fromPos 
 * @param {RoomPosition} toPos 
 */
function getDirection (fromPos, toPos) {
    if(fromPos.roomName == toPos.roomName) {
        if(toPos.x > fromPos.x) {    // 下一步在右边
            if(toPos.y > fromPos.y) {    // 下一步在下面
                return BOTTOM_RIGHT;
            }else if(toPos.y == fromPos.y) { // 下一步在正右
                return RIGHT;
            }
            return TOP_RIGHT;   // 下一步在上面
        }else if(toPos.x == fromPos.x) { // 横向相等
            if(toPos.y > fromPos.y) {    // 下一步在下面
                return BOTTOM;
            }else if(toPos.y < fromPos.y) {
                return TOP;
            }
        }else{  // 下一步在左边
            if(toPos.y > fromPos.y) {    // 下一步在下面
                return BOTTOM_LEFT;
            }else if(toPos.y == fromPos.y) {
                return LEFT;
            }
            return TOP_LEFT;
        }
    }else{  // 房间边界点
        if(fromPos.x == 0 || fromPos.x == 49) {  // 左右相邻的房间，只需上下移动（左右边界会自动弹过去）
            if(toPos.y > fromPos.y) {   // 下一步在下面
                return BOTTOM;
            }else if(toPos.y < fromPos.y) { // 下一步在上
                return TOP
            } // else 正左正右
            return fromPos.x? RIGHT : LEFT;
        }else if(fromPos.y == 0 || fromPos.y == 49) {    // 上下相邻的房间，只需左右移动（上下边界会自动弹过去）
            if(toPos.x > fromPos.x) {    // 下一步在右边
                return RIGHT;
            }else if(toPos.x < fromPos.x) {
                return LEFT;
            }// else 正上正下
            return fromPos.y? BOTTOM : TOP; 
        }
    }
}

let reg2 = /^[WE]([0-9]+)[NS]([0-9]+)$/;    // parse得到['E28N7','28','7']
let isHighWay = config.地图房号最大数字超过100? 
(roomName) => {
    let splited = reg2.exec(roomName);
    return splited[1] % 10 == 0 || splited[2] % 10 == 0;
} : 
(roomName) => {
    // E0 || E10 || E1S0 || [E10S0|E1S10] || [E10S10] 比正则再除快
    return roomName[1] == 0 || roomName[2] == 0 || roomName[3] == 0 || roomName[4] == 0 || roomName[5] == 0;
}

/**
 *  缓存的路径和当前moveTo参数相同
 * @param {MyPath} path 
 * @param {*} ops 
 */
function isSameOps (path, ops) {
    return path.ignoreRoads == !!ops.ignoreRoads && 
    path.ignoreSwamps == !!ops.ignoreSwamps && 
    path.ignoreStructures == !!ops.ignoreDestructibleStructures;
}

function hasActiveBodypart (body, type) {
    if(!body) {
        return true;
    }

    for(var i = body.length-1; i>=0; i--) {
        if (body[i].hits <= 0)
            break;
        if (body[i].type === type)
            return true;
    }

    return false;

}

function isClosedRampart (structure) {
    return  structure.structureType == STRUCTURE_RAMPART && !structure.my && !structure.isPublic;
}

/**
 *  查看是否有挡路建筑
 * @param {Room} room
 * @param {RoomPosition} pos 
 * @param {boolean} ignoreStructures
 */
function isObstacleStructure (room, pos, ignoreStructures) {
    let consSite = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos);
    if(0 in consSite && consSite[0].my && obstacles.has(consSite[0].structureType)) {  // 工地会挡路
        return true;
    }
    for(let s of room.lookForAt(LOOK_STRUCTURES, pos)) {
        if(!s.hits || s.ticksToDeploy) {     // 是新手墙或者无敌中的invaderCore
            return true;
        } else if(!ignoreStructures && (obstacles.has(s.structureType) || isClosedRampart(s))) {
            return true
        }
    }
    return false;
    // let possibleStructures = room.lookForAt(LOOK_STRUCTURES, pos);  // room.lookForAt比pos.lookFor快
    // 万一有人把路修在extension上，导致需要每个建筑都判断，最多重叠3个建筑（rap+road+其他）
    // return obstacles.has(possibleStructures[0]) || obstacles.has(possibleStructures[1]) || obstacles.has(possibleStructures[2]);    // 条件判断平均每次0.00013cpu
}

/**
 *  为房间保存costMatrix，ignoreDestructibleStructures这个参数的两种情况各需要一个costMatrix
 * @param {Room} room 
 */
function generateCostMatrix (room) {
    let noStructureCostMat = new PathFinder.CostMatrix; // 不考虑可破坏的建筑，但是要考虑墙上资源点和无敌的3种建筑，可能还有其他不能走的？
    let structureCostMat = new PathFinder.CostMatrix;   // 在noStructrue的基础上加上所有不可行走的建筑
    let totalStructures = room.find(FIND_STRUCTURES);
    let 修路也没用的墙点 = [].concat(room.find(FIND_SOURCES), room.find(FIND_MINERALS), room.find(FIND_DEPOSITS));
    let x, y;
    for(let object of 修路也没用的墙点) {
        x = object.pos.x; y = object.pos.y;
        noStructureCostMat.set(x, y, 255);
    }
    if(room.controller && (room.controller.my || room.controller.safeMode)) {
        for(let consSite of room.find(FIND_CONSTRUCTION_SITES)) {
            if(obstacles.has(consSite.structureType)) {
                x = consSite.pos.x; y = consSite.pos.y;
                noStructureCostMat.set(x, y, 255);
                structureCostMat.set(x, y, 255);
            }
        }
    }
    for(let s of totalStructures) {
        if(s.structureType == STRUCTURE_INVADER_CORE) {  // 第1种可能无敌的建筑
            if(s.ticksToDeploy) {
                noStructureCostMat.set(s.pos.x, s.pos.y, 255);
            }
            structureCostMat.set(s.pos.x, s.pos.y, 255);
        }else if(s.structureType == STRUCTURE_PORTAL) {  // 第2种无敌建筑
            x = s.pos.x; y = s.pos.y;
            structureCostMat.set(x, y, 255);
            noStructureCostMat.set(x, y, 255);
        }else if(s.structureType == STRUCTURE_WALL) {    // 第3种可能无敌的建筑
            if(!s.hits) {
                noStructureCostMat.set(s.pos.x, s.pos.y, 255);
            }
            structureCostMat.set(s.pos.x, s.pos.y, 255);
        }else if(s.structureType == STRUCTURE_ROAD) {    // 路的移动力损耗是1，此处设置能寻到墙上的路
            x = s.pos.x; y = s.pos.y;
            if(noStructureCostMat.get(x, y) == 0) {  // 不是在3种无敌建筑或墙中资源上
                noStructureCostMat.set(x, y, 1);
                if(structureCostMat.get(x,y) == 0) {     // 不是在不可行走的建筑上
                    structureCostMat.set(x, y, 1);
                }
            }
        }else if(obstacles.has(s.structureType) || isClosedRampart(s)) {   // HELP：有没有遗漏其他应该设置 noStructureCostMat 的点
            structureCostMat.set(s.pos.x, s.pos.y, 255);    
        }
    }
    costMatrixCache[room.name] = {
        roomName: room.name,
        true: noStructureCostMat,   // 对应 ignoreDestructibleStructures = true
        false: structureCostMat     // 对应 ignoreDestructibleStructures = false
    };
    if(!room.controller || !room.controller.owner) {    
        if(neutralCostMatrixClearDelay) {
            if(!(Game.time + neutralCostMatrixClearDelay in costMatrixCacheTimer)) {
                costMatrixCacheTimer[Game.time + neutralCostMatrixClearDelay] = [];
            }
            costMatrixCacheTimer[Game.time + neutralCostMatrixClearDelay].push(room.name);   // 记录创建时间
        }
    } else if(!room.controller.my && hostileCostMatrixClearDelay) {    // 自己房间costMatrix不清理
        if(!(Game.time + hostileCostMatrixClearDelay in costMatrixCacheTimer)) {
            costMatrixCacheTimer[Game.time + hostileCostMatrixClearDelay] = [];
        }
        costMatrixCacheTimer[Game.time + hostileCostMatrixClearDelay].push(room.name);   // 记录创建时间
    }
}

/**
 *  把路径上有视野的位置的正向移动方向拿到，只有在找新路时调用，找新路时会把有视野房间都缓存进costMatrixCache
 * @param {RoomPosition[]} posArray 
 */
function generateDirectionArray (posArray) {
    let directionArray = new Array(posArray.length);
    //console.log(`${Game.time} get directArray ${Object.keys(costMatrixCache)}\n${posArray}\n`);
    for(let idx = 1; idx in posArray; idx++) {
        if(posArray[idx-1].roomName in costMatrixCache) {
            directionArray[idx] = getDirection(posArray[idx-1], posArray[idx]);
        }
    }
    //console.log(`${directionArray}\n`)
    return directionArray;
}

/**
 *  第一次拿到该room视野，startIdx是creep所在的位置
 * @param {Room} room 
 * @param {MyPath} path 
 * @param {number} startIdx 
 * @param {boolean} reverse 
 */
function checkRoom (room, path, startIdx, reverse) {
    if(!(room.name in costMatrixCache)) {
        generateCostMatrix(room);
    }
    let thisRoomName = room.name
    /** @type {CostMatrix} */
    let costMat = costMatrixCache[thisRoomName][path.ignoreStructures];
    let posArray = path.posArray;
    let directionArray = path.directionArray;
    if(reverse) {    // TODO 这两个要不要合并呢
        for(let i = startIdx-1; i>=0 && posArray[i].roomName == thisRoomName; i--) {
            if(costMat.get(posArray[i].x, posArray[i].y) == 255) {   // 路上有东西挡路
                return false;
            }
            directionArray[i+1] = getDirection(posArray[i], posArray[i+1]);
        }
    }else{
        for(let i = startIdx; i+1 in posArray && posArray[i].roomName == thisRoomName; i++) {
            if(costMat.get(posArray[i].x, posArray[i].y) == 255) {   // 路上有东西挡路
                return false;
            }
            directionArray[i+1] = getDirection(posArray[i], posArray[i+1]); 
        }
    }
    return true;
}

/**
 *  尝试对穿，有2种不可穿情况
 * @param {Creep} creep 
 * @param {RoomPosition} pos 
 * @param {boolean} bypassHostileCreeps
 */
function tryCross (creep, pos, bypassHostileCreeps, ignoreCreeps) {     // ERR_NOT_FOUND开销0.00063，否则开销0.0066
    let obstacleCreeps = creep.room.lookForAt(LOOK_CREEPS, pos).concat(creep.room.lookForAt(LOOK_POWER_CREEPS, pos));
    if(obstacleCreeps.length) {
        if(!ignoreCreeps) {
            return ERR_INVALID_TARGET;
        }
        for(let c of obstacleCreeps) {
            if(c.my) {
                if(c.memory.dontPullMe) {    // 第1种不可穿情况：挡路的creep设置了不对穿
                    return ERR_INVALID_TARGET;
                }
                if(creepMoveCache[c.name] != Game.time && originMove.call(c, getDirection(pos, creep.pos)) == ERR_NO_BODYPART && creep.pull) {
                    creep.pull(c);
                    originMove.call(c, creep);
                }
            }else if(bypassHostileCreeps && (!c.room.controller || !c.room.controller.my || !c.room.controller.safeMode)) {  // 第二种不可穿情况：希望绕过敌对creep
                return ERR_INVALID_TARGET;
            }
        }
        testTryCross++;
        return OK;    // 或者全部操作成功
    }
    return ERR_NOT_FOUND // 没有creep
}

function bypassHostile (creep) {
    return !creep.my || creep.memory.dontPullMe;
}
function bypassMy (creep) {
    return creep.my && creep.memory.dontPullMe;
}
let bypassRoomName;
let bypassCostMat;
let bypassIgnoreCondition;
let userCostCallback;
function bypassRoomCallback (roomName) {
    let costMat;
    if(!(roomName in costMatrixCache) && roomName in Game.rooms) {   // 有视野没costMatrix
        generateCostMatrix(Game.rooms[roomName]);
        costMat = costMatrixCache[roomName][bypassIgnoreCondition];
    } else if (roomName == bypassRoomName) {     // 在findTemporalRoute函数里刚刚建立了costMatrix
        costMat = bypassCostMat;
    } else {
        costMat = roomName in costMatrixCache ? costMatrixCache[roomName][findPathIgnoreCondition] : emptyCostMatrix;
    }

    if(userCostCallback) {
        let resultCostMat = userCostCallback(roomName, roomName in costMatrixCache ? costMat.clone() : new PathFinder.CostMatrix);
        if(resultCostMat instanceof PathFinder.CostMatrix) {
            costMat = resultCostMat;
        }
    }
    return costMat;
}
/**
 *  影响参数：bypassHostileCreeps, ignoreRoads, ignoreDestructibleStructures, ignoreSwamps, costCallback, range, bypassRange
 *  及所有PathFinder参数：plainCost, SwampCost, masOps, maxRooms, maxCost, heuristicWeight
 * @param {Creep} creep 
 * @param {RoomPosition} toPos 
 * @param {MoveToOpts} ops 
 */
function findTemporalRoute (creep, toPos, ops) {
    let nearByCreeps;
    if(ops.ignoreCreeps) {
        nearByCreeps = creep.pos.findInRange(FIND_CREEPS, ops.bypassRange, {
            filter:ops.bypassHostileCreeps? bypassHostile : bypassMy
        }).concat(creep.pos.findInRange(FIND_POWER_CREEPS, ops.bypassRange, {
            filter:ops.bypassHostileCreeps? bypassHostile : bypassMy
        }));
    }else{
        nearByCreeps = creep.pos.findInRange(FIND_CREEPS, ops.bypassRange).concat(
            creep.pos.findInRange(FIND_POWER_CREEPS, ops.bypassRange)
        )
    }
    if(!(creep.room.name in costMatrixCache)) { // 这个房间的costMatrix已经被删了
        generateCostMatrix(creep.room);
    }
    bypassIgnoreCondition = !!ops.ignoreDestructibleStructures;
    /** @type {CostMatrix} */
    bypassCostMat = costMatrixCache[creep.room.name][bypassIgnoreCondition].clone();
    for(let c of nearByCreeps) {
        bypassCostMat.set(c.pos.x, c.pos.y, 255);
    }
    bypassRoomName = creep.room.name;
    userCostCallback = typeof ops.costCallback == 'function' ? ops.costCallback : undefined;

    let PathFinderOpts = {
        roomCallback: bypassRoomCallback,
        masOps: ops.maxOps,
        maxRooms: ops.maxRooms,
        maxCost: ops.maxCost,
        heuristicWeight: ops.heuristicWeight || 1.2
    }
    if(ops.ignoreSwamps) {   // HELP 这里有没有什么不增加计算量的简短写法
        PathFinderOpts.plainCost = ops.plainCost;
        PathFinderOpts.swampCost = ops.swampCost || 1;
    }else if(ops.ignoreRoads) {
        PathFinderOpts.plainCost = ops.plainCost;
        PathFinderOpts.swampCost = ops.swampCost || 5;
    }else{
        PathFinderOpts.plainCost = ops.plainCost || 2;
        PathFinderOpts.swampCost = ops.swampCost || 10;
    }

    let result = PathFinder.search(creep.pos, {pos: toPos, range: ops.range}, PathFinderOpts).path;
    if(result.length) {
        let creepCache = creepPathCache[creep.name];  
        creepCache.path = {     // 弄个新的自己走，不修改公用的缓存路，只会用于正向走所以也不需要start属性，idx属性会在startRoute中设置
            end: formalize(result[result.length-1]),
            posArray: result,
            directionArray: generateDirectionArray(result),
            ignoreRoads: !!ops.ignoreRoads,
            ignoreStructures: !!ops.ignoreDestructibleStructures,
            ignoreSwamps: !!ops.ignoreSwamps
        }
        creepCache.reverse = false;  // 在新路上一定是正向走
        return true;
    }
    return false;
}

let findPathIgnoreCondition;
function roomCallback (roomName) {
    let costMat;
    if(!(roomName in costMatrixCache) && roomName in Game.rooms) {   // 有视野没costMatrix
        generateCostMatrix(Game.rooms[roomName]);
    }

    costMat = roomName in costMatrixCache ? costMatrixCache[roomName][findPathIgnoreCondition] : emptyCostMatrix;
    if(userCostCallback) {
        let resultCostMat = userCostCallback(roomName, roomName in costMatrixCache ? costMat.clone() : new PathFinder.CostMatrix);
        if(resultCostMat instanceof PathFinder.CostMatrix) {
            costMat = resultCostMat;
        }
    }
    return costMat;
}
/**
 *  影响参数：ignoreRoads, ignoreDestructibleStructures, ignoreSwamps, costCallback, range
 *  及所有PathFinder参数：plainCost, SwampCost, masOps, maxRooms, maxCost, heuristicWeight
 * @param {RoomPosition} fromPos 
 * @param {RoomPosition} toPos 
 * @param {MoveToOpts} ops 
 */
function findPath (fromPos, toPos, ops) {
    if(autoClearTick < Game.time) {  // 自动清理
        autoClearTick = Game.time;
        clearUnused();
    }

    findPathIgnoreCondition = !!ops.ignoreDestructibleStructures;
    userCostCallback = typeof ops.costCallback == 'function' ? ops.costCallback : undefined;

    let PathFinderOpts = {
        roomCallback: roomCallback,
        masOps: ops.maxOps,
        maxRooms: ops.maxRooms,
        maxCost: ops.maxCost,
        heuristicWeight: ops.heuristicWeight || 1.2
    }
    if(ops.ignoreSwamps) {   // HELP 这里有没有什么不增加计算量的简短写法
        PathFinderOpts.plainCost = ops.plainCost;
        PathFinderOpts.swampCost = ops.swampCost || 1;
    }else if(ops.ignoreRoads) {
        PathFinderOpts.plainCost = ops.plainCost;
        PathFinderOpts.swampCost = ops.swampCost || 5;
    }else{
        PathFinderOpts.plainCost = ops.plainCost || 2;
        PathFinderOpts.swampCost = ops.swampCost || 10;
    }

    return PathFinder.search(fromPos, {pos: toPos, range: ops.range}, PathFinderOpts).path;
}

let combinedX, combinedY;
/**
 * @param {MyPath} newPath 
 */
function addPathIntoCache (newPath) {
    combinedX = newPath.start.x + newPath.start.y;
    combinedY = newPath.end.x + newPath.end.y;
    if(!(combinedX in globalPathCache)) {
        globalPathCache[combinedX] = {
            [combinedY]:[]  // 数组里放不同ops的及其他start、end与此对称的
        };
    } else if(!(combinedY in globalPathCache[combinedX])) {
        globalPathCache[combinedX][combinedY] = []      // 数组里放不同ops的及其他start、end与此对称的
    }
    globalPathCache[combinedX][combinedY].push(newPath);
}

function invalidate () {
    return 0;
}
/**
 * @param {MyPath} path 
 */
function deletePath (path) {
    if(path.start) {     // 有start属性的不是临时路
        let pathArray = globalPathCache[path.start.x + path.start.y][path.end.x + path.end.y];
        pathArray.splice(pathArray.indexOf(path), 1);
        path.posArray = path.posArray.map(invalidate);
    }
}

let minX, maxX, minY, maxY;
/**
 * @param {RoomPosition} formalFromPos 
 * @param {RoomPosition} formalToPos 
 * @param {CreepPaths} creepCache 
 * @param {MoveToOpts} ops 
 */
function findPathInCache (formalFromPos, formalToPos, creepCache, ops) {     // ops.range设置越大找的越慢
    startCacheSearch = Game.cpu.getUsed();
    minX = formalFromPos.x+formalFromPos.y-2;
    maxX = formalFromPos.x+formalFromPos.y+2;
    minY = formalToPos.x+formalToPos.y-1-ops.range;
    maxY = formalToPos.x+formalToPos.y+1+ops.range;
    for(combinedX = minX; combinedX <= maxX; combinedX++) {
        if(combinedX in globalPathCache) {
            for(combinedY = minY; combinedY <= maxY; combinedY++) {
                if(combinedY in globalPathCache[combinedX]) {
                    for(let path of globalPathCache[combinedX][combinedY]) {     // 这个数组应该会很短
                        if(isNear(path.start, formalFromPos) && inRange(path.end, formalToPos, ops.range) && isSameOps(path, ops)) {     // 找到路了
                            creepCache.path = path;
                            creepCache.reverse = false;
                            return true;
                        }
                    }
                }
            }
        }
    }
    if(ops.range == 1) {   // 找反向
        for(combinedX = minY; combinedX <= maxY; combinedX++) {
            if(combinedX in globalPathCache) {
                for(combinedY = minX; combinedY <= maxX; combinedY++) {
                    if(combinedY in globalPathCache[combinedX]) {
                        for(let path of globalPathCache[combinedX][combinedY]) {     // 这个数组应该会很短
                            if(isNear(path.start, formalToPos) && isNear(path.end, formalFromPos) && isSameOps(path, ops)) {    // 找到反向路了   // 找到路了
                                cacheHitsReverse++;
                                creepCache.path = path;
                                creepCache.reverse = true;
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}

let startRoomName, endRoomName;
/**
 *  起止点都在自己房间的路不清理
 * @param {CreepPaths['name']} creepCache 
 */
function setPathTimer (creepCache) {
    if(pathClearDelay) {
        let posArray = creepCache.path.posArray;
        startRoomName = posArray[0].roomName;
        endRoomName = posArray[posArray.length-1].roomName;
        if(!(startRoomName in Game.rooms) || !(endRoomName in Game.rooms) || !Game.rooms[startRoomName].controller || !Game.rooms[endRoomName].controller 
            || !Game.rooms[startRoomName].controller.my || !Game.rooms[endRoomName].controller.my) {
    
            if(!(Game.time + pathClearDelay in pathCacheTimer)) {
                pathCacheTimer[Game.time + pathClearDelay] = [];
            }
            pathCacheTimer[Game.time + pathClearDelay].push(creepCache.path);
            creepCache.path.lastTime = Game.time;
        }
    }
}

/**
 *  
 * @param {Creep} creep 
 * @param {RoomPosition} toPos 
 * @param {RoomPosition[]} posArray 
 * @param {number} startIdx 
 * @param {number} idxStep 
 * @param {PolyStyle} visualStyle 
 */
function showVisual (creep, toPos, posArray, startIdx, idxStep, visualStyle) {
    let tempArray = [creep.pos];
    let thisRoomName = creep.room.name;
    for(let i = startIdx; i in posArray && posArray[i].roomName == thisRoomName; i+=idxStep) {
        tempArray.push(posArray[i]);
    }
    if(toPos.roomName == thisRoomName) {
        tempArray.push(toPos);
    }
    creep.room.visual.poly(tempArray, visualStyle);
}

/**
 *  按缓存路径移动
 * @param {Creep} creep 
 * @param {PolyStyle} visualStyle 
 * @param {RoomPosition} toPos 
 */
function moveOneStep (creep, visualStyle, toPos) {   
    let creepCache = creepPathCache[creep.name];
    if(visualStyle) {
        _.defaults(visualStyle, defaultVisualizePathStyle);
        showVisual(creep, toPos, creepCache.path.posArray, creepCache.idx, 1, visualStyle);
    }
    if(creep.fatigue) {
        return ERR_TIRED;
    }
    creepCache.idx++;
    creepMoveCache[creep.name] = Game.time;
    //creep.room.visual.circle(creepCache.path.posArray[creepCache.idx]);
    return originMove.call(creep, creepCache.path.directionArray[creepCache.idx]);
}

/**
 *  按缓存路径移动
 * @param {Creep} creep 
 * @param {PolyStyle} visualStyle 
 * @param {RoomPosition} toPos 
 */
function moveOneStepReverse (creep, visualStyle, toPos) {
    let creepCache = creepPathCache[creep.name];
    if(visualStyle) {
        _.defaults(visualStyle, defaultVisualizePathStyle);
        showVisual(creep, toPos, creepCache.path.posArray, creepCache.idx, -1, visualStyle);
    }
    if(creep.fatigue) {
        return ERR_TIRED;
    }
    creepMoveCache[creep.name] = Game.time;
    //creep.room.visual.circle(creepCache.path.posArray[creepCache.idx]);
    return originMove.call(creep, (creepCache.path.directionArray[creepCache.idx--] + 3) % 8 + 1);
}

/**
 * 
 * @param {Creep} creep 
 * @param {{
        path: MyPath,
        reverse: boolean,
        idx: number
    }} pathCache 
 * @param {PolyStyle} visualStyle 
 * @param {RoomPosition} toPos 
 * @param {boolean} ignoreCreeps
 */
function startRoute (creep, pathCache, visualStyle, toPos, ignoreCreeps) {
    let posArray = pathCache.path.posArray;

    let idx, t, direction;
    if(pathCache.reverse) {
        idx = posArray.length-1;
        t = -1;
    }else{
        idx = 0;
        t = 1;
    }
    while (idx in posArray && isNear(creep.pos, posArray[idx])) {
        idx += t;
    }
    idx -= t;
    pathCache.idx = idx;
    
    if(visualStyle) {
        _.defaults(visualStyle, defaultVisualizePathStyle);
        showVisual(creep, toPos, posArray, idx, t, visualStyle);
    }
    creepMoveCache[creep.name] = Game.time;

    let nextStep = posArray[idx];
    if(ignoreCreeps) {
        tryCross(creep, nextStep, false, true);
    }
    direction = getDirection(creep.pos, posArray[idx]);
    return originMove.call(creep, direction);
}

/**
 *  将用在Creep.prototype.move中
 * @param {RoomPosition} pos 
 * @param {DirectionConstant} target 
 */
function direction2Pos (pos, target) {
    if(typeof target != "number") {
        // target 不是方向常数
        return undefined;
    }
    
    const direction = +target;  // 如果是string则由此运算转换成number
    let tarpos = {
        x: pos.x,
        y: pos.y,
    }
    if (direction !== 7 && direction !== 3) {
        if (direction > 7 || direction < 3) {
            --tarpos.y
        } else {
            ++tarpos.y
        }
    }
    if (direction !== 1 && direction !== 5) {
        if (direction < 5) {
            ++tarpos.x
        } else {
            --tarpos.x
        }
    }
    if (tarpos.x < 0 || tarpos.y > 49 || tarpos.x > 49 || tarpos.y < 0) {
        return undefined;
    } else {
        return new RoomPosition(tarpos.x, tarpos.y, pos.roomName);
    }
}

let startTime;
let endTime;
/**
 * @param {Function} fn 
 */
function wrapFn (fn, name) {
    return function() {
        startTime = Game.cpu.getUsed();     // 0.0015cpu
        let code = fn.apply(this, arguments);
        endTime = Game.cpu.getUsed();
        if(endTime - startTime >= 0.2) {
            analyzeCPU[name].sum += endTime - startTime;
            analyzeCPU[name].calls++;
        }
        return code;
    }
}

function clearUnused () {
    if(Game.time % pathClearDelay == 0) { // 随机清一次已死亡creep
        for(let name in creepPathCache) {
            if(!(name in Game.creeps)) {
                delete creepPathCache[name];
            }
        }
    }
    for(let time in pathCacheTimer) {
        if(time > Game.time) {
            break;
        }
        for(let path of pathCacheTimer[time]) {
            if(path.lastTime == time - pathClearDelay) {
                deletePath(path);
            }
        }
        delete pathCacheTimer[time];
    }
    for(let time in costMatrixCacheTimer) {
        if(time > Game.time) {
            break;
        }
        for(let roomName of costMatrixCacheTimer[time]) {
            delete costMatrixCache[roomName];
        }
        delete costMatrixCacheTimer[time];
    }
}

/***************************************
 *  功能实现
 */

const defaultVisualizePathStyle = {fill: 'transparent', stroke: '#fff', lineStyle: 'dashed', strokeWidth: .15, opacity: .1};
let ops, toPos, creepCache, path, idx, posArray, formalToPos, formalFromPos;
/**
 *  把moveTo重写一遍
 * @param {Creep} this
 * @param {number | RoomObject} firstArg 
 * @param {number | MoveToOpts} secondArg 
 * @param {MoveToOpts} opts 
 */
function betterMoveTo (firstArg, secondArg, opts) {
    if(!this.my) {
        return ERR_NOT_OWNER;
    }
    
    if(this.spawning) {
        return ERR_BUSY;
    }
    
    if(typeof firstArg == 'object') {
        toPos = firstArg.pos || firstArg;
        ops = secondArg || {};
    } else {
        toPos = {x: firstArg, y: secondArg, roomName: this.room.name};
        ops = opts || {};
    }
    ops.bypassHostileCreeps = ops.bypassHostileCreeps === undefined || ops.bypassHostileCreeps;    // 设置默认值为true
    ops.ignoreCreeps = ops.ignoreCreeps === undefined || ops.ignoreCreeps;

    if(typeof toPos.x != "number" || typeof toPos.y != "number") {   // 房名无效或目的坐标不是数字，不合法
        this.say('no tar');
        return ERR_INVALID_TARGET;
    } else if(inRange(this.pos, toPos, ops.range || 1)) {   // 已到达
        if(isEqual(toPos, this.pos) || ops.range) {  // 已到达
            return OK;
        } // else 走一步
        if(this.pos.roomName == toPos.roomName && ops.ignoreCreeps) {    // 同房间考虑一下对穿
            tryCross(this, toPos, false, true);
        }
        this.name in creepPathCache && (creepPathCache[this.name].idx = 0);
        creepMoveCache[this.name] = Game.time;      // 用于防止自己移动后被误对穿
        testNormal++;
        let t = Game.cpu.getUsed() - startTime;
        normalLogicalCost += t>0.2? t-0.2 : t;
        return originMove.call(this, getDirection(this.pos, toPos));
    }
    ops.range = ops.range || 1;

    if(!hasActiveBodypart(this.body, MOVE)) {
        return ERR_NO_BODYPART;
    }

    if(this.fatigue) {
        if(!ops.visualizePathStyle) {    // 不用画路又走不动，直接return
            return ERR_TIRED;   
        } // else 要画路，画完再return
    }
    
    // HELP：感兴趣的帮我检查这里的核心逻辑orz
    creepCache = creepPathCache[this.name];
    if(creepCache && creepCache.path && creepCache.idx in creepCache.path.posArray && isSameOps(creepCache.path, ops)) {  // 有缓存路且条件相同，isSameOps平均单次约0.00011cpu
        path = creepCache.path;
        idx = creepCache.idx;
        posArray = path.posArray;
        if(creepCache.reverse){
            if(creepCache.reverse && inRange(posArray[0], toPos, ops.range)) {  // 反向走，目的地没变
                if(isEqual(this.pos, posArray[idx])) {    // 在路线上，即上一步正常移动了
                    this.say('r正常');
                    if('storage' in this.room && inRange(this.room.storage.pos, this.pos, coreLayoutRange) && ops.ignoreCreeps) {
                        testNearStorageCheck++;
                        tryCross(this, posArray[idx-1], false, ops.ignoreCreeps);
                    }
                    testNormal++;
                    let t = Game.cpu.getUsed() - startTime;
                    if(t>0.2){
                        testNearStorageCross++;
                        normalLogicalCost += t-0.2;
                    }else{
                        normalLogicalCost += t;
                    }
                    return moveOneStepReverse(this, ops.visualizePathStyle, toPos); // 往下走一步
                } else if(idx-1 >= 0 && isEqual(this.pos, posArray[idx-1])) {   // 刚跨房，因为边界传送一步走了2格（相邻房间边界各算一格）
                    creepCache.idx--;
                    if(!path.directionArray[creepCache.idx]) {    // 第一次见到该房则检查房间
                        if(checkRoom(this.room, path, creepCache.idx, true)) {
                            this.say('r新房 可走');
                            console.log(`${Game.time}: r ${this.name} check room ${this.pos.roomName} OK`);
                            return moveOneStepReverse(this, ops.visualizePathStyle, toPos);  // 路径正确，继续走
                        }   // else 检查中发现房间里有建筑挡路，重新寻路
                        console.log(`${Game.time}: r ${this.name} check room ${this.pos.roomName} failed`);
                        deletePath(path);
                    } else {
                        this.say('r这个房间见过了');
                        return moveOneStepReverse(this, ops.visualizePathStyle, toPos);  // 路径正确，继续走
                    }
                } else if(isNear(this.pos,  posArray[idx])) {  // 上一步没走成功，可能遇到堵路
                    let code = tryCross(this, posArray[idx], ops.bypassHostileCreeps, ops.ignoreCreeps);  // 检查挡路creep
                    if(code == OK) { // 让这个逻辑掉下去
                    }else if(code == ERR_NOT_FOUND && isObstacleStructure(this.room, posArray[idx], ops.ignoreDestructibleStructures)) {   // 发现出现新建筑物挡路，删除costMatrix和path缓存，重新寻路
                        console.log(`${Game.time}: ${this.name} find obstacles at ${this.pos}`);
                        delete costMatrixCache[this.pos.roomName];
                        deletePath(path);
                    }else if(code == ERR_INVALID_TARGET) {   // 是被设置了不可对穿的creep或者敌对creep挡路，临时绕路
                        testBypass++;
                        ops.bypassRange = ops.bypassRange || 5; // 默认值
                        if(typeof ops.bypassRange != "number" || typeof ops.range != 'number') {
                            return ERR_INVALID_ARGS;
                        }
                        if(findTemporalRoute(this, toPos, ops)) { // 有路，creepCache的内容会被这个函数更新
                            this.say('r开始绕路');
                            return startRoute(this, creepCache, ops.visualizePathStyle, toPos, ops.ignoreCreeps);
                        }else{  // 没路
                            this.say('r没路啦');
                            return ERR_NO_PATH;
                        }
                    }
                    // 对穿操作成功 TODO 还有此处成立还有两个可能：1.下一步是房间边界，2.下一步是墙里的路并且路碰巧消失了
                    this.say('r对穿'+getDirection(this.pos, posArray[idx]));
                    if(ops.visualizePathStyle) {
                        _.defaults(ops.visualizePathStyle, defaultVisualizePathStyle);
                        showVisual(this, toPos, posArray, idx, -1, ops.visualizePathStyle);
                    }
                    creepMoveCache[this.name] = Game.time;
                    return originMove.call(this, getDirection(this.pos, posArray[idx]));  // 有可能是第一步就没走上路，直接call可兼容
    
                } else if(idx+1 in posArray && isNear(this.pos, posArray[idx+1])) {     // 偏离路线1格，发生于上上tick成功跨房间，然后上tick被堵路没有离开出口，本tick自动传送回上一个房间
                    this.say('r偏离一格');
                    creepCache.idx++;
                    if(ops.visualizePathStyle) {
                        _.defaults(ops.visualizePathStyle, defaultVisualizePathStyle);
                        showVisual(this, toPos, posArray, idx, -1, ops.visualizePathStyle);
                    }
                    creepMoveCache[this.name] = Game.time;
                    return originMove.call(this, getDirection(this.pos, posArray[idx+1]));
                } // else 彻底偏离，重新寻路
            } // else 目的地变了，重新寻路
        }else if(inRange(posArray[posArray.length-1], toPos, ops.range) || (isEqual(toPos, creepCache.dst) && idx in path.posArray)) {   // 正向走，目的地没变
            if(isEqual(this.pos, posArray[idx])) {    // 正常
                if('storage' in this.room && inRange(this.room.storage.pos, this.pos, coreLayoutRange) && ops.ignoreCreeps) {
                    testNearStorageCheck++;
                    tryCross(this, posArray[idx+1], false, true);
                }
                this.say('正常');
                testNormal++;
                let t = Game.cpu.getUsed() - startTime;
                if(t>0.2){
                    testNearStorageCross++;
                    normalLogicalCost += t-0.2;
                }else{
                    normalLogicalCost += t;
                }
                return moveOneStep(this, ops.visualizePathStyle, toPos);
            } else if(idx+1 in posArray && isEqual(this.pos, posArray[idx+1])) {  // 跨房了
                creepCache.idx++; 
                if(!path.directionArray[idx+2]) {  // 第一次见到该房则检查房间
                    if(checkRoom(this.room, path, creepCache.idx, false)) {   // 传creep所在位置的idx
                        this.say('新房 可走');
                        console.log(`${Game.time}: ${this.name} check room ${this.pos.roomName} OK`);
                        return moveOneStep(this, ops.visualizePathStyle, toPos);  // 路径正确，继续走
                    }   // else 检查中发现房间里有建筑挡路，重新寻路
                    console.log(`${Game.time}: ${this.name} check room ${this.pos.roomName} failed`);
                    deletePath(path);
                }else{
                    this.say('这个房间见过了');
                    return moveOneStep(this, ops.visualizePathStyle, toPos);  // 路径正确，继续走
                }
            } else if(isNear(this.pos,  posArray[idx])) {  // 堵路了
                let code = tryCross(this, posArray[idx], ops.bypassHostileCreeps, ops.ignoreCreeps);  // 检查挡路creep
                if(code == OK) {
                }else if(code == ERR_NOT_FOUND && isObstacleStructure(this.room, posArray[idx], ops.ignoreDestructibleStructures)) {   // 发现出现新建筑物挡路，删除costMatrix和path缓存，重新寻路
                    console.log(`${Game.time}: ${this.name} find obstacles at ${this.pos}`);
                    delete costMatrixCache[this.pos.roomName];
                    deletePath(path);
                }else if(code == ERR_INVALID_TARGET) {   // 是被设置了不可对穿的creep或者敌对creep挡路，临时绕路
                    testBypass++;
                    ops.bypassRange = ops.bypassRange || 5; // 默认值
                    if(typeof ops.bypassRange != "number" || typeof ops.range != 'number') {
                        return ERR_INVALID_ARGS;
                    }
                    if(findTemporalRoute(this, toPos, ops)) { // 有路，creepCache的内容会被这个函数更新
                        this.say('开始绕路');
                        return startRoute(this, creepCache, ops.visualizePathStyle, toPos, ops.ignoreCreeps);
                    }else{  // 没路
                        this.say('没路啦');
                        return ERR_NO_PATH;
                    }
                }
                this.say('对穿'+getDirection(this.pos, posArray[idx])+''+originMove.call(this, getDirection(this.pos, posArray[idx])));
                if(ops.visualizePathStyle) {
                    _.defaults(ops.visualizePathStyle, defaultVisualizePathStyle);
                    showVisual(this, toPos, posArray, idx, 1, ops.visualizePathStyle);
                }
                creepMoveCache[this.name] = Game.time;
                return originMove.call(this, getDirection(this.pos, posArray[idx]));  // 有可能是第一步就没走上路，直接call可兼容
            } else if(idx-1 >= 0 && isNear(this.pos, posArray[idx-1])) {  // 因为堵路而被自动传送反向跨房了
                this.say('偏离一格');
                creepCache.idx--;
                if(ops.visualizePathStyle) {
                    _.defaults(ops.visualizePathStyle, defaultVisualizePathStyle);
                    showVisual(this, toPos, posArray, idx, 1, ops.visualizePathStyle);
                }
                creepMoveCache[this.name] = Game.time;
                return originMove.call(this, getDirection(this.pos, posArray[idx-1]));
            } // else 彻底偏离，重新寻路
        }
    } // else 需要重新寻路，先找缓存路，找不到就寻路

    if(!creepCache) {    // 初始化cache
        creepCache = {
            dst: {x: NaN, y: NaN},
            path: undefined,
            reverse: false,
            idx: 0
        };
        creepPathCache[this.name] = creepCache;
    }else{  
        creepCache.path = undefined;
    }

    if(typeof ops.range != 'number') {
        return ERR_INVALID_ARGS
    }
    
    formalToPos = formalize(toPos);
    formalFromPos = formalize(this.pos);

    if(!findPathInCache(formalFromPos, formalToPos, creepCache, ops)) {  // 没找到缓存路
        testCacheMiss++;
        let result = findPath(this.pos, toPos, ops);
        if(!result.length) {     // 一步也动不了了
            this.say('no path')
            return ERR_NO_PATH;
        }

        result.unshift(this.pos);
        this.say('寻路');
        let newPath = {
            start: formalize(result[0]),
            end: formalize(result[result.length-1]),
            posArray: result,
            directionArray: generateDirectionArray(result),
            ignoreRoads: !!ops.ignoreRoads,
            ignoreStructures: !!ops.ignoreDestructibleStructures,
            ignoreSwamps: !!ops.ignoreSwamps
        }
        addPathIntoCache(newPath);

        creepCache.path = newPath;
        creepCache.reverse = false; // 自己新找的路不会是反向

        cacheMissCost += Game.cpu.getUsed() - startCacheSearch;
    }else{
        creepCache.reverse? this.say('rcached') : this.say('cached');
        testCacheHits++;
        cacheHitCost += Game.cpu.getUsed() - startCacheSearch;
    }
    
    creepCache.dst = toPos;
    setPathTimer(creepCache);

    return startRoute(this, creepCache, ops.visualizePathStyle, toPos, ops.ignoreCreeps);
}

/**
 * 
 * @param {Creep} this 写好后删这个参数
 * @param {DirectionConstant | Creep} target 
 */
function betterMove (target) {
    
}

/**
 * @param {RoomPosition} this 写好后删这个参数
 * @param {FindConstant} type 
 * @param {FindPathOpts & FilterOptions<FIND_STRUCTURES> & { algorithm?: string }} opts 
 */
function betterFindClosestByPath (type, opts) {
    
}

/**
 *  opts: memberPos:relativePos[], avoidTowersHigherThan:number, avoidObstaclesHigherThan:number
 * @param {RoomPosition} this 写好后删这个参数
 * @param {RoomPosition} toPos 
 * @param {*} opts 
 */
function findSquadPathTo (toPos, opts) {

}

/***************************************
 *  初始化
 *  Creep.prototype.move()将在v0.9.x版本加入
 *  ob寻路、自动visual将在v0.9.x或v1.0.x版本加入
 *  RoomPosition.prototype.findClosestByPath()将在v1.1加入
 *  Creep.prototype.flee()、RoomPosition.prototype.findSquadPathTo()函数将在v1.1或v1.2加入
 *  checkSquadPath()有小概率会写
 */
// Creep.prototype.move = wrapFn(config.changeMove? betterMove : originMove, 'move');
Creep.prototype.moveTo = wrapFn(config.changeMoveTo? betterMoveTo : originMoveTo, 'moveTo');
PowerCreep.prototype.moveTo = wrapFn(config.changeMoveTo? betterMoveTo : originMoveTo, 'moveTo');
// RoomPosition.prototype.findClosestByPath = wrapFn(config.changeFindClostestByPath? betterFindClosestByPath : originFindClosestByPath, 'findClosestByPath');
// Creep.prototype.flee()和RoomPosition.prototype.findClosestByPath()将在v0.9或v1.0版本加入
module.exports = {
    setChangeMove: function(bool) {
        //Creep.prototype.move = wrapFn(bool? betterMove : originMove, 'move');
        analyzeCPU.move = {sum: 0, calls: 0};
        return OK;
    },
    setChangeMoveTo: function(bool) {
        Creep.prototype.moveTo = wrapFn(bool? betterMoveTo : originMoveTo, 'moveTo');
        PowerCreep.prototype.moveTo = wrapFn(bool? betterMoveTo : originMoveTo, 'moveTo');
        analyzeCPU.moveTo = {sum: 0, calls: 0};
        return OK;
    },
    setChangeFindClostestByPath: function(bool) {
        // RoomPosition.prototype.findClosestByPath = wrapFn(bool? betterFindClosestByPath : originFindClosestByPath, 'findClosestByPath');
        analyzeCPU.findClosestByPath = {sum: 0, calls: 0};
        return OK;
    },
    setPathClearDelay: function(number) {   // TODO 缩短间隔时内存泄露
        if(typeof number == "number" && number>0) {
            pathClearDelay = Math.ceil(number);
            return OK;
        }else if(number === undefined) {
            pathClearDelay = undefined;
        }
        return ERR_INVALID_ARGS;
    },
    setNeutralCostMatrixClearDelay: function(number) {
        if(typeof number == "number" && number>0) {
            neutralCostMatrixClearDelay = Math.ceil(number);
            return OK;
        }else if(number === undefined) {
            neutralCostMatrixClearDelay = undefined;
            return OK;
        }
        return ERR_INVALID_ARGS;
    },
    setHostileCostMatrixClearDelay: function(number) {
        if(typeof number == "number" && number>0) {
            hostileCostMatrixClearDelay = Math.ceil(number);
            return OK;
        }else if(number === undefined) {
            hostileCostMatrixClearDelay = undefined;
            return OK;
        }
        return ERR_INVALID_ARGS;
    },
    deleteCostMatrix: function(roomName) {
        delete costMatrixCache[roomName];
        return OK;
    },
    deltePath: function(fromPos, toPos, range) {
        //if(!(fromPos instanceof RoomPosition))
    },
    print: function() {
        let text = '\navarageTime\tcalls\tFunctionName';
        for(let fn in analyzeCPU) {
            text += `\n${(analyzeCPU[fn].sum/analyzeCPU[fn].calls).toFixed(5)}\t\t${analyzeCPU[fn].calls}\t\t${fn}`;
        }
        let hitCost = cacheHitCost/testCacheHits;
        let missCost = cacheMissCost/testCacheMiss;
        let missRate = testCacheMiss/(testCacheMiss+testCacheHits);
        text += `\nnormal logical cost: ${(normalLogicalCost/testNormal).toFixed(5)}, total cross rate: ${(testTryCross/analyzeCPU.moveTo.calls).toFixed(4)}, total bypass rate:  ${(testBypass/analyzeCPU.moveTo.calls).toFixed(4)}`
        text += `\nnear storage check rate: ${(testNearStorageCheck/analyzeCPU.moveTo.calls).toFixed(4)}, near storage cross rate: ${(testNearStorageCross/testNearStorageCheck).toFixed(4)}`
        text += `\ncache search rate: ${((testCacheMiss+testCacheHits)/analyzeCPU.moveTo.calls).toFixed(4)}, total hit rate: ${(1-missRate).toFixed(4)}, reverse hits rate: ${(cacheHitsReverse/testCacheHits).toFixed(4)}`;
        text += `\ncache hit avg cost: ${(hitCost).toFixed(5)}, cache miss avg cost: ${(missCost).toFixed(5)}, total avg cost: ${(hitCost*(1-missRate)+missCost*missRate).toFixed(5)}`;
        return text;
    },
    clear: ()=>{}
    // clear: clearUnused
}