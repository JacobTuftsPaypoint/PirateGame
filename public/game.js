import WorldMap from "./scenes/World.js";

const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
            debug:true
		},
  	},
    scene: [WorldMap]
});