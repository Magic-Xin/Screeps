var roleBuilder = {

    run: function(creep) {
	    if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
		}

		var containerMain = Game.getObjectById('5e43075b0d2fcf1e58db2faf');
        var containerBack = Game.getObjectById('5e4300d9a65a34014e3984ce');
        var container;
        if(containerMain.store[RESOURCE_ENERGY] == 0 && creep.room.energyAvailable == creep.room.energyCapacityAvailable){
            container = containerBack;
        }
        else {
            container = containerMain;
        }
		
	    if(creep.memory.building) {
			var targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
			}
			else {
				var Rtargets = creep.room.find(FIND_STRUCTURES, {
					filter: (structure) => {
						return structure.structureType != STRUCTURE_WALL && 
								// structureType != STRUCTURE_RAMPART &&
								structure.structureType != STRUCTURE_ROAD &&
                                structure.hits < structure.hitsMax;
                    }
				});
				if(Rtargets.length > 0) {
					if(creep.repair(Rtargets[0]) == ERR_NOT_IN_RANGE) {
						creep.moveTo(Rtargets[0], {visualizePathStyle: {stroke: '#ffffff'}});
					}
				}
			}
	    }
	    else {
			if(creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
				creep.moveTo(container, {visualizePathStyle: {stroke: '#ffaa00'}});
			}
	    }
	}
};

module.exports = roleBuilder;