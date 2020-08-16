let roleUpgrader = {

    run: function(creep) {
        const link = Game.getObjectById('5e6e24520c6edd6c5a6f942e');
        if(creep.pos.isNearTo(16, 14)){
            if(creep.store.getFreeCapacity() == creep.store.getCapacity()){
                creep.withdraw(link, RESOURCE_ENERGY);
            }
            else {
                creep.upgradeController(creep.room.controller);
            }
        }
        else {
            creep.moveTo(16, 14);
        }
	}
};

module.exports = roleUpgrader;