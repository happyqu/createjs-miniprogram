const assert = require("node:assert/strict");

global.wx = {
  createOffscreenCanvas({ width, height }) {
    const canvas = {
      width,
      height,
      drawCalls: [],
      getContext() {
        return {
          drawImage(...args) {
            canvas.drawCalls.push(args);
          },
          clearRect() {},
          save() {},
          restore() {},
          setTransform() {},
          transform() {},
          translate() {},
          beginPath() {},
          rect() {},
          clip() {},
        };
      },
    };
    return canvas;
  },
};

const createjs = require("../dist/index.js");

assert.equal(typeof createjs.Stage, "function");
assert.equal(typeof createjs.Shape, "function");
assert.equal(createjs.Tween, undefined);
assert.equal(typeof createjs.ButtonHelper, "function");
assert.equal(createjs.Ease, undefined);
const sharedTicker = createjs.Ticker;
const tweenExtension = require("../dist/tweenjs.js");
assert.strictEqual(tweenExtension, createjs);
assert.strictEqual(createjs.Ticker, sharedTicker);
assert.equal(typeof createjs.Tween, "function");
assert.equal(typeof createjs.Timeline, "function");
assert.equal(typeof createjs.Ease.quadOut, "function");
assert.ok(createjs.globalDispatcher instanceof createjs.EventDispatcher);
assert.deepEqual(
  {
    width: createjs.createCanvas(2, 3).width,
    height: createjs.createCanvas(2, 3).height,
  },
  { width: 2, height: 3 },
);

let received = false;
createjs.globalDispatcher.on("smoke-test", () => {
  received = true;
});
createjs.globalDispatcher.dispatchEvent("smoke-test");
assert.equal(received, true);

const canvas = createjs.createCanvas(4, 4);
assert.equal(createjs.Touch.isSupported(), true);
assert.equal(createjs.Filter.isValidImageSource(canvas), true);
assert.doesNotThrow(() => new createjs.AlphaMapFilter(canvas));

const stage = new createjs.Stage(canvas);
assert.doesNotThrow(() => stage._handleMouseMove());
createjs.Touch.enable(stage);
assert.doesNotThrow(() => createjs.Touch.disable(stage));

stage.scaleX = stage.scaleY = 2;
stage.cache(0, 0, 2, 2, 2);
assert.equal(stage.cacheCanvas.width, 4);
assert.equal(stage.cacheCanvas.height, 4);
stage.update();
assert.equal(canvas.drawCalls.length, 1);
assert.strictEqual(canvas.drawCalls[0][0], stage.cacheCanvas);
assert.deepEqual(canvas.drawCalls[0].slice(1), [0, 0, 2, 2]);
stage.uncache();
assert.equal(stage.cacheCanvas, null);

const touchCalls = [];
const touchStage = {
  canvas,
  scaleX: 9,
  scaleY: 11,
  _handlePointerDown(...args) {
    touchCalls.push(["down", ...args]);
  },
  _handlePointerMove(...args) {
    touchCalls.push(["move", ...args]);
  },
  _handlePointerUp(...args) {
    touchCalls.push(["up", ...args]);
  },
};
assert.equal(createjs.Touch.enable(touchStage, { pixelRatio: 2 }), true);
assert.equal(createjs.Touch.handleEvent(touchStage, {
  type: "touchstart",
  changedTouches: [{ identifier: 7, x: 10, y: 20 }],
}), true);
createjs.Touch.handleEvent(touchStage, {
  type: "touchmove",
  changedTouches: [{ identifier: 7, x: 11, y: 21 }],
});
createjs.Touch.handleEvent(touchStage, {
  type: "touchend",
  changedTouches: [{ identifier: 7 }],
});
assert.deepEqual(touchCalls.map(([type]) => type), ["down", "move", "up"]);
assert.deepEqual(touchCalls[0].slice(-2), [20, 40]);
assert.equal(createjs.Touch.disable(touchStage), true);

const buttonListeners = {};
const buttonStates = [];
const buttonTarget = {
  addEventListener(type, listener) {
    buttonListeners[type] = listener;
  },
  removeEventListener(type) {
    delete buttonListeners[type];
  },
  gotoAndStop(label) {
    buttonStates.push(label);
  },
};
const button = new createjs.ButtonHelper(buttonTarget, "out", "over", "down");
buttonListeners.mousedown.handleEvent({ type: "mousedown" });
buttonListeners.pressup.handleEvent({ type: "pressup" });
assert.deepEqual(buttonStates, ["out", "down", "out"]);
assert.equal(button.setEnabled, undefined);
button.destroy();
assert.deepEqual(Object.keys(buttonListeners), []);

const extracted = createjs.SpriteSheetUtils.extractFrame(
  {
    getFrame() {
      return {
        image: canvas,
        rect: { x: 0, y: 0, width: 2, height: 2 },
      };
    },
  },
  0,
);
assert.equal(extracted.width, 2);
assert.equal(extracted.height, 2);

let esmTicker;
import("../dist/index.mjs").then(({ default: esmCreatejs }) => {
  assert.equal(typeof esmCreatejs.Stage, "function");
  assert.ok(esmCreatejs.globalDispatcher instanceof esmCreatejs.EventDispatcher);
  esmTicker = esmCreatejs.Ticker;
  return import("../dist/tweenjs.mjs");
}).then(({ default: esmTweenExtension }) => {
  return import("../dist/index.mjs").then(({ default: esmCreatejs }) => {
    assert.strictEqual(esmTweenExtension, esmCreatejs);
    assert.strictEqual(esmCreatejs.Ticker, esmTicker);
    assert.equal(typeof esmCreatejs.Tween, "function");
  });
}).then(() => {
  console.log("@happyqu/createjs-miniprogram CommonJS and ESM smoke tests passed");
});
