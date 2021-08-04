class Beast extends Player {
    constructor(scene, x, y) {
        let config = {
            maxHealth: 300,
            speed: 4.5,
        }
        super(scene, x, y, 'ship', config);
    }
}