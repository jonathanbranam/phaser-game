const Vector2 = Phaser.Math.Vector2;

function objMerge(a, b) {
    const r = {};
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

    abilityFireRate: 1/4,
    abilityDamage: 25,
    abilitySpeed: 6,

    // Dashes
    // number of dashes per second
    dashRate: 1/4,
    // duration of dash in ms
    dashDuration: 80,
    // speed of dash
    dashSpeed: 20,
}

const SPEED_SCALE = 50;
const DASH_SPEED_SCALE = 50;

class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, config) {
        super(scene, x, y, texture);

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
        this.bullets = {};
    }

    setupPlayer() {
        this.setupBulletGroup('bullet');
        this.setupBulletGroup('rpg');
    }

    setupBulletGroup(key) {
        const bullets = this.scene.physics.add.group({
            maxSize: 100,
            collideWorldBounds: true,
        });
        this.scene.addBulletGroup(bullets);

        this.bullets[key] = bullets;
    }

    shootBullet(key, x, y, vel_x, vel_y, damage) {
        const bullet = this.bullets[key].get(x, y, key)
        if (bullet) {
            bullet.type = 'bullet';
            bullet.setData('shotBy', this.name);
            bullet.setData('damage', damage);
            bullet.body.onWorldBounds = true;
            bullet.enableBody(true, x, y, true, true);
            bullet.setVelocity(vel_x, vel_y);
            bullet.rotation = this.rotation;
        }
    }

    checkActionRate(time, key) {
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
    }

    hitWall(wall) {
        // Stop dashing when you hit a wall
        this.isDashing = false;
    }

    reset() {
    }

    configure(config) {
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
    }

    setGamepad(pad) {
        console.log("Player " + this.name + " setGamepad: " + pad.index);
        this.pad = pad;
    }

    setKeys(keys) {
      this.keys = keys;
    }

    curSpeed() {
        return this.getData('speed');
    }

    curDashSpeed() {
        return this.getData('dashSpeed');
    }

    handleKeys(time, delta) {
        const SPEED = 200;
        let moving = true;
        if (this.keys.up.isDown) {
            if (this.keys.left.isDown) {
                this.angle = 225;
            } else if (this.keys.right.isDown) {
                this.angle = 315;
            } else {
                this.angle = 270;
            }
        } else if (this.keys.down.isDown) {
            if (this.keys.left.isDown) {
                this.angle = 135;
            } else if (this.keys.right.isDown) {
                this.angle = 45;
            } else {
                this.angle = 90;
            }
        } else {
            if (this.keys.left.isDown) {
                this.angle = 180;
            } else if (this.keys.right.isDown) {
                this.angle = 0;
            } else {
                moving = false;
            }
        }
        let facing = new Vector2(1, 0);
        Phaser.Math.Rotate(facing, this.angle*Phaser.Math.DEG_TO_RAD);
        if (moving) {
            this.setVelocity(facing.x * SPEED, facing.y * SPEED);
        } else {
            this.setVelocity(0, 0);
        }

        if (this.keys.primaryFire.isDown) {
            if (this.checkActionRate(time, 'primaryFireRate')) {
                const facing = new Vector2(1, 0);
                Phaser.Math.Rotate(facing, this.rotation);
                const bulletSpeed = this.getData('primarySpeed') * SPEED_SCALE;
                this.shootBullet('bullet', this.x, this.y,
                    facing.x*bulletSpeed, facing.y*bulletSpeed,
                    this.getData('primaryDamage'));
            }
        }

        if (this.keys.abilityFire.isDown) {
            if (this.checkActionRate(time, 'abilityFireRate')) {
                const facing = new Vector2(1, 0);
                Phaser.Math.Rotate(facing, this.rotation);
                const bulletSpeed = this.getData('abilitySpeed') * SPEED_SCALE;
                this.shootBullet('rpg', this.x, this.y,
                    facing.x*bulletSpeed, facing.y*bulletSpeed,
                    this.getData('abilityDamage'));
            }
        }

        if (this.isDashing) {
            if (time < this.dashUntil) {
                this.setVelocity(this.dashDirection.x*this.dashSpeedMult, this.dashDirection.y*this.dashSpeedMult);
            } else {
                this.isDashing = false;
            }
        }

        if (this.pad && this.pad.buttons[10].value && (Math.abs(this.pad.leftStick.x) > STICK_MIN || Math.abs(this.pad.leftStick.y) > STICK_MIN)) {
            if (this.checkActionRate(time, 'dashRate')) {
                this.isDashing = true;
                this.dashSpeedMult = this.curDashSpeed() * DASH_SPEED_SCALE;
                this.dashUntil = time + this.getData('dashDuration');
                this.dashDirection = new Vector2(this.pad.leftStick.x, this.pad.leftStick.y);
                this.dashDirection.normalize();
                this.setVelocity(this.dashDirection.x*this.dashSpeedMult, this.dashDirection.y*this.dashSpeedMult);
            }
        }

    }

    handleGamepad(time, delta) {
        const STICK_MIN = 0.05;
        if (Math.abs(this.pad.rightStick.x) > STICK_MIN || Math.abs(this.pad.rightStick.y) > STICK_MIN) {
            const a = Phaser.Math.Angle.Between(0, 0, this.pad.rightStick.x, this.pad.rightStick.y);
            //console.log(this.pad.leftStick, a*Phaser.Math.RAD_TO_DEG);
            this.rotation = a;
        }
        const speedMult = this.curSpeed() * SPEED_SCALE;
        this.setVelocity(this.pad.leftStick.x*speedMult, this.pad.leftStick.y*speedMult);

        if (this.pad.R2 > 0) {
            if (this.checkActionRate(time, 'primaryFireRate')) {
                const facing = new Vector2(1, 0);
                Phaser.Math.Rotate(facing, this.rotation);
                const bulletSpeed = this.getData('primarySpeed') * SPEED_SCALE;
                this.shootBullet('bullet', this.x, this.y,
                    facing.x*bulletSpeed, facing.y*bulletSpeed,
                    this.getData('primaryDamage'));
            }
        }

        if (this.pad.R1 > 0) {
            if (this.checkActionRate(time, 'abilityFireRate')) {
                const facing = new Vector2(1, 0);
                Phaser.Math.Rotate(facing, this.rotation);
                const bulletSpeed = this.getData('abilitySpeed') * SPEED_SCALE;
                this.shootBullet('rpg', this.x, this.y,
                    facing.x*bulletSpeed, facing.y*bulletSpeed,
                    this.getData('abilityDamage'));
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

    }

    preUpdate(time, delta) {
        if (this.state != 'dead') {
            if (this.pad) {
                this.handleGamepad(time, delta);
            } else if (this.keys) {
                this.handleKeys(time, delta);
            }
        }

        const health = this.getData('health');
        this.lifeBar.x = this.x;
        this.lifeBar.y = this.y;
        this.lifeBar.clear();

        this.lifeBar.lineStyle(1, '0x000000', 1.0);
        this.lifeBar.strokeRect(-10, -30, 20, 6);

        this.lifeBar.fillStyle('0x00FF00', 1.0);
        const lifeBarWidth = 20 * health / this.getData('maxHealth');
        this.lifeBar.fillRect(-10, -30, lifeBarWidth, 6);

    }

    die() {
        this.setData('health', 0);
        console.log(this.name + " DIED!");
        this.emit('died', this);
        this.state = 'dead';
    }

    bulletHit(bullet) {
        if (this.state == 'alive') {
            const health = this.getData('health');
            const damage = bullet.getData('damage');
            if (damage > health) {
                this.die();
            } else {
                this.setData('health', health - damage)
                this.camera.shake(250, 0.01);
                this.damagedParticles.emitParticleAt(this.x, this.y);
            }
        }
    }
}

class TopdownTest2 extends Phaser.Scene {

    constructor() {
        super({ key: 'topdown', active: true });
        this.gamepadsConnected = {};
        this.nextCheckGamepadsTime = 1000;
    }

    preload() {
        this.input.gamepad.on('connected', this.onPadConnected, this);
        //this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
        //this.load.bitmapFont('atari', 'assets/fonts/bitmap/atari-smooth.png', 'assets/fonts/bitmap/atari-smooth.xml');
        this.load.atlas('platformer', 'assets/sets/platformer.png', 'assets/sets/platformer.json');
        this.load.image('ship', 'assets/games/asteroids/ship.png')
        //this.load.image('bullet', 'assets/games/asteroids/bullets.png')
        this.load.image('bullet', 'assets/sprites/bullets/bullet5.png')
        this.load.image('rpg', 'assets/sprites/bullets/bullet10.png')
        this.load.image('ground', 'assets/sets/tiles/5.png');
        this.load.atlas('explosion', 'assets/particles/explosion.png', 'assets/particles/explosion.json');
    }

    onPadConnected(pad) {
        console.log("Gamepad connected: " + pad.index);
        this.gamepadsConnected[pad.index] = true;
        if (pad.index === 0) {
            this.player.setGamepad(pad);
        } else if (pad.index === 1) {
            this.player2.setGamepad(pad);
        }
    }

    createPlayer(index, x, y, config) {
        const player = new Player(this, x, y, 'ship', config)
        player.name = "player-" + index;
        this.add.existing(player);
        this.physics.add.existing(player);
        player.setCollideWorldBounds(true);

        return player;
    }

    create() {
        this.physics.world.setBounds(0, 0, 1600, 1200);

        //  Enable world bounds
        this.physics.world.setBoundsCollision(true);

        // Create scene
        this.add.tileSprite(0, 0, 1600, 1200, 'platformer', '5').setOrigin(0);

        const bushes = [
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
        for (let i = 0; i < 25; i++) {
            const x = Phaser.Math.RND.integerInRange(100, 1500);
            const y = Phaser.Math.RND.integerInRange(100, 1100);
            const bush = Phaser.Math.RND.pick(bushes);
            this.add.tileSprite(x, y, bush.width, bush.height, 'platformer', bush.frame).setOrigin(0);
        }

        // Setup rocks

        const walls = this.physics.add.staticGroup();

        for (let i = 0; i < 15; i++) {
            const x = Phaser.Math.RND.integerInRange(100, 1500);
            const y = Phaser.Math.RND.integerInRange(100, 1100);
            walls.add(this.add.tileSprite(x, y, 90, 54, 'platformer', 'rock').setOrigin(0));
        }


        // Create World Border
        const borderGroup = this.physics.add.staticGroup();
        borderGroup.add(this.add.rectangle(0, 0, 1600, 20, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(0, 1180, 1600, 20, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(0, 0, 20, 1200, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(1580, 0, 20, 1200, 0x202020).setOrigin(0))

        this.walls = walls;
        this.borderGroup = borderGroup;

        const player1Config = {
            speed: 6,
            primaryFireRate: 10,
            primaryDamage: 2,
            primarySpeed: 10,
        }

        const player2Config = {
            speed: 4,
            primaryFireRate: 4,
        }

        this.player = this.createPlayer(0, 100, 300, player1Config);

        this.player.setKeys(this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            primaryFire: Phaser.Input.Keyboard.KeyCodes.SPACE,
            abilityFire: Phaser.Input.Keyboard.KeyCodes.V
        }));
        this.player2 = this.createPlayer(1, 500, 300, player2Config);
        this.player2.setKeys(this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            primaryFire: Phaser.Input.Keyboard.KeyCodes.COMMA,
            abilityFire: Phaser.Input.Keyboard.KeyCodes.PERIOD
        }));
        this.players = [this.player, this.player2];
        for (let i = 0; i < 2; i++) {
            const player = this.players[i];
            player.on('shoot', this.onShoot, this);
            player.setupPlayer();
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

        const pads = this.input.gamepad.gamepads;
        console.log("Found " + pads.length + " game pads");


        this.physics.add.collider(this.players, walls, this.playerHitWall, null, this);
        this.physics.add.collider(this.players, borderGroup, this.playerHitWall, null, this);

        this.physics.add.collider(this.players, this.players, this.playerHitPlayer, null, this);

        this.physics.world.on('worldbounds', this.onWorldBounds, this);

        /*
        this.bullets = this.physics.add.group({
            maxSize: 100,
            collideWorldBounds: true,
        });

        this.physics.add.collider(this.bullets, walls, this.bulletHitWall, null, this);
        this.physics.add.collider(this.bullets, borderGroup, this.bulletHitWall, null, this);

        this.physics.add.overlap(this.bullets, this.players, this.bulletHitPlayer, null, this);
        */

    }

    addBulletGroup(bullets) {
        this.physics.add.collider(bullets, this.walls, this.bulletHitWall, null, this);
        this.physics.add.collider(bullets, this.borderGroup, this.bulletHitWall, null, this);

        this.physics.add.overlap(bullets, this.players, this.bulletHitPlayer, null, this);

    }


    playerHitPlayer(playerA, playerB) {
        //player.emit('hitWall', wall);
    }

    playerHitWall(player, wall) {
        player.emit('hitWall', wall);
    }

    bulletHitPlayer(objA, objB) {
        let bullet, player;
        if (objA.type === 'bullet') {
            bullet = objA;
            player = objB;
        } else {
            bullet = objB;
            player = objA;
        }
        if (bullet.getData("shotBy") != player.name) {
            //console.log("" + player.name + " HIT");
            bullet.disableBody(true, true);
            player.bulletHit(bullet);
        }
    }


    onShoot(player, x, y, dir_x, dir_y, damage) {
        //console.log("SHOOT", x, y, dir_x, dir_y);
        let bullet = this.bullets.get(x, y, 'bullet')
        if (bullet) {
            bullet.setData('shotBy', player.name);
            bullet.setData('damage', damage);
            bullet.body.onWorldBounds = true;
            bullet.enableBody(true, x, y, true, true);
            bullet.setVelocity(dir_x, dir_y);
        }
    }

    onWorldBounds(body) {
        const gameObject = body.gameObject;
        // TODO: this is wrong now
        /*
        if (this.bullets.contains(gameObject)) {
            this.bulletHitWall(gameObject, null);
        }*/
    }

    bulletHitWall(bullet, wall) {
        bullet.disableBody(true, true);
    }

    update(time, delta) {
        // periodically check for new gamepads
        if (time > this.nextCheckGamepadsTime) {
            const GAMEPAD_CHECK_TIME = 1000;
            this.nextCheckGamepadsTime = time + GAMEPAD_CHECK_TIME;
            const pads = this.input.gamepad.gamepads;
            for (let pad of pads) {
                if (!this.gamepadsConnected[pad.index]) {
                    console.log("Force on pad connected for " + pad.index);
                    this.onPadConnected(pad);
                }
            }
        }
    }

}

class TopdownGUI extends Phaser.Scene {

    constructor() {
        super({ key: 'topdown_gui', active: true });
    }

    preload() {
    }

    create() {
        const borders = this.add.graphics({
            lineStyle: {
                width: 2,
                color: 0x101010
            },
            fillStyle: {
                color: 0x101010
            }
        });

        borders.clear();
        const centerLine = new Phaser.Geom.Rectangle(0, 295, 800, 10);
        borders.fillRectShape(centerLine);

    }

}

const config = {
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

const game = new Phaser.Game(config);
