let structureLink = {
    run: function(){
        const sourcelink = Game.getObjectById('5e6e11e49aa74ee2fe6896a7');
        const controllerlink = Game.getObjectById('5e6e24520c6edd6c5a6f942e');
        const centerlink = Game.getObjectById('5e4af87b21466ee231ccb619');
        if(sourcelink.store[RESOURCE_ENERGY] == 800 && controllerlink.store[RESOURCE_ENERGY] <= 24){
            sourcelink.transferEnergy(controllerlink);
        }
        else if(sourcelink.store[RESOURCE_ENERGY] == 800 && centerlink.store[RESOURCE_ENERGY] <= 24){
            sourcelink.transferEnergy(centerlink);
        }
    }
}

module.exports = structureLink;