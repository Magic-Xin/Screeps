var roleUpgrader = {

    run: function(creep) {
        var container = Game.getObjectById('5e431a89078b755e8d17480f');
        if(creep.pos.isNearTo(17, 14)){
            if(creep.store.getFreeCapacity() == creep.store.getCapacity()){
                creep.withdraw(container, RESOURCE_ENERGY);
            }
            else {
                creep.upgradeController(creep.room.controller);
            }
        }
        else {
            creep.moveTo(17, 14);
        }
	}
};

module.exports = roleUpgrader;