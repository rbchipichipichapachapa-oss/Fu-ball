export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // load external keeper image
    this.load.image('torwart', 'Torwart.png');
  }

  create() {
    this.scene.start('GameScene');
  }
}
