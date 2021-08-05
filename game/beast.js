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
        }
        super(scene, x, y, 'beast', config);
    }

    setupPlayer() {
        super.setupPlayer();
        //const anim = new AnimationState(this);
        console.log(this.scene.anims.generateFrameNames('beast', { prefix: 'beast_walk_', start: 1, end: 2 }))
        this.scene.anims.create({
            key: 'beast_walk',
            //frames: ['beast-walk-1', 'beast-walk-2'],
            frames: this.scene.anims.generateFrameNames('beast', { prefix: 'beast_walk_', start: 1, end: 2 }),
            frameRate: 8,
            repeat: -1,
        });
        this.play('beast_walk');
    }

    configureBullet(bullet, key) {
        super.configureBullet(bullet, key);

        if (key === 'beast_punch') {
            //bullet.body.setSize(24, 24);
        }
    }

}