let structureFactory = {
    run: function(){
        const factory = Game.getObjectById('5e60b3fe247b42072606c877');

        if(factory.store.getFreeCapacity() > 0 && factory.cooldown == 0){
            /*
            if(factory.store[RESOURCE_KEANIUM] >= 500 && factory.store[RESOURCE_ENERGY] >= 200){
                if(factory.produce(RESOURCE_KEANIUM_BAR) == 0){
                    console.log('Producing KEANIUM BAR');
                }
            }
            */

            /*
            if(factory.store[RESOURCE_ENERGY] >= 650){
                if(factory.produce(RESOURCE_BATTERY) == 0){
                    factory.room.visual.text(
                        'Producing Battery',
                        factory.pos.x + 1,
                        factory.pos.y,
                        {align: 'left', opacity: 0.8});
                }
            }
            */

            /*
           if(factory.produce(RESOURCE_CONDENSATE) == 0){
            factory.room.visual.text(
                'Producing Condensate',
                factory.pos.x + 1,
                factory.pos.y,
                {align: 'left', opacity: 0.8});
            }
            */
        }
    }
}

module.exports = structureFactory;