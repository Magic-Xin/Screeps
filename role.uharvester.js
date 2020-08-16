let roleUHarvester = {

    run: function(creep) {
        const source = Game.getObjectById('5bbcafd29099fc012e63b3e3');
        const link = Game.getObjectById('5e6e11e49aa74ee2fe6896a7');
        const container = Game.getObjectById('5e4300d9a65a34014e3984ce');

        if(creep.pos.isEqualTo(6, 37)){
            if(creep.store.getFreeCapacity() > 0){
                if(source.energy == 0){
                    creep.withdraw(container, RESOURCE_ENERGY);
                }
                else{
                    creep.harvest(source);
                }
            }
            else{
                if(link.store[RESOURCE_ENERGY] < 800){
                    creep.transfer(link, RESOURCE_ENERGY);
                }
                else if(container.store.getFreeCapacity() > 0){
                    creep.harvest(source);
                }
            }
        }
        else {
            creep.moveTo(6, 37);
        }
	}
};

module.exports = roleUHarvester;
