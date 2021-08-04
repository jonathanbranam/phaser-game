class Beast extends Player {
    constructor(scene, x, y) {
        let config = {
            maxHealth: 300,
        }
        super(scene, x, y, 'ship', config);
    }
}