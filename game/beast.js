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
        super(scene, x, y, 'ship', config);
    }

    configureBullet(bullet, key) {
        super.configureBullet(bullet, key);

        if (key === 'beast_punch') {
            //bullet.body.setSize(24, 24);
        }
    }

}