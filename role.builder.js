let roleBuilder = {

    run: function(creep) {
	    if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
            creep.say('🔄 harvest');
	    }
	    if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
	        creep.memory.building = true;
	        creep.say('🚧 build');
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
								structure.structureType != STRUCTURE_RAMPART &&
								structure.structureType != STRUCTURE_ROAD &&
								structure.structureType != STRUCTURE_CONTAINER &&
                                structure.hits < structure.hitsMax;
                    }
				});
				if(Rtargets.length > 0) {
					if(creep.repair(Rtargets[0]) == ERR_NOT_IN_RANGE) {
						creep.moveTo(Rtargets[0], {visualizePathStyle: {stroke: '#ffffff'}});
					}
				}
				else{
					var RampartTargets = creep.room.find(FIND_STRUCTURES, {
						filter: (structure) => {
							return  structure.structureType == STRUCTURE_RAMPART &&
									structure.hits < 5000000;
						}
					})
					RampartTargets.sort((a, b) => a.hits - b.hits);
					if(RampartTargets.length > 0){
						if(creep.repair(RampartTargets[0]) == ERR_NOT_IN_RANGE) {
							creep.moveTo(RampartTargets[0], {visualizePathStyle: {stroke: '#ffffff'}});
						}
					}
				}
			}
	    }
	    else {
			if(creep.withdraw(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
				creep.moveTo(creep.room.storage, {visualizePathStyle: {stroke: '#ffaa00'}});
			}
	    }
	}
};

module.exports = roleBuilder;