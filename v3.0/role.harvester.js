var roleHarvester = {

    run: function(creep) {
        const source = Game.getObjectById('5bbcafd29099fc012e63b3e3')
        const container = Game.getObjectById('5e4300d9a65a34014e3984ce');

        if(creep.pos.isEqualTo(6, 37)){
            if(container.store.getFreeCapacity() > 0){
                creep.harvest(source);
            }
        }
        else {
            creep.moveTo(6, 37);
        }
	}
};

module.exports = roleHarvester;