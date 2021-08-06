class Wolverine extends Player {
    constructor(scene, x, y) {
        let config = {
            speed: 4,
            maxHealth: 250,
            animWalk: 'walk',
            animIdle: 'idle',
        }
        super(scene, x, y, 'wolverine', config);
    }
    
    setupPlayer() {
        super.setupPlayer();
        this.anims.create({
            key: 'walk',
            frames: this.scene.anims.generateFrameNames('wolverine', { prefix: 'no-claws-walk-', start: 0, end: 1, zeroPad: 4 }),
            frameRate: 4,
            repeat: -1,
        });
        this.anims.create({
            key: 'idle',
            frames: this.scene.anims.generateFrameNames('wolverine', { prefix: 'idle-', start: 0, end: 2, zeroPad: 4 }),
            frameRate: 4,
            repeat: -1,
        });
    }


}