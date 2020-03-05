var roleUHarvester = {

    run: function(creep) {
        const source = Game.getObjectById('5bbcafd29099fc012e63b3e2');
        const link = Game.getObjectById('5e4471fd172319c455d44cd0');
        const container = Game.getObjectById('5e43075b0d2fcf1e58db2faf');
        
        if(creep.pos.isEqualTo(20, 35)){
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
            creep.moveTo(20, 35);
        }
	}
};

module.exports = roleUHarvester;
