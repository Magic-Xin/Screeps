let Grafana = {
    run: function(){
        if (Game.time % 20) return;

        if(!Memory.grafana){
            Memory.grafana = {};
        }

        Memory.grafana.gcl = (Game.gcl.progress / Game.gcl.progressTotal) * 100
        Memory.grafana.gclLevel = Game.gcl.level
        Memory.grafana.gpl = (Game.gpl.progress / Game.gpl.progressTotal) * 100
        Memory.grafana.gplLevel = Game.gpl.level
        Memory.grafana.bucket = Game.cpu.bucket;
        Memory.grafana.cpu = Game.cpu.getUsed();
    }
}

module.exports = Grafana;