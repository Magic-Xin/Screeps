let roleHarvester = {

    run: function(creep) {
        const source = Game.getObjectById('5bbcafd29099fc012e63b3e2')
        const container = Game.getObjectById('5e43075b0d2fcf1e58db2faf');

        if(creep.pos.isEqualTo(20, 35)){
            if(container.store.getFreeCapacity() > 0){
                creep.harvest(source);
            }
        }
        else {
            creep.moveTo(20, 35);
        }
	}
};

module.exports = roleHarvester;