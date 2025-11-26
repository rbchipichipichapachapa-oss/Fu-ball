export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // load external keeper image and background
    this.load.image('torwart', 'Torwart.png');
    this.load.image('background', '1137.jpg');
  }

  create() {
    this.scene.start('GameScene');
  }
}
