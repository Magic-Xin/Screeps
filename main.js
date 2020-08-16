let roleHarvester = require('role.harvester');
let roleAHarvester = require('role.aharvester');
let roleUHarvester = require('role.uharvester');
let roleHTransfer = require('role.htransfer');
let roleUpgrader = require('role.upgrader');
let roleAUpgrader = require('role.aupgrader');
let roleBuilder = require('role.builder');
let roleABuilder = require('role.abuilder');
let roleMHarvester = require('role.mharvester');
let roleMTransfer = require('role.mtransfer');
let roleTTransfer = require('role.ttransfer');
let roleTransfer = require('role.transfer');
let roleClaimer = require('role.claimer')

let structureSpawn = require('structure.spawn');
let structureTower = require('structure.tower');
let structureLink = require('structure.link');
let structureFactory = require('structure.factory');

let Clean = require('clean');
let Grafana = require('grafana');

require('creepmove');
require('structurecache');

for(let room in Game.rooms){
    Game.rooms[room].update();  // 在第一次见到某房间或某房间中出现新建筑时调用room.update()函数更新缓存
}

module.exports.loop = function () {
    structureSpawn.run();
    structureTower.run();
    structureLink.run();
    structureFactory.run();

    for(let name in Game.creeps) {
        let creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'aharvester') {
            roleAHarvester.run(creep);
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
        if(creep.memory.role == 'aupgrader') {
            roleAUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if(creep.memory.role == 'abuilder') {
            roleABuilder.run(creep);
        }
        if(creep.memory.role == 'mharvester') {
            roleMHarvester.run(creep);
        }
        if(creep.memory.role == 'mtransfer') {
            roleMTransfer.run(creep);
        }
        if(creep.memory.role == 'ttransfer') {
            roleTTransfer.run(creep);
        }
        if(creep.memory.role == 'transfer') {
            roleTransfer.run(creep);
        }
        if(creep.memory.role == 'claimer') {
            roleClaimer.run(creep);
        }
    } //creeps分工

    Clean.run();
    Grafana.run();
}