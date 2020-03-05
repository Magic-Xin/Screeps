var roleHarvester = require('role.harvester');
var roleUHarvester = require('role.uharvester');
var roleHTransfer = require('role.htransfer');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleMHarvester = require('role.mharvester');
var roleMTransfer = require('role.mtransfer');
var roleSpawn = require('role.spawn');
var roleTower = require('role.tower')

module.exports.loop = function () {

    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }  //清理死亡creeps内存占用

    roleSpawn.run();
    roleTower.run();

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

    const ulink = Game.getObjectById("5e5f1435ffca371d3f44b1d5");
    const clink = Game.getObjectById("5e4485c4cd07427ad140b233");
    if(ulink.store[RESOURCE_ENERGY] == 800 && clink.store[RESOURCE_ENERGY] <= 24){
        ulink.transferEnergy(clink);
    } //link工作模块
}