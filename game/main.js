const Vector2 = Phaser.Math.Vector2;

const TILE_SIZE = 32;
const SCREEN_WIDTH = 800;
const SCREEN_HEIGHT = 400;
const BOUNDS_WIDTH = 32 * 32;
const BOUNDS_HEIGHT = 32 * 32;
const SCREEN_SPLIT = 'vertical';
//const SCREEN_SPLIT = 'horizontal';
//const SCREEN_SPLIT = 'orignal';

let CAMERA_WIDTH = null;
let CAMERA_HEIGHT = null;
if (SCREEN_SPLIT === 'vertical') {
    CAMERA_WIDTH = Math.round(SCREEN_WIDTH / 2);
    CAMERA_HEIGHT = SCREEN_HEIGHT;
} else if (SCREEN_SPLIT === 'horizontal') {
    CAMERA_WIDTH = SCREEN_WIDTH;
    CAMERA_HEIGHT = Math.round(SCREEN_HEIGHT / 2);
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
            camera.ignore(objects);
        }
    }
}

class WorldScene extends Phaser.Scene {

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
        this.load.atlas('desert', 'assets/backgrounds/desert-1.png', 'assets/backgrounds/desert-1.json');
        this.load.text('desert-1', 'maps/desert-1.txt');

        this.load.image('ship', 'assets/games/asteroids/ship.png')
        //this.load.image('bullet', 'assets/games/asteroids/bullets.png')
        this.load.image('bullet', 'assets/sprites/bullets/bullet5.png')
        this.load.image('rpg', 'assets/sprites/bullets/bullet10.png')
        this.load.image('ground', 'assets/sets/tiles/5.png');
        this.load.atlas('explosion', 'assets/particles/explosion.png', 'assets/particles/explosion.json');

        this.load.atlas('wolverine', 'assets/characters/wolverine/wolverine.png', 'assets/characters/wolverine/wolverine.json');
        this.load.atlas('beast', 'assets/characters/beast/beast.png', 'assets/characters/beast/beast.json');
        this.load.image('beast_punch', 'assets/characters/beast/beast_punch.png')
       
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

    createPlayer(playerClass, index, x, y) {
        const player = new playerClass(this.matter.world, x, y)
        player.name = "player-" + index;
        this.add.existing(player);
        //this.physics.add.existing(player);
        //player.setCollideWorldBounds(true);

        return player;
    }

    create() {
        this.matter.world.setBounds(0, 0, BOUNDS_WIDTH, BOUNDS_HEIGHT);

        // Create scene
        //this.add.tileSprite(0, 0, BOUNDS_WIDTH, BOUNDS_HEIGHT, 'platformer', '5').setOrigin(0);
        this.add.tileSprite(0, 0, BOUNDS_WIDTH, BOUNDS_HEIGHT, 'desert', 'ground').setOrigin(0);

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

        if (false) {
            // random walls
            for (let i = 0; i < 15; i++) {
                const x = Phaser.Math.RND.integerInRange(100, 1500);
                const y = Phaser.Math.RND.integerInRange(100, 1100);
                //walls.add(this.add.tileSprite(x, y, 90, 54, 'platformer', 'rock').setOrigin(0));
                walls.add(this.add.tileSprite(x, y, 32, 32, 'desert', 'wall-unconnected').setOrigin(0));
            }
        } else {
            const map = this.cache.text.get('desert-1');
            const mapLines = map.split('\n');
            for (let y = 0; (y+1) < mapLines.length; y++) {
                const row = mapLines[y];
                console.log(row);
                for (let x = 0; x < row.length; x++) {
                    if (row[x] === 'X') {
                        this.add.tileSprite((x+1)*32, (y+1)*32, 32, 32, 'desert', 'wall-unconnected').setOrigin(0);
                        this.matter.add.rectangle((x+1)*32+16, (y+1)*32+16, 32, 32, { isStatic: true });
                    }
                }
            }
        }


        // Create World Border
        const BORDER_SIZE = 32;
        this.add.rectangle(0, 0, BOUNDS_WIDTH, BORDER_SIZE, 0x202020).setOrigin(0);
        this.matter.add.rectangle(BOUNDS_WIDTH/2, BORDER_SIZE/2, BOUNDS_WIDTH, BORDER_SIZE, { isStatic: true });
        this.add.rectangle(0, BOUNDS_HEIGHT-BORDER_SIZE, BOUNDS_WIDTH, BORDER_SIZE, 0x202020).setOrigin(0);
        this.matter.add.rectangle(BOUNDS_WIDTH/2, BOUNDS_HEIGHT-BORDER_SIZE/2, BOUNDS_WIDTH, BORDER_SIZE, { isStatic: true });
        this.add.rectangle(0, 0, BORDER_SIZE, BOUNDS_HEIGHT, 0x202020).setOrigin(0);
        this.matter.add.rectangle(BOUNDS_WIDTH-BORDER_SIZE/2, BOUNDS_HEIGHT/2, BORDER_SIZE, BOUNDS_HEIGHT, { isStatic: true });
        this.add.rectangle(BOUNDS_WIDTH-BORDER_SIZE, 0, BORDER_SIZE, BOUNDS_HEIGHT, 0x202020).setOrigin(0);
        this.matter.add.rectangle(BORDER_SIZE/2, BOUNDS_HEIGHT/2, BORDER_SIZE, BOUNDS_HEIGHT, { isStatic: true });

        this.player = this.createPlayer(Beast, 0, BOUNDS_WIDTH/2, 100);

        this.player.setKeys(this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            primaryFire: Phaser.Input.Keyboard.KeyCodes.SPACE,
            abilityFire: Phaser.Input.Keyboard.KeyCodes.V
        }));
        this.player2 = this.createPlayer(Wolverine, 1, BOUNDS_WIDTH/2, BOUNDS_HEIGHT-100,);
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
            player.setupPlayer();
            player.spawn();
        }

        // Setup cameras
        if (SCREEN_SPLIT === 'vertical') {
            this.camera2 = this.cameras.add(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
            this.cameras.main.setViewport(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
            this.camera2.setViewport(CAMERA_WIDTH, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
        } else if (SCREEN_SPLIT === 'horizontal') {
            //this.camera2 = this.cameras.add(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
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

        const pads = this.input.gamepad.gamepads;
        console.log("Found " + pads.length + " game pads");


        //this.physics.add.collider(this.players, walls, this.playerHitWall, null, this);
        //this.physics.add.collider(this.players, borderGroup, this.playerHitWall, null, this);

        //this.physics.add.collider(this.players, this.players, this.playerHitPlayer, null, this);

        //this.physics.world.on('worldbounds', this.onWorldBounds, this);

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
        camera1 = this.cameras.main;
        camera2 = this.cameras.add(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT);
        if (SCREEN_SPLIT === 'vertical') {
            camera1.setViewport(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
            camera2.setViewport(CAMERA_WIDTH, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
        } else if (SCREEN_SPLIT === 'horizontal') {
            camera1.setViewport(0, 0, CAMERA_WIDTH, CAMERA_HEIGHT)
            camera2.setViewport(0, CAMERA_HEIGHT, CAMERA_WIDTH, CAMERA_HEIGHT)
        }
        guiCameras = [camera1, camera2];
    }

    update(time, delta) {
    }

}

const config = {
    type: Phaser.AUTO,
    pixelArt: false,
    scale: {
        parent: 'body',
        mode: Phaser.Scale.FIT,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT
    },
    input: {
        gamepad: true
    },
    scene: [ WorldScene, TopdownGUI ],
    physics: {
        default: 'matter',
        matter: {
            //enableSleeping: true,
            gravity: {
                y: 0
            },
            debug: {
                showBody: false,
                showStaticBody: false
            }
        }
    }
};

const game = new Phaser.Game(config);