let structureTower = {
    run: function(){
        var towers = Game.spawns['Spawn1'].room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_TOWER }
        });
        _.forEach(towers, function(tower){
            var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(closestHostile) {
                tower.attack(closestHostile);
            }
            else {
                var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                    return structure.structureType != STRUCTURE_WALL &&
                            structure.structureType != STRUCTURE_RAMPART &&
                            structure.hits < structure.hitsMax;
                    }
                });
                var closestDamagedCreep = tower.pos.findClosestByRange(FIND_CREEPS, {
                    filter: (creep) => {
                        return creep.hits < creep.hitsMax;
                    }
                });
                if(closestDamagedCreep){
                    tower.heal(closestDamagedCreep);
                }
                if(closestDamagedStructure) {
                    tower.repair(closestDamagedStructure);
               }
            }
        })
    }
}

module.exports = structureTower;