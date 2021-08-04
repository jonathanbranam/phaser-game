class Beast extends Player {
    constructor(scene, x, y) {
        let config = {
            maxHealth: 300,
            speed: 4.5,

            primaryDamage: 28,
            primaryDistance: 24,
            primaryLength: 24,
            primarySpeed: 10,
        }
        super(scene, x, y, 'ship', config);
    }
}