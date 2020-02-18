var roleMTransfer = {

    run: function(creep) {
        var container = Game.getObjectById('5e4be9bb16c51340d8710057');
        var storage = Game.getObjectById('5e4af3e12a3d56edbf66787d');
        
        if(creep.store.getFreeCapacity() == creep.store.getCapacity()){
            if(creep.withdraw(container, RESOURCE_mineralType) == ERR_NOT_IN_RANGE){
                creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            if(creep.transfer(storage, RESOURCE_mineralType) == ERR_NOT_IN_RANGE){
                creep.moveTo(storage, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
}

module.exports = roleMTransfer;