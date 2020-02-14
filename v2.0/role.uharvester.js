var roleUHarvester = {

    run: function(creep) {
        var sources = Game.getObjectById('5bbcafd29099fc012e63b3e2')
        
        if(creep.pos.isEqualTo(20, 35)){
            creep.harvest(sources);
        }
        else {
            creep.moveTo(20, 35);
        }
	}
};

module.exports = roleUHarvester;