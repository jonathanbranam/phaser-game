class Wolverine extends Player {
    constructor(scene, x, y) {
        let config = {
            speed: 4,
            maxHealth: 250,
        }
        super(scene, x, y, 'wolverine', config);
    }
    setupPlayer() {
        super.setupPlayer();
        //const anim = new AnimationState(this);
        console.log(this.scene.anims.generateFrameNames('wolverine', { prefix: 'no-claws-walk-', start: 1, end: 2 }))
        this.scene.anims.create({
            key: 'wolverine-walk',
            //frames: ['beast-walk-1', 'beast-walk-2'],
            frames: this.scene.anims.generateFrameNames('wolverine', { prefix: 'no-claws-walk-', start: 1, end: 2 }),
            frameRate: 8,
            repeat: -1,
        });
        this.play('wolverine-walk');
    }


}