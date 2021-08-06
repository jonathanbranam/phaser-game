class Wolverine extends Player {
    constructor(scene, x, y) {
        let config = {
            speed: 4,
            maxHealth: 250,
            animWalk: 'wolverine-walk'
        }
        super(scene, x, y, 'wolverine', config);
    }
    setupPlayer() {
        super.setupPlayer();
        this.scene.anims.create({
            key: 'wolverine-walk',
            frames: this.scene.anims.generateFrameNames('wolverine', { prefix: 'no-claws-walk-', start: 1, end: 2 }),
            frameRate: 4,
            repeat: -1,
        });
    }


}