var roleSpawn = {
    run: function(){
        const mineral = Game.getObjectById('5bbcb69ad867df5e542079f5');

        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        var uharvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'uharvester');
        var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader')
        var htransfers = _.filter(Game.creeps, (creep) => creep.memory.role == 'htransfer')
        var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder')
        var mharvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'mharvester')
        var mtransfers = _.filter(Game.creeps, (creep) => creep.memory.role == 'mtransfer')
        var CStarget = mineral.room.find(FIND_CONSTRUCTION_SITES);

        _.forEach(Game.spawns, function(spawn){
            if(!spawn.spawning && spawn.room.energyAvailable >= 1250){
                if(spawn.name == 'Spawn0'){
                    if(harvesters.length < 1) {
                        var HnewName = 'Harvester' + Game.time;
                        console.log('Spawning new harvester: ' + HnewName);
                        spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE], HnewName,
                            {memory: {role: 'harvester'}});
                    }

                    else if(htransfers.length < 1) {
                        var HTnewName = 'HTransfer' + Game.time;
                        console.log('Spawning new htransfer: ' + HTnewName);
                        spawn.spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], HTnewName,
                            {memory: {role: 'htransfer'}});
                    }

                    else if(uharvesters.length < 1) {
                        var UHnewName = 'UHarvester' + Game.time;
                        console.log('Spawning new uharvester: ' + UHnewName);
                        spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE], UHnewName,
                            {memory: {role: 'uharvester'}});
                    }
                }
                else if(spawn.name == 'Spawn1'){
                    if(mineral.mineralAmount > 0){
                        if(upgraders.length < 1) {
                            var UnewName = 'Upgrader' + Game.time;
                            console.log('Spawning new upgrader: ' + UnewName);
                            spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], UnewName,
                                {memory: {role: 'upgrader'}});
                        }

                        else if(mharvesters.length < 1) {
                            var MHnewName = 'MHarvester' + Game.time;
                            console.log('Spawning new mharvester: ' + MHnewName);
                            spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE], MHnewName,
                                {memory: {role: 'mharvester'}});
                        }

                        else if(mtransfers.length < 1) {
                            var MTnewName = 'MTransfer' + Game.time;
                            console.log('Spawning new mtransfer: ' + MTnewName);
                            spawn.spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], MTnewName,
                                {memory: {role: 'mtransfer'}});
                        }
                    }

                    else if(upgraders.length < 1){
                        var UnewName = 'Upgrader' + Game.time;
                        console.log('Spawning new upgrader: ' + UnewName);
                        spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], UnewName,
                            {memory: {role: 'upgrader'}});
                    }

                    else if(CStarget.length && builders.length < 2) {
                        var BnewName = 'Builder' + Game.time;
                        console.log('Spawning new builder: ' + BnewName);
                        spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE], BnewName,
                            {memory: {role: 'builder'}});
                    }
                }
            }//自动化spawning

            if(spawn.spawning) {
                var spawningCreep = Game.creeps[spawn.spawning.name];
                spawn.room.visual.text(
                    '🛠️' + spawningCreep.memory.role,
                    spawn.pos.x + 1,
                    spawn.pos.y,
                    {align: 'left', opacity: 0.8});
            }//spawning时提示
        })
    }
}

module.exports = roleSpawn;