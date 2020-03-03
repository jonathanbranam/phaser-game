const Vector2 = Phaser.Math.Vector2;

const GAME_WIDTH = 1080;
const GAME_HEIGHT = 600;
const BOUNDS_WIDTH = 1600;
const BOUNDS_HEIGHT = 1200;
const SCREEN_SPLIT = 'vertical';
//const SCREEN_SPLIT = 'horizontal';
//const SCREEN_SPLIT = 'orignal';

let CAMERA_WIDTH = null;
let CAMERA_HEIGHT = null;
if (SCREEN_SPLIT === 'vertical') {
    CAMERA_WIDTH = Math.round(GAME_WIDTH / 2);
    CAMERA_HEIGHT = GAME_HEIGHT;
} else if (SCREEN_SPLIT === 'horizontal') {
    CAMERA_WIDTH = GAME_WIDTH;
    CAMERA_HEIGHT = Math.round(GAME_HEIGHT / 2);
}

let gameCameras = null;
let guiCameras = null;

function showInOtherCameras(ignoreCameras, allCameras, objects) {
    // loop through all other cameras and hide
    for (let camera of allCameras) {
        if (ignoreCameras.includes(camera)) {
            camera.ignore(objects);
        }
    }
}

function ignoreFromOtherCameras(includeCameras, allCameras, objects) {
    // loop through all other cameras and hide
    for (let camera of allCameras) {
        if (!includeCameras.includes(camera)) {
            console.log('ignoring', camera);
            camera.ignore(objects);
        }
    }
}

const PLAYER_CONFIG_DEFAULTS = {
    maxHealth: 200,
    speed: 4,

    primaryMaxCharge: 60,
    primaryShotAmount: 20,
    primaryRegenRate: 8,

    // number of bullets fired per second
    primaryFireRate: 3,
    // damage per bullet
    primaryDamage: 20,
    // speed of primary ranged attack
    primarySpeed: 6,
    primaryDistance: 250,

    abilityMaxCharge: 100,
    abilityChargeRate: 20,
    abilityDamage: 50,
    abilitySpeed: 6,
    abilityDistance: 250,

    ultMaxCharge: 150,
    ultChargeRate: 1,

    // Dashes
    // number of dashes per second
    dashRate: 1/4,
    // duration of dash in ms
    dashDuration: 80,
    // speed of dash
    dashSpeed: 20,
}

const SPEED_SCALE = 50;
const KEYBOARD_SPEED_SCALE = 50;
const DASH_SPEED_SCALE = 50;

class Player extends Phaser.Physics.Arcade.Sprite {

    constructor(scene, x, y, texture, config) {
        super(scene, x, y, texture);

        this.pad = null;

        this.configure(config);
        this.scale = 1.5;

        this.reset();

        this.lifeBar = this.scene.add.graphics();
        this.otherLifeBar = this.scene.add.graphics();
        this.primaryBar = this.scene.add.graphics();
        this.lifeText = this.scene.add.bitmapText(0, 0, 'atari');
        this.lifeText.scale = 0.15;
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
        this.bulletGroups = {};
        this.bullets = [];
    }

    spawn() {
        this.state = 'alive';
        this.setData('health', this.getData('maxHealth'));
        this.setData('primaryCharge', this.getData('primaryMaxCharge'));
        this.setData('abilityCharge', 0);
        this.setData('ultCharge', 0);
    }

    setGuiCamera(camera) {
        this.guiCamera = camera;
        this.setupGui();
    }

    setupGui() {
        // create gui elements
        // some on our main camera
        ignoreFromOtherCameras([this.camera], gameCameras,
            [this.lifeBar, this.primaryBar]);
        showInOtherCameras([this.camera], gameCameras,
            [this.otherLifeBar]);
        // some on our gui camera
        this.abilityArc = this.guiCamera.scene.add.graphics();
        ignoreFromOtherCameras([this.guiCamera], guiCameras, this.abilityArc);
    }


    setCamera(camera) {
        this.camera = camera;
    }

    setupPlayer() {
        this.setupBulletGroup('bullet');
        this.setupBulletGroup('rpg');
    }

    setupBulletGroup(key) {
        const bulletGroup = this.scene.physics.add.group({
            maxSize: 100,
            collideWorldBounds: true,
        });
        this.scene.addBulletGroup(bulletGroup);

        this.bulletGroups[key] = bulletGroup;
    }

    shootBullet(key, x, y, vel_x, vel_y, damage, distance) {
        const bullet = this.bulletGroups[key].get(x, y, key)
        if (bullet) {
            bullet.type = 'bullet';
            bullet.scale = 3;
            bullet.setData('startX', x);
            bullet.setData('startY', y);
            bullet.setData('shotBy', this.name);
            bullet.setData('damage', damage);
            bullet.setData('distance', distance);
            bullet.body.onWorldBounds = true;
            bullet.enableBody(true, x, y, true, true);
            bullet.setVelocity(vel_x, vel_y);
            bullet.rotation = this.rotation;
            this.bullets.push(bullet);
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
            config = {...PLAYER_CONFIG_DEFAULTS, ...config};
        } else {
            config = PLAYER_CONFIG_DEFAULTS;
        }

        const configKeys = Object.keys(config);
        for (const key of configKeys) {
            this.setData(key, config[key]);
        }

        this.setData('maxHealth', config.maxHealth);
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

    shootPrimary(time, delta) {
        const charge = this.getData('primaryCharge');
        const shotAmount = this.getData('primaryShotAmount');
        if (charge >= shotAmount && this.checkActionRate(time, 'primaryFireRate')) {
            this.setData('primaryCharge', Math.max(charge-shotAmount, 0));
            const facing = new Vector2(1, 0);
            Phaser.Math.Rotate(facing, this.rotation);
            const bulletSpeed = this.getData('primarySpeed') * SPEED_SCALE;
            this.shootBullet('bullet', this.x, this.y,
                facing.x*bulletSpeed, facing.y*bulletSpeed,
                this.getData('primaryDamage'),
                this.getData('primaryDistance'),
            );
        }
    }

    shootAbility(time, delta) {
        const charge = this.getData('abilityCharge');
        const maxCharge = this.getData('abilityMaxCharge');
        if (maxCharge - charge < 1) {
            this.setData('abilityCharge', 0);
            const facing = new Vector2(1, 0);
            Phaser.Math.Rotate(facing, this.rotation);
            const bulletSpeed = this.getData('abilitySpeed') * SPEED_SCALE;
            this.shootBullet('rpg', this.x, this.y,
                facing.x*bulletSpeed, facing.y*bulletSpeed,
                this.getData('abilityDamage'),
                this.getData('abilityDistance'),
            );
        }
    }

    handleKeys(time, delta) {
        //const SPEED = KEYBOARD_SPEED_SCALE;
        const speedMult = this.curSpeed() * KEYBOARD_SPEED_SCALE;
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
            this.setVelocity(facing.x * speedMult, facing.y * speedMult);
        } else {
            this.setVelocity(0, 0);
        }

        if (this.keys.primaryFire.isDown) {
            this.shootPrimary(time, delta);
        }

        if (this.keys.abilityFire.isDown) {
            this.shootAbility(time, delta);
        }

        if (this.isDashing) {
            if (time < this.dashUntil) {
                this.setVelocity(this.dashDirection.x*this.dashSpeedMult, this.dashDirection.y*this.dashSpeedMult);
            } else {
                this.isDashing = false;
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

        if (this.pad.R1 > 0) {
            this.shootPrimary(time, delta);
        }

        if (this.pad.L1 > 0) {
            this.shootAbility(time, delta);
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

    updateAmmo(delta) {
        this.updatePrimary(delta);
        this.updateAbility(delta);
        this.updateUlt(delta);
    }

    updateUlt(delta) {
    }

    updateAbility(delta) {
        const charge = this.getData('abilityCharge');
        const maxCharge = this.getData('abilityMaxCharge');
        if (charge < maxCharge) {
            const ammoRegen = this.getData('abilityChargeRate') * (delta / 1000);
            this.setData('abilityCharge', Math.min(maxCharge, charge+ammoRegen));
        }
    }

    updatePrimary(delta) {
        const charge = this.getData('primaryCharge');
        const maxCharge = this.getData('primaryMaxCharge');
        if (charge < maxCharge) {
            const ammoRegen = this.getData('primaryRegenRate') * (delta / 1000);
            this.setData('primaryCharge', Math.min(maxCharge, charge+ammoRegen));
        }
    }

    preUpdate(time, delta) {
        if (this.state != 'dead') {
            this.updateAmmo(delta);

            if (this.pad) {
                this.handleGamepad(time, delta);
            } else if (this.keys) {
                this.handleKeys(time, delta);
            }
        }

        const deadBullets = [];
        for (let bullet of this.bullets) {
            const d = Phaser.Math.Distance.Between(
                bullet.getData('startX'),
                bullet.getData('startY'),
                bullet.x,
                bullet.y
            );
            //console.log(`Bullet distance ${d}`);
            if (d > bullet.getData('distance')) {
                bullet.disableBody(true, true);
                deadBullets.push(bullet);
            }
        }
        this.bullets = this.bullets.filter(x => !deadBullets.includes(x));

        this.drawLifeBar();
        this.drawPrimaryBar();
        this.drawAbilityCharge();
    }

    drawBar(g, amount, width, height, y_offset, color) {
        g.x = this.x;
        g.y = this.y;
        g.clear();

        const x_offset = -(width / 2);
        g.lineStyle(1, '0x000000', 2);
        g.strokeRect(x_offset, y_offset, width, height);

        g.fillStyle(color, 1.0);
        const barWidth = width * amount;
        g.fillRect(x_offset, y_offset, barWidth, height);
    }

    drawArc(g, amount, radius, thickness, x, y, color, alpha=1.0) {
        //console.log(`drawArc(g, ${amount}, ${radius}, ${thickness}, ${x}, ${y}, ${color}`);
        g.x = x;
        g.y = y;
        g.clear();

        g.beginPath();
        g.fillStyle(color, alpha);
        const start = -Math.PI/2;
        const end = start + amount*Math.PI*2;
        g.arc(0, 0, radius+thickness, start, end);
        g.arc(0, 0, radius, end, start, true);
        g.closePath();
        g.strokePath();
        g.fillPath();
    }

    drawPrimaryBar() {
        const charge = this.getData('primaryCharge');
        const amount = charge / this.getData('primaryMaxCharge');

        this.drawBar(this.primaryBar, amount, 50, 8, -38, 0xE9A009);
    }

    drawAbilityCharge() {
        if (!this.abilityArc) {
            return;
        }
        const charge = this.getData('abilityCharge');
        const amount = charge / this.getData('abilityMaxCharge');

        const x = 35
        const y = CAMERA_HEIGHT - 55;
        this.drawArc(this.abilityArc, amount, 15, 8, x, y, 0xFBE031);
    }

    drawLifeBar() {
        const health = this.getData('health');
        const amount = health / this.getData('maxHealth');

        this.drawBar(this.lifeBar, amount, 50, 8, -50, 0x10e035);
        this.drawBar(this.otherLifeBar, amount, 50, 8, -50, 0xD03035);
        this.lifeText.x = this.x - 15;
        this.lifeText.y = this.y - 55;
        this.lifeText.text = health;
    }

    die() {
        this.setData('health', 0);
        console.log(this.name + " DIED!");
        this.emit('died', this);
        this.state = 'dead';
    }

    hitOther(player, bullet) {

    }

    bulletHit(bullet) {
        if (this.state == 'alive') {
            const health = this.getData('health');
            const damage = bullet.getData('damage');
            if (health - damage < 1) {
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
        this.handledGuiCameras = false;
    }

    preload() {
        this.input.gamepad.on('connected', this.onPadConnected, this);
        //this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
        this.load.bitmapFont('atari', 'assets/fonts/bitmap/atari-smooth.png', 'assets/fonts/bitmap/atari-smooth.xml');
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
        this.physics.world.setBounds(0, 0, BOUNDS_WIDTH, BOUNDS_HEIGHT);

        //  Enable world bounds
        this.physics.world.setBoundsCollision(true);

        // Create scene
        this.add.tileSprite(0, 0, BOUNDS_WIDTH, BOUNDS_HEIGHT, 'platformer', '5').setOrigin(0);

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
        const BORDER_SIZE = 20;
        borderGroup.add(this.add.rectangle(0, 0, BOUNDS_WIDTH, BORDER_SIZE, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(0, BOUNDS_HEIGHT-BORDER_SIZE, BOUNDS_WIDTH, BORDER_SIZE, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(0, 0, BORDER_SIZE, BOUNDS_HEIGHT, 0x202020).setOrigin(0))
        borderGroup.add(this.add.rectangle(BOUNDS_WIDTH-BORDER_SIZE, 0, BORDER_SIZE, BOUNDS_HEIGHT, 0x202020).setOrigin(0))

        this.walls = walls;
        this.borderGroup = borderGroup;

        const player1Config = {
            //speed: 4,
            //primaryFireRate: 0.7,
            //primaryDamage: 3,
            //primarySpeed: 8,
        }

        const player2Config = {
            //speed: 4,
            //primaryDamage: 6,
        }

        this.player = this.createPlayer(0, BOUNDS_WIDTH/2, 100, player1Config);

        this.player.setKeys(this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            primaryFire: Phaser.Input.Keyboard.KeyCodes.SPACE,
            abilityFire: Phaser.Input.Keyboard.KeyCodes.V
        }));
        this.player2 = this.createPlayer(1, BOUNDS_WIDTH/2, BOUNDS_HEIGHT-100, player2Config);
        this.player2.setKeys(this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            primaryFire: Phaser.Input.Keyboard.KeyCodes.COMMA,
            abilityFire: Phaser.Input.Keyboard.KeyCodes.PERIOD
        }));
        this.players = [this.player, this.player2];
        for (let player of this.players) {
            //const player = this.players[i];
            // player.on('shoot', this.onShoot, this);
            player.setupPlayer();
            player.spawn();
            //player.on('died', this.onDied, this);
        }

        // Setup cameras
        if (SCREEN_SPLIT === 'vertical') {
            this.camera2 = this.cameras.add(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
            this.cameras.main.setViewport(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
            this.camera2.setViewport(CAMERA_WIDTH, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
        } else if (SCREEN_SPLIT === 'horizontal') {
            //this.camera2 = this.cameras.add(0, 0, GAME_WIDTH, GAME_HEIGHT);
            this.camera2 = this.cameras.add(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
            this.cameras.main.setViewport(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
            this.camera2.setViewport(0, CAMERA_HEIGHT, CAMERA_WIDTH, CAMERA_HEIGHT)
        } else {
            this.camera2 = this.cameras.add(0, 0, 800, 600);
            this.cameras.main.setViewport(0, 0, 800, 300)
            this.camera2.setViewport(0, 300, 800, 300)
        }

        this.cameras.main.setBounds(0, 0, BOUNDS_WIDTH, BOUNDS_HEIGHT);
        this.camera2.setBounds(0, 0, BOUNDS_WIDTH, BOUNDS_HEIGHT);

        this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
        this.player.setCamera(this.cameras.main);
        this.camera2.startFollow(this.player2, true, 0.2, 0.2);
        this.player2.setCamera(this.camera2);
        this.player.camera = this.cameras.main;
        this.player2.camera = this.camera2;

        gameCameras = [this.cameras.main, this.camera2];

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

    getPlayer(name) {
        for (let player of this.players) {
            if (player.name === name) {
                return player;
            }
        }
        return null;
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
        const shotBy = bullet.getData("shotBy");
        if (shotBy != player.name) {
            //console.log("" + player.name + " HIT");
            bullet.disableBody(true, true);
            player.bulletHit(bullet);
            const shotPlayer = this.getPlayer(shotBy);
            shotPlayer.hitOther(player, bullet);
        }
    }


    /*
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
    */

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

    restart() {
        console.log('RESTART');
        for (let player of this.players) {
            player.spawn();
        }
        const player1 = this.players[0];
        player1.x = BOUNDS_WIDTH/2;
        player1.y = 100;
        const player2 = this.players[1];
        player2.x = BOUNDS_WIDTH/2;
        player2.y = BOUNDS_HEIGHT-100;
    }

    update(time, delta) {
        if (!this.handledGuiCameras) {
            if (guiCameras) {
                this.players[0].setGuiCamera(guiCameras[0]);
                this.players[1].setGuiCamera(guiCameras[1]);
                this.handledGuiCameras = true;
            }
        }
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
        // Check for restart
        const pads = this.input.gamepad.gamepads;
        for (let pad of pads) {
            if (pad.buttons[9].value) {
                this.restart();
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
        const BORDER_SIZE = 10;
        if (SCREEN_SPLIT == 'horizontal') {
            const centerLine = new Phaser.Geom.Rectangle(0,
                CAMERA_HEIGHT-(BORDER_SIZE/2), CAMERA_WIDTH, BORDER_SIZE);
            borders.fillRectShape(centerLine);
        } else if (SCREEN_SPLIT == 'vertical') {
            const centerLine = new Phaser.Geom.Rectangle(
                CAMERA_WIDTH-BORDER_SIZE, 0, BORDER_SIZE, CAMERA_HEIGHT);
            borders.fillRectShape(centerLine);
        }

        let camera1 = null;
        let camera2 = null;
        //camera1 = this.cameras.add(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
        camera1 = this.cameras.main;
        camera2 = this.cameras.add(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
        if (SCREEN_SPLIT === 'vertical') {
            camera1.setViewport(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
            camera2.setViewport(CAMERA_WIDTH, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
        } else if (SCREEN_SPLIT === 'horizontal') {
            camera1.setViewport(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
            camera2.setViewport(0, CAMERA_HEIGHT, CAMERA_WIDTH, CAMERA_HEIGHT)
        }
        //guiCameras = [camera1, camera2, this.cameras.main];
        guiCameras = [camera1, camera2];
    }

    update(time, delta) {
    }

}

const config = {
    type: Phaser.AUTO,
    //width: 800,
    //height: 600,
    scale: {
        parent: 'body',
        mode: Phaser.Scale.FIT,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
        //autoRound: true,
    },
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
