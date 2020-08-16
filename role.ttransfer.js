let roleTTransfer = {

    run: function(creep) {
        const slink = Game.getObjectById('5e4af87b21466ee231ccb619');

        if(creep.pos.isEqualTo(20, 23)){

            if(creep.store.getFreeCapacity() < 0){
                creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
            }
            else{
                creep.transfer(creep.room.factory, RESOURCE_ENERGY);
            }

            /*
            if(creep.room.factory.store[RESOURCE_BATTERY] >= creep.store.getFreeCapacity()){
                if(creep.store.getFreeCapacity() > 0){
                    creep.withdraw(creep.room.factory, RESOURCE_BATTERY);
                }
                else{
                    creep.transfer(creep.room.storage, RESOURCE_BATTERY);
                }
            }

            if(creep.room.storage.store[RESOURCE_ENERGY] >= 500000){
                if(creep.room.factory.store[RESOURCE_ENERGY] < 20000){
                    if(creep.store.getFreeCapacity() > 0){
                        creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
                    }
                    else{
                        creep.transfer(creep.room.factory, RESOURCE_ENERGY);
                    }
                }
            }
            */

            /*
            if(creep.store.getFreeCapacity() > 0 && creep.room.factory.store[RESOURCE_KEANIUM_BAR] >= creep.store.getFreeCapacity()){
                creep.withdraw(creep.room.factory, RESOURCE_KEANIUM_BAR);
            }
            else{
                creep.transfer(creep.room.storage, RESOURCE_KEANIUM_BAR);
            }
            */

            /*
            if(creep.room.factory.store.getUsedCapacity(RESOURCE_ENERGY) < 10000){
                if(creep.store.getFreeCapacity() > 0){
                    creep.withdraw(creep.room.storage, RESOURCE_ENERGY);
                }
                else{
                    creep.transfer(creep.room.factory, RESOURCE_ENERGY);
                }
            }
            else if(creep.room.factory.store.getUsedCapacity(RESOURCE_KEANIUM) < 25000){
                if(creep.store.getFreeCapacity() > 0){
                    creep.withdraw(creep.room.storage, RESOURCE_KEANIUM);
                }
                else{
                    creep.transfer(creep.room.factory, RESOURCE_KEANIUM);
                }
            }
            */
        }
        else{
            creep.moveTo(20, 23);
        }
    }
}

module.exports = roleTTransfer;