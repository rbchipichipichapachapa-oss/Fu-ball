export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // no external assets; create simple textures in create()
  }

  create() {
    this.scene.start('GameScene');
  }
}
