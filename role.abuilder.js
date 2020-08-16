var roleABuilder = {

    run: function(creep) {
		if(creep.room.name == 'E48S12'){
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
									structure.hits < structure.hitsMax;
						}
					});
					Rtargets.sort((a,b) => a.hits - b.hits);
					if(Rtargets.length > 0) {
						if(creep.repair(Rtargets[0]) == ERR_NOT_IN_RANGE) {
							creep.moveTo(Rtargets[0], {visualizePathStyle: {stroke: '#ffffff'}});
						}
					}
				}
			}
			else {
				var sources = creep.room.find(FIND_SOURCES);
				if(creep.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
					creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
				}
			}
		}
		else{
			creep.moveTo(new RoomPosition(25, 25, 'E48S12'), {visualizePathStyle: {stroke: '#ffffff'}});
		}
	}
};

module.exports = roleABuilder;