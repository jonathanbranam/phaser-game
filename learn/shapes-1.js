var Vector2 = Phaser.Math.Vector2;

class ShapesGames2 extends Phaser.Scene {
    constructor() {
        console.log('ShapesGames2 constructor')
        super({ key: 'shapesgame2' });
    }

    initialize() {
        console.log('ShapesGames2 initialize')
        super.initialize({ key: 'shapesgame2' });
    }

    onPointerDown(pointer, gameObject, event) {
        console.log("circle pointerdown " + gameObject.type + " " + gameObject.name);
    }

    createCircle(x, y) {
        const circle1 = this.add.circle(x, y, 20, 0x0000a0);

        circle1.name = `circle-${this.circles.length}`;

        circle1.isStroked = true;
        circle1.lineWidth = 4;
        circle1.strokeColor = 0x2020ef;
        
        circle1.setInteractive();
        //circle1.on('pointerdown', this.onPointerDown);

        //this.physics.add.existing(player);

        this.circles.push(circle1);
        return circle1;
    }

    create()
    {
        //  Enable world bounds
        this.physics.world.setBoundsCollision(true);

        this.circles = [];
        this.createCircle(120, 130);
        this.createCircle(190, 130);

        this.input.on('gameobjectdown', this.onPointerDown);

        //this.physics.world.on('worldbounds', this.onWorldBounds, this);
    }

    onWorldBounds(body) {
        var gameObject = body.gameObject;
    }

    update(time, delta)
    {
        //console.log(`update(${time}, ${delta}`);
    }


} 

var ShapesGames = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function ShapesGames ()
    {
        Phaser.Scene.call(this, { key: 'shapesgame' });
    },

    preload: function ()
    {
        //this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
        //this.load.bitmapFont('atari', 'assets/fonts/bitmap/atari-smooth.png', 'assets/fonts/bitmap/atari-smooth.xml');
        //this.load.image('ship', 'assets/games/asteroids/ship.png')
        //this.load.image('bullet', 'assets/games/asteroids/bullets.png')
        //this.load.image('ground', 'assets/sets/tiles/5.png');
    },

    onPointerDown: function (pointer, gameObject, event) {
        console.log("circle pointerdown " + gameObject);
    },

    createCircle: function (x, y) {
        var circle1 = this.add.circle(x, y, 20, 0x0000a0);

        circle1.isStroked = true;
        circle1.lineWidth = 4;
        circle1.strokeColor = 0x0000ff;
         
        circle1.on('gameobjectdown', this.onPointerDown);
        //this.physics.add.existing(player);

        return circle1;
    },

    create: function ()
    {
        //  Enable world bounds
        this.physics.world.setBoundsCollision(true);

        this.createCircle(120, 130);
        this.createCircle(140, 130);

        /*

        this.player = this.createPlayer(0, 100, 300);
        this.player2 = this.createPlayer(1, 500, 300);
        this.players = [this.player, this.player2];

        walls = this.physics.add.staticGroup();
        walls.add(this.add.tileSprite(0, 0, 25, 300, 'ground').setOrigin(0));
        walls.add(this.add.tileSprite(25, 0, 200, 25, 'ground').setOrigin(0));
        walls.add(this.add.tileSprite(200, 400, 200, 25, 'ground').setOrigin(0));

        this.physics.add.collider(this.players, walls);
        */

        this.physics.world.on('worldbounds', this.onWorldBounds, this);

    },

    onWorldBounds: function (body) {
        var gameObject = body.gameObject;
    },

    update: function (time, delta)
    {
    }

});

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [ ShapesGames2 ],
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    }
};

const game = new Phaser.Game(config);

