
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
    primaryDistance: 200,
    primaryLength: 22,

    weaponFireOffset: 0,

    abilityMaxCharge: 100,
    abilityChargeRate: 20,
    abilityDamage: 50,
    abilitySpeed: 6,
    abilityDistance: 200,
    abilityLength: 36,

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
        this.scale = 1;

        this.reset();

        this.targetDisplay = this.scene.add.graphics();
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
            [this.lifeBar, this.primaryBar, this.targetDisplay]);
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

    shootBullet(key, x, y, vel_x, vel_y, damage, distance, bulletLength) {
        const bullet = this.bulletGroups[key].get(x, y, key)
        if (bullet) {
            bullet.type = 'bullet';

            // TODO: Offset the weapon more for larger bullets
            const weaponFireOffset = this.getData('weaponFireOffset') +
                bulletLength;
            const facing = new Vector2(weaponFireOffset, 0);
            Phaser.Math.Rotate(facing, this.rotation);
            x += facing.x;
            y += facing.y;

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
                this.getData('primaryLength'),
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
                this.getData('abilityLength'),
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
            this.showTargetDisplay = true;
        } else {
            this.showTargetDisplay = false;
        }
        const speedMult = this.curSpeed() * SPEED_SCALE;
        this.setVelocity(this.pad.leftStick.x*speedMult, this.pad.leftStick.y*speedMult);

        if (this.pad.R2 > 0) {
            this.shootPrimary(time, delta);
        }

        if (this.pad.L2 > 0) {
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

    updateCharge(delta) {
        this.updatePrimary(delta);
        this.updateAbility(delta);
        this.updateUlt(delta);
    }

    drawTargeting(delta) {
        this.targetDisplay.clear();
        if (!this.showTargetDisplay) {
            return;
        }
        this.targetDisplay.x = this.x;
        this.targetDisplay.y = this.y;
        this.targetDisplay.rotation = this.rotation - Math.PI/2;

        const fireOffset = this.getData('weaponFireOffset');
        const primaryDistance = this.getData('primaryDistance');
        const primaryLength = this.getData('primaryLength');

        this.targetDisplay.fillStyle(0xFFFFFF, 0.2);
        // TODO: make with a data property
        const width = 50;
        this.targetDisplay.fillRect(-width/2, fireOffset + primaryLength/2,
            width, primaryDistance + primaryLength + fireOffset);
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
            this.updateCharge(delta);

            if (this.pad) {
                this.handleGamepad(time, delta);
            } else if (this.keys) {
                this.handleKeys(time, delta);
            }
        } else {
            this.showTargetDisplay = false;
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

        this.drawTargeting(delta);
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
