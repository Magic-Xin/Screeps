let roleTransfer = {

    run: function(creep) {

        var containerMain = Game.getObjectById('5e43075b0d2fcf1e58db2faf');
        var containerBack = Game.getObjectById('5e4300d9a65a34014e3984ce');
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
            if(creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.storage, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }
}

module.exports = roleTransfer;