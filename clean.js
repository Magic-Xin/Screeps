let Clean = {
    run: function(){
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }  //清理死亡creeps内存占用
    }
}

module.exports =  Clean;