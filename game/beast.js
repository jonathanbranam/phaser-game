class Beast extends Player {
    constructor(scene, x, y) {
        let config = {
            maxHealth: 300,
            speed: 4.5,
            mass: 50,

            primaryDamage: 28,
            primaryDistance: 24,
            primaryWidth: 24,
            primaryLength: 24,
            primarySpeed: 4,
            primaryTexture: 'beast_punch',

            animWalk: 'walk',
            animIdle: 'idle',
        }
        super(scene, x, y, 'beast', config);
    }

    setupPlayer() {
        super.setupPlayer();
        this.anims.create({
            key: 'walk',
            frames: this.scene.anims.generateFrameNames('beast', { prefix: 'walk-', suffix: '.png', start: 0, end: 1, zeroPad: 4}),
            frameRate: 4,
            repeat: -1,
        });
        this.anims.create({
            key: 'idle',
            frames: this.scene.anims.generateFrameNames('beast', { prefix: 'idle-', suffix: '.png', start: 0, end: 2, zeroPad: 4}),
            frameRate: 4,
            repeat: -1,
        });
    }

    configureBullet(bullet, key) {
        super.configureBullet(bullet, key);

        if (key === 'beast_punch') {
            //bullet.body.setSize(24, 24);
        }
    }

}