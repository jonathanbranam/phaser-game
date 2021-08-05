var Vector2 = Phaser.Math.Vector2;

var Player = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Player(scene, x, y, texture) {
        Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, texture);

        this.pad = null;
        this.setData('lastShotTime', 0);
        this.setData('shootCooldown', 250);
    },

    setGamepad: function (pad) {
        console.log("Player " + this.name + " setGamepad: " + pad.index);
        this.pad = pad;
    },

    preUpdate: function (time, delta) {
        //console.log("Player " + this.name + " pre-update: " + delta);
        if (this.pad) {
            if (this.pad.A) {
                console.log("A");
            }
            var STICK_MIN = 0.1;
            if (Math.abs(this.pad.leftStick.x) > STICK_MIN || Math.abs(this.pad.leftStick.y) > STICK_MIN) {
                var a = Phaser.Math.Angle.Between(0, 0, this.pad.leftStick.x, this.pad.leftStick.y);
                //console.log(this.pad.leftStick, a*Phaser.Math.RAD_TO_DEG);
                this.rotation = a;
            }
            var SPEED = 200;
            this.setVelocity(this.pad.leftStick.x*SPEED, this.pad.leftStick.y*SPEED);
        }
    },
})

var TopdownTest1 = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function TopdownTest1 ()
    {
        Phaser.Scene.call(this, { key: 'topdown' });
    },

    preload: function ()
    {
        //this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
        //this.load.bitmapFont('atari', 'assets/fonts/bitmap/atari-smooth.png', 'assets/fonts/bitmap/atari-smooth.xml');
        this.load.image('ship', 'assets/games/asteroids/ship.png')
        this.load.image('bullet', 'assets/games/asteroids/bullets.png')
        this.load.image('ground', 'assets/sets/tiles/5.png');
    },

    onPadConnected: function (pad) {
        console.log("Gamepad connected: " + pad.index);
        if (pad.index === 0) {
            this.player.setGamepad(pad);
        } else if (pad.index === 1) {
            this.player2.setGamepad(pad);
        }
    },

    createPlayer: function (index, x, y) {
        var player = new Player(this, x, y, 'ship')
        player.name = "player-" + index;
        this.add.existing(player);
        this.physics.add.existing(player);
        player.setCollideWorldBounds(true);

        return player;
    },

    create: function ()
    {
        //  Enable world bounds
        this.physics.world.setBoundsCollision(true);

        this.player = this.createPlayer(0, 100, 300);
        this.player2 = this.createPlayer(1, 500, 300);
        this.players = [this.player, this.player2];

        //this.player = new Player(this, 400, 300, 'ship')
        //this.add.existing(this.player);
        //this.physics.add.existing(this.player);

        this.input.gamepad.on('connected', this.onPadConnected, this);

        var pads = this.input.gamepad.gamepads;
        console.log("Found " + pads.length + " game pads");

        //this.player.setup(pad);

        //this.player = this.physics.add.image(400, 300, 'ship');
        //this.player.setData('lastShotTime', 0);
        //this.player.setData('shootCooldown', 250);

        this.player1Keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Setup walls

        walls = this.physics.add.staticGroup();
        walls.add(this.add.tileSprite(0, 0, 25, 300, 'ground').setOrigin(0));
        walls.add(this.add.tileSprite(25, 0, 200, 25, 'ground').setOrigin(0));
        walls.add(this.add.tileSprite(200, 400, 200, 25, 'ground').setOrigin(0));

        this.physics.add.collider(this.players, walls);

        this.bullets = this.physics.add.group({
            maxSize: 25,
            collideWorldBounds: true,
        });

        this.physics.add.collider(this.bullets, walls, this.bulletHitWall, null, this);
        this.physics.world.on('worldbounds', this.onWorldBounds, this);

    },

    onWorldBounds: function (body) {
        var gameObject = body.gameObject;
        if (this.bullets.contains(gameObject)) {
            this.bulletHitWall(gameObject, null);
        }
    },

    bulletHitWall: function (bullet, wall) {
        bullet.disableBody(true, true);
    },

    update: function (time, delta)
    {
        var SPEED = 200;
        //var DIAG_SPEED = Math.sqrt(SPEED**2 / 2);
        var moving = true;
        if (this.player1Keys.up.isDown) {
            if (this.player1Keys.left.isDown) {
                this.player.angle = 225;
            } else if (this.player1Keys.right.isDown) {
                this.player.angle = 315;
            } else {
                this.player.angle = 270;
            }
        } else if (this.player1Keys.down.isDown) {
            if (this.player1Keys.left.isDown) {
                this.player.angle = 135;
            } else if (this.player1Keys.right.isDown) {
                this.player.angle = 45;
            } else {
                this.player.angle = 90;
            }
        } else {
            if (this.player1Keys.left.isDown) {
                this.player.angle = 180;
            } else if (this.player1Keys.right.isDown) {
                this.player.angle = 0;
            } else {
                moving = false;
            }
        }
        var facing = new Vector2(1, 0);
        Phaser.Math.Rotate(facing, this.player.angle*Phaser.Math.DEG_TO_RAD);
        if (moving) {
            this.player.setVelocity(facing.x * SPEED, facing.y * SPEED);
        } else {
            this.player.setVelocity(0, 0);
        }

        if (this.player1Keys.shoot.isDown) {
            var BULLET_SPEED = 300;
            if (time - this.player.getData('lastShotTime') > this.player.getData('shootCooldown')) {
                this.player.setData('lastShotTime', time);
                var bullet = this.bullets.get(this.player.x, this.player.y, 'bullet')
                if (bullet) {
                    bullet.body.onWorldBounds = true;
                    bullet.enableBody(true, this.player.x, this.player.y, true, true);
                    bullet.setVelocity(facing.x*BULLET_SPEED, facing.y*BULLET_SPEED);
                }
            }
        }
    }

});

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    input: {
        gamepad: true
    },
    scene: [ TopdownTest1 ],
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    }
};

var game = new Phaser.Game(config);

