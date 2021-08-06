const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 400;

class WorldScene extends Phaser.Scene {

    preload() {
        this.load.atlas('wolverine', '/assets/characters/wolverine/wolverine.png', '/assets/characters/wolverine/wolverine.json');
    }

    create() {
        const w = this.add.sprite(50, 50, 'wolverine', 'no-claws-walk-2');
        this.anims.create({
            key: 'wolverine-walk',
            //frames: ['beast-walk-1', 'beast-walk-2'],
            frames: this.anims.generateFrameNames('wolverine', { prefix: 'no-claws-walk-', start: 1, end: 2 }),
            frameRate: 4,
            repeat: -1,
        });
        w.play('wolverine-walk');

        const player = new Phaser.Physics.Arcade.Sprite(this, 100, 100, 'wolverine');
        player.name = "player-0";
        this.add.existing(player);
        this.physics.add.existing(player);
        player.setCollideWorldBounds(true);
        player.play('wolverine-walk');
        player.setVelocity(4,4);
        player.rotation = 1.5;

    }

}

const config = {
    type: Phaser.AUTO,
    //width: 800,
    //height: 600,
    scale: {
        parent: 'body',
        mode: Phaser.Scale.FIT,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
        //autoRound: true,
    },
    input: {
        gamepad: true
    },
    scene: [ WorldScene ],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
