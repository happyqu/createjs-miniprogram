const assert = require("node:assert/strict");

const lite = require("@happyqu/createjs-miniprogram/lite");
for (const name of [
  "Stage", "Container", "Graphics", "Shape", "Bitmap", "Text",
  "Sprite", "SpriteSheet", "BitmapText", "Ticker", "Touch",
]) {
  assert.notEqual(lite[name], undefined, `${name} is missing from lite`);
}
assert.equal(lite.Tween, undefined);
assert.equal(lite.MovieClip, undefined);
assert.equal(lite.BlurFilter, undefined);
assert.equal(lite.SpriteSheetBuilder, undefined);
assert.equal(lite.ButtonHelper, undefined);

assert.strictEqual(require("@happyqu/createjs-miniprogram/lite/animation"), lite);
assert.equal(typeof lite.Tween, "function");
assert.equal(typeof lite.MovieClip, "function");
assert.equal(typeof lite.Ease.quadOut, "function");
assert.doesNotThrow(() => new lite.MovieClip({ paused: true }));

assert.strictEqual(require("@happyqu/createjs-miniprogram/lite/filters"), lite);
assert.equal(typeof lite.BlurFilter, "function");
assert.equal(typeof lite.ColorMatrix, "function");

Promise.all([
  import("@happyqu/createjs-miniprogram/lite"),
  import("@happyqu/createjs-miniprogram/lite/animation"),
  import("@happyqu/createjs-miniprogram/lite/filters"),
]).then(([{ default: esmLite }, ...addons]) => {
  for (const { default: addon } of addons) assert.strictEqual(addon, esmLite);
  assert.equal(typeof esmLite.Text, "function");
  assert.equal(typeof esmLite.Sprite, "function");
  assert.equal(typeof esmLite.MovieClip, "function");
  assert.equal(typeof esmLite.BlurFilter, "function");
  console.log("Lite and grouped addon smoke tests passed");
});
