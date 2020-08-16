let roleMHarvester = {

    run: function(creep) {
        const container = Game.getObjectById('5e4be9bb16c51340d8710057');

        if(creep.pos.isEqualTo(31, 3)){
            if(container.store.getFreeCapacity() > 0 && creep.room.extractor.cooldown == 0){
                creep.harvest(creep.room.mineral);
            }
        }
        else {
            creep.moveTo(31, 3);
        }
	}
};

module.exports = roleMHarvester;