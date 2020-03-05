var roleMTransfer = {

    run: function(creep) {
        const container = Game.getObjectById('5e4be9bb16c51340d8710057');
        const storage = Game.getObjectById('5e4af3e12a3d56edbf66787d');
        var energy = container.store.getCapacity() - container.store.getFreeCapacity();
   
        if(creep.store.getFreeCapacity() == creep.store.getCapacity() && energy >= creep.store.getFreeCapacity()){
            if(creep.withdraw(container, RESOURCE_KEANIUM) == ERR_NOT_IN_RANGE){
                creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            if(creep.transfer(storage, RESOURCE_KEANIUM) == ERR_NOT_IN_RANGE){
                creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
}

module.exports = roleMTransfer;