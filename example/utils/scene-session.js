// A page owns its ticker listener and tweens; other pages share the library.
module.exports = class SceneSession {
  constructor(createjs, tick) {
    this.createjs = createjs;
    this.tick = tick;
    this.tweens = [];
    this.resumeTweens = [];
    this.active = false;
  }

  tween(target, options) {
    this.tweens = this.tweens.filter((tween) => !tween.paused || tween.position < tween.duration || this.resumeTweens.includes(tween));
    const tween = this.createjs.Tween.get(target, options);
    this.tweens.push(tween);
    if (!this.active) {
      tween.paused = true;
      this.resumeTweens.push(tween);
    }
    return tween;
  }

  removeTweens(target) {
    for (const tween of this.tweens) if (tween.target === target) tween.paused = true;
    this.tweens = this.tweens.filter((tween) => tween.target !== target);
    this.resumeTweens = this.resumeTweens.filter((tween) => tween.target !== target);
  }

  setActive(active) {
    if (active === this.active) return;
    this.active = active;
    if (active) {
      for (const tween of this.resumeTweens) tween.paused = false;
      this.resumeTweens = [];
      this.createjs.Ticker.addEventListener("tick", this.tick);
    } else {
      this.createjs.Ticker.removeEventListener("tick", this.tick);
      this.resumeTweens = this.tweens.filter((tween) => !tween.paused);
      for (const tween of this.resumeTweens) tween.paused = true;
    }
  }

  clearTweens() {
    for (const tween of this.tweens) tween.paused = true;
    this.tweens = [];
    this.resumeTweens = [];
  }

  dispose() {
    this.setActive(false);
    this.clearTweens();
  }
};
