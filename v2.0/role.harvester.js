var roleHarvester = {

    run: function(creep) {
        var sources = Game.getObjectById('5bbcafd29099fc012e63b3e3')
        if(creep.pos.isEqualTo(6, 37)){
            creep.harvest(sources);
        }
        else {
            creep.moveTo(6, 37);
        }
	}
};

module.exports = roleHarvester;