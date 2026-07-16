const assert = require("node:assert/strict");

const core = require("@happyqu/createjs-miniprogram/core");
assert.equal(typeof core.Stage, "function");
assert.equal(typeof core.Shape, "function");
assert.equal(typeof core.Touch, "function");
assert.equal(core.Text, undefined);
assert.equal(core.MovieClip, undefined);
assert.equal(core.BlurFilter, undefined);
assert.equal(core.SpriteSheetBuilder, undefined);
assert.equal(core.ButtonHelper, undefined);

assert.strictEqual(require("@happyqu/createjs-miniprogram/text"), core);
assert.equal(typeof core.Text, "function");
assert.equal(typeof core.BitmapText, "function");

assert.strictEqual(require("@happyqu/createjs-miniprogram/movieclip"), core);
assert.equal(typeof core.MovieClip, "function");

assert.strictEqual(require("@happyqu/createjs-miniprogram/filters"), core);
assert.equal(typeof core.BlurFilter, "function");
assert.equal(typeof core.ColorMatrix, "function");

assert.strictEqual(require("@happyqu/createjs-miniprogram/builder"), core);
assert.equal(typeof core.SpriteSheetBuilder, "function");
assert.equal(typeof core.SpriteSheetUtils, "function");

assert.strictEqual(require("@happyqu/createjs-miniprogram/ui"), core);
assert.equal(typeof core.ButtonHelper, "function");

Promise.all([
  import("@happyqu/createjs-miniprogram/core"),
  import("@happyqu/createjs-miniprogram/text"),
  import("@happyqu/createjs-miniprogram/movieclip"),
  import("@happyqu/createjs-miniprogram/filters"),
  import("@happyqu/createjs-miniprogram/builder"),
  import("@happyqu/createjs-miniprogram/ui"),
]).then(([{ default: esmCore }, ...addons]) => {
  for (const { default: addon } of addons) assert.strictEqual(addon, esmCore);
  assert.equal(typeof esmCore.Text, "function");
  assert.equal(typeof esmCore.MovieClip, "function");
  assert.equal(typeof esmCore.BlurFilter, "function");
  console.log("Core and optional addon smoke tests passed");
});
