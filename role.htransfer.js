var roleHTransfer = {

    run: function(creep) {
        var energyAvailable = 0;
        energyAvailable += Game.spawns.Spawn1.energy;
        _.filter(Game.structures, function(structure){
            if (structure.structureType == STRUCTURE_EXTENSION){
                energyAvailable += structure.energy;
            }
        }); 

        var containerMain = Game.getObjectById('5e4300d9a65a34014e3984ce');
        var containerBack = Game.getObjectById('5e43075b0d2fcf1e58db2faf');
        var container;
        if(containerMain.store[RESOURCE_ENERGY] == 0){
            container = containerBack;
        }
        else {
            container = containerMain;
        }
        if(creep.store.getFreeCapacity() == creep.store.getCapacity()){
            if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            if(energyAvailable < 1800){
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_EXTENSION) && 
                                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
                if(targets.length > 0) {
                    if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
            else {
                var targets = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType == STRUCTURE_TOWER && 
                                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
                });
                if(targets.length > 0) {
                    if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        }
    }
}

module.exports = roleHTransfer;