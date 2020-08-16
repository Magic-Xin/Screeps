let roleMTransfer = {

    run: function(creep) {
        const container = Game.getObjectById('5e4be9bb16c51340d8710057');

        if(creep.store.getFreeCapacity() == creep.store.getCapacity() && container.store.getUsedCapacity() >= creep.store.getFreeCapacity()){
            if(creep.withdraw(container, RESOURCE_KEANIUM) == ERR_NOT_IN_RANGE){
                creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            if(creep.transfer(creep.room.storage, RESOURCE_KEANIUM) == ERR_NOT_IN_RANGE){
                creep.moveTo(creep.room.storage, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
}

module.exports = roleMTransfer;