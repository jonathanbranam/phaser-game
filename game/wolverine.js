class Wolverine extends Player {
    constructor(scene, x, y) {
        let config = {
            maxHealth: 250,
        }
        super(scene, x, y, 'ship', config);
    }

}