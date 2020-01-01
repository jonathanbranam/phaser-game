var Vector2 = Phaser.Math.Vector2;

function objMerge(a, b) {
    var r = {};
    const aKeys = Object.keys(a);
    // Loop over keys in a
    for (const key of aKeys) {
        // If b also has it, then we want b
        if (b.hasOwnProperty(key)) {
            // unless it's another object, then merge those
            if (typeof(b[key]) === 'object') {
                r[key] = objMerge(a[key], b[key]);
            } else {
                r[key] = b[key];
            }
        } else {
            if (typeof(a[key]) === 'object') {
                r[key] = objMerge(a[key], {});
            } else {
                r[key] = a[key];
            }
        }
    }
    const bKeys = Object.keys(b);
    // Loop over keys in b
    for (const key of bKeys) {
        // If we've haven't already processed this one.
        if (!aKeys.includes(key)) {
            if (typeof(b[key]) === 'object') {
                r[key] = objMerge({}, b[key]);
            } else {
                r[key] = b[key];
            }
        }
    }
    return r;
}


const PLAYER_CONFIG_DEFAULTS = {
    health: 100,
    speed: 4,

    // number of bullets fired per second
    primaryFireRate: 4,
    // damage per bullet
    primaryDamage: 5,
    // speed of primary ranged attack
    primarySpeed: 6,

    // Dashes
    // number of dashes per second
    dashRate: 1,
    // duration of dash in ms
    dashDuration: 80,
    // speed of dash
    dashSpeed: 20,
}

const SPEED_SCALE = 50;
const DASH_SPEED_SCALE = 50;

var Player = new Phaser.Class({
    Extends: Phaser.Physics.Arcade.Sprite,

    initialize: function Player(scene, x, y, texture, config) {
        Phaser.Physics.Arcade.Sprite.call(this, scene, x, y, texture);

        this.pad = null;

        this.configure(config);

        this.reset();

        this.lifeBar = this.scene.add.graphics();
        this.state = 'alive';

        this.on('hitWall', this.hitWall, this);

        this.damagedParticles = this.scene.add.particles('explosion');

        this.damagedParticles.createEmitter({
            frame: 'red',
            angle: {
                min: 0, max: 360, steps: 16
            },
            lifespan: 250,
            speed: 400,
            quantity: 16,
            scale: {
                start: 0.3, end: 0
            },
            on: false,
        })

        this.coolDowns = {};
    },

    checkActionRate: function (time, key) {
        if (this.coolDowns.hasOwnProperty(key)) {
            if (time > this.coolDowns[key]) {
                this.coolDowns[key] = time + 1000 / this.getData(key);
                return true;
            } else {
                return false;
            }
        } else {
            this.coolDowns[key] = time + 1000 / this.getData(key);
            return true;
        }
    },

    hitWall: function (wall) {
        // Stop dashing when you hit a wall
        this.isDashing = false;
    },

    reset: function () {
    },

    configure: function (config) {
        if (config) {
            config = objMerge(PLAYER_CONFIG_DEFAULTS, config);
        } else {
            config = PLAYER_CONFIG_DEFAULTS;
        }

        const configKeys = Object.keys(config);
        for (const key of configKeys) {
            this.setData(key, config[key]);
        }

        this.setData('maxHealth', config.health);
    },

    setGamepad: function (pad) {
        console.log("Player " + this.name + " setGamepad: " + pad.index);
        this.pad = pad;
    },

    curSpeed: function () {
        return this.getData('speed');
    },

    curDashSpeed: function () {
        return this.getData('dashSpeed');
    },

    handleGamepad: function (time, delta) {
        var STICK_MIN = 0.05;
        if (Math.abs(this.pad.rightStick.x) > STICK_MIN || Math.abs(this.pad.rightStick.y) > STICK_MIN) {
            var a = Phaser.Math.Angle.Between(0, 0, this.pad.rightStick.x, this.pad.rightStick.y);
            //console.log(this.pad.leftStick, a*Phaser.Math.RAD_TO_DEG);
            this.rotation = a;
        }
        var speedMult = this.curSpeed() * SPEED_SCALE;
        this.setVelocity(this.pad.leftStick.x*speedMult, this.pad.leftStick.y*speedMult);

        if (this.pad.R2 > 0) {
            if (this.checkActionRate(time, 'primaryFireRate')) {
                var facing = new Vector2(1, 0);
                Phaser.Math.Rotate(facing, this.rotation);
                var bulletSpeed = this.getData('primarySpeed') * SPEED_SCALE;
                this.emit('shoot', this,
                    this.x, this.y,
                    facing.x*bulletSpeed, facing.y*bulletSpeed,
                    this.getData('primaryDamage'));
            }
        }

        if (this.isDashing) {
            if (time < this.dashUntil) {
                this.setVelocity(this.dashDirection.x*this.dashSpeedMult, this.dashDirection.y*this.dashSpeedMult);
            } else {
                this.isDashing = false;
            }
        }

        if (this.pad.buttons[10].value && (Math.abs(this.pad.leftStick.x) > STICK_MIN || Math.abs(this.pad.leftStick.y) > STICK_MIN)) {
            if (this.checkActionRate(time, 'dashRate')) {
                this.isDashing = true;
                this.dashSpeedMult = this.curDashSpeed() * DASH_SPEED_SCALE;
                this.dashUntil = time + this.getData('dashDuration');
                this.dashDirection = new Vector2(this.pad.leftStick.x, this.pad.leftStick.y);
                this.dashDirection.normalize();
                this.setVelocity(this.dashDirection.x*this.dashSpeedMult, this.dashDirection.y*this.dashSpeedMult);
            }
        }

    },

    preUpdate: function (time, delta) {
        //console.log("Player " + this.name + " pre-update: " + delta);
        if (this.state != 'dead') {
            if (this.pad) {
                this.handleGamepad(time, delta);
            }
        }

        var health = this.getData('health');
        this.lifeBar.x = this.x;
        this.lifeBar.y = this.y;
        this.lifeBar.clear();

        this.lifeBar.lineStyle(1, '0x000000', 1.0);
        this.lifeBar.strokeRect(-10, -30, 20, 6);

        this.lifeBar.fillStyle('0x00FF00', 1.0);
        var lifeBarWidth = 20 * health / this.getData('maxHealth');
        this.lifeBar.fillRect(-10, -30, lifeBarWidth, 6);

    },

    die: function () {       
        this.setData('health', 0);
        console.log(this.name + " DIED!");
        this.emit('died', this);
        this.state = 'dead';
    },

    bulletHit: function (bullet) {
        if (this.state == 'alive') {
            var health = this.getData('health');
            var damage = bullet.getData('damage');
            if (damage > health) {
                this.die();
            } else {
                this.setData('health', health - damage)
                this.camera.shake(250, 0.01);
                this.damagedParticles.emitParticleAt(this.x, this.y);
            }
        }
    },
})

var TopdownTest2 = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function TopdownTest2 ()
    {
        Phaser.Scene.call(this, { key: 'topdown', active: true });
        this.gamepadsConnected = {};
        this.nextCheckGamepadsTime = 1000;
    },

    preload: function ()
    {
        this.input.gamepad.on('connected', this.onPadConnected, this);
        //this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
        //this.load.bitmapFont('atari', 'assets/fonts/bitmap/atari-smooth.png', 'assets/fonts/bitmap/atari-smooth.xml');
        this.load.atlas('platformer', 'assets/sets/platformer.png', 'assets/sets/platformer.json');
        this.load.image('ship', 'assets/games/asteroids/ship.png')
        this.load.image('bullet', 'assets/games/asteroids/bullets.png')
        this.load.image('ground', 'assets/sets/tiles/5.png');
        this.load.atlas('explosion', 'assets/particles/explosion.png', 'assets/particles/explosion.json');
    },

    onPadConnected: function (pad) {
        console.log("Gamepad connected: " + pad.index);
        this.gamepadsConnected[pad.index] = true;
        if (pad.index === 0) {
            this.player.setGamepad(pad);
        } else if (pad.index === 1) {
            this.player2.setGamepad(pad);
        }
    },

    createPlayer: function (index, x, y, config) {
        var player = new Player(this, x, y, 'ship', config)
        player.name = "player-" + index;
        this.add.existing(player);
        this.physics.add.existing(player);
        player.setCollideWorldBounds(true);

        return player;
    },

    create: function ()
    {
        this.physics.world.setBounds(0, 0, 1600, 1200);

        //  Enable world bounds
        this.physics.world.setBoundsCollision(true);

        // Create scene
        this.add.tileSprite(0, 0, 1600, 1200, 'platformer', '5').setOrigin(0);

        var bushes = [
            {
                frame: 'bush1',
                width: 133,
                height: 65
            },
            {
                frame: 'bush2',
                width: 133,
                height: 65
            },
            {
                frame: 'bush3',
                width: 73,
                height: 47
            },
            {
                frame: 'bush4',
                width: 73,
                height: 46
            }
        ];
        for (var i = 0; i < 25; i++) {
            x = Phaser.Math.RND.integerInRange(100, 1500);
            y = Phaser.Math.RND.integerInRange(100, 1100);
            var bush = Phaser.Math.RND.pick(bushes);
            this.add.tileSprite(x, y, bush.width, bush.height, 'platformer', bush.frame).setOrigin(0);
        }

        // Setup rocks

        var walls = this.physics.add.staticGroup();

        for (var i = 0; i < 15; i++) {
            x = Phaser.Math.RND.integerInRange(100, 1500);
            y = Phaser.Math.RND.integerInRange(100, 1100);
            walls.add(this.add.tileSprite(x, y, 90, 54, 'platformer', 'rock').setOrigin(0));
        }
           

        // Create World Border
        var borderGroup = this.physics.add.staticGroup();
        borderGroup.add(this.add.rectangle(0, 0, 1600, 20, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(0, 1180, 1600, 20, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(0, 0, 20, 1200, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(1580, 0, 20, 1200, 0x202020).setOrigin(0))

        var player1Config = {
            speed: 6,
            primaryFireRate: 10,
            primaryDamage: 2,
            primarySpeed: 10,
        }

        var player2Config = {
            speed: 4,
            primaryFireRate: 4,
        }

        this.player = this.createPlayer(0, 100, 300, player1Config);
        this.player2 = this.createPlayer(1, 500, 300, player2Config);
        this.players = [this.player, this.player2];
        for (var i = 0; i < 2; i++) {
            var player = this.players[i];
            player.on('shoot', this.onShoot, this);
            //player.on('died', this.onDied, this);
        }

        // Setup cameras
        this.camera2 = this.cameras.add(0, 0, 800, 600);
        this.cameras.main.setBounds(0, 0, 1600, 1200);
        this.camera2.setBounds(0, 0, 1600, 1200);
        this.cameras.main.setViewport(0, 0, 800, 300)
        this.camera2.setViewport(0, 300, 800, 300)
        this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
        this.camera2.startFollow(this.player2, true, 0.2, 0.2);
        this.player.camera = this.cameras.main;
        this.player2.camera = this.camera2;

        //this.player = new Player(this, 400, 300, 'ship')
        //this.add.existing(this.player);
        //this.physics.add.existing(this.player);

        var pads = this.input.gamepad.gamepads;
        console.log("Found " + pads.length + " game pads");


        this.physics.add.collider(this.players, walls, this.playerHitWall, null, this);
        this.physics.add.collider(this.players, borderGroup, this.playerHitWall, null, this);

        this.physics.add.collider(this.players, this.players, this.playerHitPlayer, null, this);

        this.bullets = this.physics.add.group({
            maxSize: 100,
            collideWorldBounds: true,
        });

        this.physics.add.collider(this.bullets, walls, this.bulletHitWall, null, this);
        this.physics.add.collider(this.bullets, borderGroup, this.bulletHitWall, null, this);
        this.physics.world.on('worldbounds', this.onWorldBounds, this);

        this.physics.add.overlap(this.bullets, this.players, this.bulletHitPlayer, null, this);


    },

    playerHitPlayer: function (playerA, playerB) {
        //player.emit('hitWall', wall);
    },

    playerHitWall: function (player, wall) {
        player.emit('hitWall', wall);
    },

    bulletHitPlayer: function (player, bullet) {
        if (bullet.getData("shotBy") != player.name) {
            //console.log("" + player.name + " HIT");
            bullet.disableBody(true, true);
            player.bulletHit(bullet);
        }
    },


    onShoot: function (player, x, y, dir_x, dir_y, damage) {
        //console.log("SHOOT", x, y, dir_x, dir_y);
        var bullet = this.bullets.get(x, y, 'bullet')
        if (bullet) {
            bullet.setData('shotBy', player.name);
            bullet.setData('damage', damage);
            bullet.body.onWorldBounds = true;
            bullet.enableBody(true, x, y, true, true);
            bullet.setVelocity(dir_x, dir_y);
        }
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
        // periodically check for new gamepads
        if (time > this.nextCheckGamepadsTime) {
            var GAMEPAD_CHECK_TIME = 1000;
            this.nextCheckGamepadsTime = time + GAMEPAD_CHECK_TIME;
            var pads = this.input.gamepad.gamepads;
            for (var pad of pads) {
                if (!this.gamepadsConnected[pad.index]) {
                    console.log("Force on pad connected for " + pad.index);
                    this.onPadConnected(pad);
                }
            }
        }
    }

});

var TopdownGUI = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function TopdownGUI ()
    {
        Phaser.Scene.call(this, { key: 'topdown_gui', active: true });
    },

    preload: function ()
    {
    },

    create: function ()
    {
        var borders = this.add.graphics({
            lineStyle: {
                width: 2,
                color: 0x101010
            },
            fillStyle: {
                color: 0x101010
            }
        });

        borders.clear();
        var centerLine = new Phaser.Geom.Rectangle(0, 295, 800, 10);
        borders.fillRectShape(centerLine);

    },

});

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    input: {
        gamepad: true
    },
    scene: [ TopdownTest2, TopdownGUI ],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

var game = new Phaser.Game(config);

