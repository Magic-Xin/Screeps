var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');

module.exports.loop = function () {

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }  //清理死亡creeps内存占用

    var energyAvailable = 0;
    energyAvailable += Game.spawns.Spawn1.energy;
    _.filter(Game.structures, function(structure){
        if (structure.structureType == STRUCTURE_EXTENSION){
            energyAvailable += structure.energy;
        }
    });  //Room内所有可用energy

    if(!Game.spawns['Spawn1'].spawning && energyAvailable >= 700) {
         var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
         //console.log('Harvesters: ' + harvesters.length);
        if(harvesters.length < 3) {
            var HnewName = 'Harvester' + Game.time;
            var sourceID = 1;
            console.log('Spawning new harvester: ' + HnewName);
            Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], HnewName, 
                {memory: {role: 'harvester', sourceID: sourceID}});
        }
        

        var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader')
        //console.log('Upgraders: ' + upgraders.length);
        if(harvesters.length >= 3 && upgraders.length < 1) {
            var UnewName = 'Upgrader' + Game.time;
            var sourceID = 0;
            console.log('Spawning new upgrader: ' + UnewName);
            Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], UnewName,
                {memory: {role: 'upgrader', sourceID: sourceID}});
        }

        var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder')
         //console.log('Builders: ' + builders.length);
        if(harvesters.length >= 3 && upgraders.length >= 1 && builders.length < 2) {
            var BnewName = 'Builder' + Game.time;
            var sourceID = 0;
            console.log('Spawning new builder: ' + BnewName);
            Game.spawns['Spawn1'].spawnCreep([WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], BnewName,
                {memory: {role: 'builder', sourceID: sourceID}});
        } //按需调配builder和upgrader
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
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
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
                return structure.hits < structure.hitsMax &&
                    structure.structureType != STRUCTURE_WALL;
                }
            });
            if(closestDamagedStructure) {
                myTowers[tower].repair(closestDamagedStructure);
            }
        }
    } //tower工作模块
}