class Wolverine extends Player {
    constructor(scene, x, y) {
        let config = {
            speed: 4,
            maxHealth: 250,
        }
        super(scene, x, y, 'ship', config);
    }

}