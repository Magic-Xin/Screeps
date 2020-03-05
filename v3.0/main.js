var roleHarvester = require('role.harvester');
var roleUHarvester = require('role.uharvester');
var roleHTransfer = require('role.htransfer');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleMHarvester = require('role.mharvester')
var roleMTransfer = require('role.mtransfer')

module.exports.loop = function () {

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }  //清理死亡creeps内存占用

    if(!Game.spawns['Spawn1'].spawning) {
        if(Game.spawns['Spawn1'].room.energyAvailable >= 1250) {
            const mineral = Game.getObjectById('5bbcb69ad867df5e542079f5');
            var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
            var uharvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'uharvester');
            var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader')
            var htransfers = _.filter(Game.creeps, (creep) => creep.memory.role == 'htransfer')
            var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder')
            var mharvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'mharvester')
            var mtransfers = _.filter(Game.creeps, (creep) => creep.memory.role == 'mtransfer')
            var CStarget = Game.spawns['Spawn1'].room.find(FIND_CONSTRUCTION_SITES);

            if(harvesters.length < 1) {
                var HnewName = 'Harvester' + Game.time;
                console.log('Spawning new harvester: ' + HnewName);
                Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE], HnewName, 
                    {memory: {role: 'harvester'}});
            }

            else if(htransfers.length < 1) {
                var HTnewName = 'HTransfer' + Game.time;
                console.log('Spawning new htransfer: ' + HTnewName);
                Game.spawns['Spawn1'].spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], HTnewName,
                    {memory: {role: 'htransfer'}});
            }

            else if(uharvesters.length < 1) {
                var UHnewName = 'UHarvester' + Game.time;
                console.log('Spawning new uharvester: ' + UHnewName);
                Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE], UHnewName, 
                    {memory: {role: 'uharvester'}});
            }

            else if(mineral.mineralAmount > 0){

                if(upgraders.length < 1) {
                    var UnewName = 'Upgrader' + Game.time;
                    console.log('Spawning new upgrader: ' + UnewName);
                    Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], UnewName,
                        {memory: {role: 'upgrader'}});
                }

                else if(mharvesters.length < 1) {
                    var MHnewName = 'MHarvester' + Game.time;
                    console.log('Spawning new mharvester: ' + MHnewName);
                    Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE], MHnewName, 
                        {memory: {role: 'mharvester'}});
                }

                else if(mtransfers.length < 1) {
                    var MTnewName = 'MTransfer' + Game.time;
                    console.log('Spawning new mtransfer: ' + MTnewName);
                    Game.spawns['Spawn1'].spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], MTnewName,
                        {memory: {role: 'mtransfer'}});
                }
            }

            else if(upgraders.length < 2){
                var UnewName = 'Upgrader' + Game.time;
                console.log('Spawning new upgrader: ' + UnewName);
                Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], UnewName,
                    {memory: {role: 'upgrader'}});
            }

            else if(CStarget.length && builders.length < 1) {
                var BnewName = 'Builder' + Game.time;
                console.log('Spawning new builder: ' + BnewName);
                Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], BnewName,
                    {memory: {role: 'builder'}});
            }
        }
    }  //自动化spawning

    if(Game.spawns['Spawn1'].spawning) {
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            {align: 'left', opacity: 0.8});
    }  //spawning时提示

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'uharvester') {
            roleUHarvester.run(creep);
        }
        if(creep.memory.role == 'htransfer') {
            roleHTransfer.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if(creep.memory.role == 'mharvester') {
            roleMHarvester.run(creep);
        }
        if(creep.memory.role == 'mtransfer') {
            roleMTransfer.run(creep);
        }
    } //creeps分工

    var myTowers = Game.spawns['Spawn1'].room.find(FIND_MY_STRUCTURES, {
        filter: { structureType: STRUCTURE_TOWER }
    });
    for(var tower in myTowers){
        var closestHostile = myTowers[tower].pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            myTowers[tower].attack(closestHostile);
        }
        else {
            var closestDamagedStructure = myTowers[tower].pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                return structure.structureType != STRUCTURE_WALL &&
                        structure.structureType != STRUCTURE_RAMPART &&
                        structure.hits < structure.hitsMax;
                }
            });
            if(closestDamagedStructure) {
                myTowers[tower].repair(closestDamagedStructure);
            }
        }
    } //tower工作模块

    const ulink = Game.getObjectById("5e4471fd172319c455d44cd0");
    const clink = Game.getObjectById("5e4485c4cd07427ad140b233");
    if(ulink.store[RESOURCE_ENERGY] == 800 && clink.store[RESOURCE_ENERGY] <= 24){
        ulink.transferEnergy(clink);
    } //link工作模块
}