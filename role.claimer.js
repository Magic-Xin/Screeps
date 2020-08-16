let roleClaimer = {
    run: function(creep){
        const room = Game.rooms['E48S12']
        // 如果该房间不存在就先往房间走
        if (!room) {
            creep.moveTo(new RoomPosition(25, 25, 'E48S12'))
        }
        else {
            // 如果房间存在了就说明已经进入了该房间
            // 移动到房间的控制器并占领
            if (creep.claimController(room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(room.controller, {visualizePathStyle: {stroke: '#ffffff'}})
            }
        }
    }
}

module.exports = roleClaimer;