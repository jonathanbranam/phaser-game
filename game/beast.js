class Beast extends Player {
    constructor(scene, x, y) {
        let config = {
            maxHealth: 300,
            speed: 4.5,

            primaryDamage: 28,
            primaryDistance: 24,
            primaryLength: 24,
            primarySpeed: 4,
            primaryTexture: 'beast_punch',

            animWalk: 'beast-walk'
        }
        super(scene, x, y, 'beast', config);
    }

    setupPlayer() {
        super.setupPlayer();
        this.anims.create({
            key: 'beast-walk',
            frames: this.scene.anims.generateFrameNames('beast', { prefix: 'beast-walk-', start: 1, end: 2 }),
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