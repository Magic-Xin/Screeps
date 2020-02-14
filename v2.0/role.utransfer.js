var roleUTransfer = {

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
            var targets = Game.getObjectById('5e431a89078b755e8d17480f');
            if(creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(targets, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
        
    }
}

module.exports = roleUTransfer;