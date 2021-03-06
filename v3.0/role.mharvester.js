var roleMHarvester = {

    run: function(creep) {
        const mineral = Game.getObjectById('5bbcb69ad867df5e542079f5')
        const container = Game.getObjectById('5e4be9bb16c51340d8710057');
        const extractor = Game.getObjectById('5e4a836f553e104331988475');

        if(creep.pos.isEqualTo(31, 3)){
            if(container.store.getFreeCapacity() > 0 && extractor.cooldown == 0){
                creep.harvest(mineral);
            }
        }
        else {
            creep.moveTo(31, 3);
        }
	}
};

module.exports = roleMHarvester;