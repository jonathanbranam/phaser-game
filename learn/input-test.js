var InputTest = new Phaser.Class({

    Extends: Phaser.Scene,

    initialize: function InputTest ()
    {
        Phaser.Scene.call(this, { key: 'inputtest' });
    },

    preload: function ()
    {
        //this.load.atlas('assets', 'assets/games/breakout/breakout.png', 'assets/games/breakout/breakout.json');
        //this.load.bitmapFont('atari', 'assets/fonts/bitmap/atari-smooth.png', 'assets/fonts/bitmap/atari-smooth.xml');
    },

    create: function ()
    {
        this.text = this.add.text(10, 10, '', {
            font: '16px Helvetica', fill: '#00ff00'
        })
    },


    update: function (time, delta)
    {

        text = [];

        var pads = this.input.gamepad.gamepads;
        for (var i = 0; i < pads.length; i++) {
            var pad = pads[i];
            if (!pad) {
                continue;
            }

            text.push("Id: " + pad.id);
            text.push("Index: " + pad.index + " Timestamp: " + pad.timestamp);

            var buttons = "";
            for (var b = 0; b < pad.buttons.length; b++) {
                var button = pad.buttons[b];
                buttons = buttons.concat('B' + button.index + ": " + button.value + "  ");
                if (b === 8) {
                    text.push(buttons);
                    buttons = "";
                }
            }
            if (buttons != "") {
                text.push(buttons);
            }

            var axes = "";

            for (var a = 0; a < pad.axes.length; a++) {
                var axis = pad.axes[a];
                axes = axes.concat("A" + axis.index + ": " + axis.getValue() + "  ");
            }

            text.push(axes);

            buttons = "";
            if (pad.A) {
                buttons += "A ";
            }
            if (pad.B) {
                buttons += "B ";
            }
            if (pad.X) {
                buttons += "X ";
            }
            if (pad.Y) {
                buttons += "Y ";
            }
            if (pad.L1 > 0) {
                buttons += "L1 ";
            }
            if (pad.L2 > 0) {
                buttons += "L2: " + pad.L2 + " ";
            }
            if (pad.R1 > 0) {
                buttons += "R1 ";
            }
            if (pad.R2 > 0) {
                buttons += "R2 " + pad.R2 + " ";
            }
            if (pad.up) {
                buttons += "up ";
            }
            if (pad.down) {
                buttons += "down ";
            }
            if (pad.left) {
                buttons += "left ";
            }
            if (pad.right) {
                buttons += "right ";
            }

            text.push(buttons);

            var sticks = "";
            sticks += "L: " + pad.leftStick.x + ", " + pad.leftStick.y + "  ";
            sticks += "R: " + pad.rightStick.x + ", " + pad.rightStick.y;

            text.push(sticks);

        }

        this.text.setText(text);
    }

});

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    input: {
        gamepad: true
    },
    scene: [ InputTest ],
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    }
};

var game = new Phaser.Game(config);

