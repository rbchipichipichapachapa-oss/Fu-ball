export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // add background image (scaled to fit)
    const bg = this.add.image(W/2, H/2, 'background');
    bg.setDisplaySize(W, H);
    bg.setDepth(0);

    // Field bg (camera fallback color)
    this.cameras.main.setBackgroundColor(0x2b7a3a);

    // Goal area (top)
    this.goalY = 120;
    this.goal = this.add.rectangle(W/2, this.goalY, 520, 120, 0xffffff, 0.08).setStrokeStyle(4, 0xffffff);

    // Create texture for ball using graphics
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(16, 16, 16);
    g.generateTexture('ballTex', 32, 32);
    g.destroy();

    // Ball start position
    this.ballStart = { x: W/2, y: H - 100 };
    this.ball = this.physics.add.image(this.ballStart.x, this.ballStart.y, 'ballTex');
    this.ball.setCircle(16);
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(0.3);
    this.ball.body.setAllowGravity(false);
    this.ball.setDepth(2);

    // Goalkeeper
    // use loaded image asset for keeper
    this.keeper = this.physics.add.image(W/2, this.goalY + 20, 'torwart');
    // ensure consistent size to previous generated texture
    this.keeper.setDisplaySize(80, 80);
    this.keeper.setImmovable(true);
    this.keeper.body.setAllowGravity(false);
    this.keeper.setDepth(2);
    // increase effective save area to make saves more likely
    if (this.keeper.body && this.keeper.body.setSize) {
      // make physics body wider than sprite to increase save chance
      this.keeper.body.setSize(120, 80);
    }
    this.keeperSaveHalfWidth = 60; // used for goal-line save check

    // Invisible line representing goal line (y coordinate)
    this.goalLineY = this.goalY + 40;

    // UI
    this.score = 0;
    this.shots = 0;
    this.scoreText = this.add.text(12,12, 'Tore: 0  |  Schüsse: 0', { font: '18px Arial', fill:'#fff' });

    this.msgText = this.add.text(W/2, 40, 'Klicke & halte zum Power aufladen, loslassen um zu schießen', { font: '18px Arial', fill:'#fff' }).setOrigin(0.5);

    // Aiming line
    this.aimLine = this.add.graphics();

    // Power variables
    this.isCharging = false;
    this.power = 0;
    this.maxPower = 900; // pixels/sec

    // Input
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointerup', this.onPointerUp, this);

    // Overlap check between ball and keeper -> saved
    this.physics.add.overlap(this.ball, this.keeper, () => {
      if (this.shotInProgress && !this.resultShown) {
        this.showResult('GEHALTEN!');
        this.resultShown = true;
      }
    });

    // reset helper
    this.resetShot();
  }

  onPointerMove(pointer) {
    this.pointer = pointer;
    if (!this.shotInProgress) this.drawAim();
  }

  onPointerDown() {
    if (this.shotInProgress) return;
    this.isCharging = true;
    this.power = 0;
  }

  onPointerUp() {
    if (!this.isCharging || this.shotInProgress) return;
    this.isCharging = false;
    // shoot
    const angle = Phaser.Math.Angle.Between(this.ball.x, this.ball.y, this.pointer.x, this.pointer.y);
    // invert because pointer is above ball
    const vx = Math.cos(angle) * this.power * -1;
    const vy = Math.sin(angle) * this.power * -1;
    this.ball.setVelocity(vx, vy);
    this.shotInProgress = true;
    this.resultShown = false;
    this.shots += 1;
    this.scoreText.setText(`Tore: ${this.score}  |  Schüsse: ${this.shots}`);

    // Keeper reaction: choose random dive and animate
    this.animateKeeper();
    // aim keeper to predicted intercept point to increase save probability
    this.aimKeeperToIntercept(vx, vy);
  }

  drawAim() {
    this.aimLine.clear();
    if (!this.pointer) return;
    this.aimLine.lineStyle(3, 0xffff00, 0.9);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.ball.x, this.ball.y);
    this.aimLine.lineTo(this.pointer.x, this.pointer.y);
    this.aimLine.strokePath();

    // draw power bar when charging
    if (this.isCharging) {
      const p = Phaser.Math.Clamp(this.power / this.maxPower, 0, 1);
      const W = 200; const H = 12;
      const x = this.ball.x - W/2; const y = this.ball.y + 40;
      this.aimLine.fillStyle(0x000000, 0.6);
      this.aimLine.fillRect(x-2, y-2, W+4, H+4);
      this.aimLine.fillStyle(0xff0000, 1);
      this.aimLine.fillRect(x, y, W * p, H);
    }
  }

  animateKeeper() {
    // Cancel previous tweens
    if (this.keeperTween) this.keeperTween.stop();
    // Random target: left, center, right within goal width
    const tgtX = this.scale.width/2 + Phaser.Math.Between(-200, 200);
    this.keeperTween = this.tweens.add({
      targets: this.keeper,
      x: tgtX,
      duration: 400,
      ease: 'Sine.easeInOut'
    });
  }

  aimKeeperToIntercept(vx, vy) {
    // Predict time when the ball will reach the goal line and move keeper there.
    if (!vx || !vy) return;
    // time in seconds until crossing (vy is negative when going up)
    const t = (this.goalLineY - this.ball.y) / vy;
    if (!isFinite(t) || t <= 0) return;

    // predicted x position at that time
    const predictedX = this.ball.x + vx * t;

    // constrain to goal area (goal width 520 centered at W/2)
    const goalHalf = 520 / 2;
    const minX = this.scale.width/2 - goalHalf;
    const maxX = this.scale.width/2 + goalHalf;
    const offset = Phaser.Math.Between(-30, 30);
    const targetX = Phaser.Math.Clamp(predictedX + offset, minX, maxX);

    // duration slightly shorter than flight time so keeper arrives just before ball
    const duration = Phaser.Math.Clamp(t * 1000 * 0.9, 120, 700);
    if (this.keeperTween) this.keeperTween.stop();
    this.keeperTween = this.tweens.add({
      targets: this.keeper,
      x: targetX,
      duration,
      ease: 'Sine.easeInOut'
    });
  }

  resetShot() {
    this.shotInProgress = false;
    this.resultShown = false;
    this.ball.setPosition(this.ballStart.x, this.ballStart.y);
    this.ball.setVelocity(0,0);
    // place keeper center
    this.keeper.setPosition(this.scale.width/2, this.goalY + 20);
    this.aimLine.clear();
    this.msgText.setText('Klicke & halte zum Power aufladen, loslassen um zu schießen');
  }

  showResult(text) {
    if (text === 'TOR!') {
      this.score += 1;
    }
    this.msgText.setText(text + '  (Klicke zum erneut versuchen)');
    this.scoreText.setText(`Tore: ${this.score}  |  Schüsse: ${this.shots}`);

    // allow restart on click
    this.input.once('pointerdown', () => {
      this.resetShot();
    });
  }

  update(time, delta) {
    if (this.isCharging) {
      // increase power
      this.power = Phaser.Math.Clamp(this.power + 10, 0, this.maxPower);
    }

    if (!this.shotInProgress) {
      this.drawAim();
    }

    if (this.shotInProgress && !this.resultShown) {
      // check if ball crossed goal line
      if (this.ball.y <= this.goalLineY) {
        // ball crossed line; if overlapping keeper, overlap handler already shows 'GEHALTEN!'
        // check saved by bounding box overlap OR by proximity to keeper x (larger effective area)
        const rectSaved = Phaser.Geom.Intersects.RectangleToRectangle(this.ball.getBounds(), this.keeper.getBounds());
        const proxSaved = Math.abs(this.ball.x - this.keeper.x) <= (this.keeperSaveHalfWidth || 40);
        if (rectSaved || proxSaved) {
          this.showResult('GEHALTEN!');
        } else {
          this.showResult('TOR!');
        }
        this.resultShown = true;
      }

      // timeout if ball goes out of bounds or stops
      if (this.ball.y > this.scale.height + 200 || this.ball.body.speed < 5) {
        if (!this.resultShown) this.showResult('Kein Tor');
      }
    }
  }
}
