const assert = require("node:assert/strict");

global.wx = {
  createOffscreenCanvas({ width, height }) {
    const canvas = {
      width,
      height,
      drawCalls: [],
      clearCalls: [],
      contextCalls: { save: 0, restore: 0, transform: 0 },
      getContext() {
        return {
          drawImage(...args) {
            canvas.drawCalls.push(args);
          },
          clearRect(...args) { canvas.clearCalls.push(args); },
          save() { canvas.contextCalls.save++; },
          restore() { canvas.contextCalls.restore++; },
          setTransform() {},
          transform() { canvas.contextCalls.transform++; },
          translate() {},
          beginPath() {},
          rect() {},
          clip() {},
          createPattern() { return {}; },
          measureText(text) { return { width: String(text).length * 10 }; },
          fillText() {},
          strokeText() {},
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

// Real-device CanvasImage objects can have width/height without browser
// naturalWidth/readyState. They must still be visible and bounded.
const deviceImage = { width: 9, height: 7 };
const deviceBitmap = new createjs.Bitmap(deviceImage);
assert.equal(deviceBitmap.isVisible(), true);
assert.deepEqual(
  { width: deviceBitmap.getBounds().width, height: deviceBitmap.getBounds().height },
  { width: 9, height: 7 },
);
const deviceCanvas = createjs.createCanvas(20, 20);
const deviceStage = new createjs.Stage(deviceCanvas);
deviceStage.tickOnUpdate = false;
deviceStage.addChild(deviceBitmap);
deviceStage.update();
assert.strictEqual(deviceCanvas.drawCalls[0][0], deviceImage);
assert.doesNotThrow(() => new createjs.Graphics().beginBitmapFill(deviceImage));

const cacheText = new createjs.Text("Glyph", "20px sans-serif", "#000");
cacheText.setBounds(0, 0, 50, 20);
const textPadding = cacheText._getPhase2BoundsPadding();
assert.ok(textPadding >= 7);
const textState = {};
cacheText._updatePhase2Bounds(textState);
assert.ok(textState.x <= -textPadding);
const textCacheManager = new createjs.CacheManager();
assert.equal(textCacheManager.create(cacheText), true);
assert.equal(cacheText.bitmapCache.x, -textPadding);
assert.equal(cacheText.bitmapCache.width, 50 + textPadding * 2);
textCacheManager.release(cacheText);

const pooledMatrix = createjs.Matrix2DPool.get().setValues(2, 0, 0, 2, 3, 4);
createjs.Matrix2DPool.release(pooledMatrix);
assert.ok(createjs.Matrix2DPool.size >= 1);
assert.deepEqual(
  createjs.Matrix2DPool.get().setValues(),
  new createjs.Matrix2D(),
);

const transformProbe = new createjs.Bitmap(canvas);
transformProbe.x = 7;
assert.equal(transformProbe.getMatrix().tx, 7);
transformProbe.x = 11;
assert.equal(transformProbe.getMatrix().tx, 11);

const spriteSheet = new createjs.SpriteSheet({ images: [canvas], frames: [[0, 0, 2, 3]] });
assert.deepEqual(
  { x: spriteSheet._frameCache[0].x, width: spriteSheet._frameCache[0].width },
  { x: 0, width: 2 },
);

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

const fastCanvas = createjs.createCanvas(100, 80);
const fastStage = new createjs.Stage(fastCanvas);
fastStage.tickOnUpdate = false;
fastStage.addChild(new createjs.Bitmap(canvas).set({ x: 3, y: 4 }));
createjs.performance.enable = true;
fastStage.update();
assert.equal(fastCanvas.contextCalls.save, 1);
assert.equal(fastCanvas.contextCalls.restore, 1);
assert.equal(fastCanvas.drawCalls.length, 1);
assert.deepEqual(fastCanvas.drawCalls[0].slice(1), [3, 4]);
assert.equal(createjs.performance.drawCount, 1);
assert.equal(createjs.performance.displayObjectCount, 1);
fastStage.addChild(new createjs.Bitmap(canvas).set({ rotation: 10 }));
fastStage.update();
assert.equal(createjs.performance.displayObjectCount, 2);
assert.ok(fastCanvas.contextCalls.save >= 3);
const directlyManaged = new createjs.Bitmap(canvas);
directlyManaged.parent = fastStage;
fastStage.children.push(directlyManaged);
fastStage.update();
assert.equal(createjs.performance.displayObjectCount, 3);
createjs.performance.enable = false;

// Phase 2 dirty rectangles: unchanged frames draw nothing, and moving one
// bounded object redraws only its old/new regions.
const dirtyCanvas = createjs.createCanvas(120, 80);
const dirtyStage = new createjs.Stage(dirtyCanvas);
dirtyStage.tickOnUpdate = false;
const movingBitmap = new createjs.Bitmap(canvas).set({ x: 4, y: 4 });
const stillBitmap = new createjs.Bitmap(canvas).set({ x: 90, y: 60 });
dirtyStage.addChild(movingBitmap, stillBitmap);
createjs.performance.enable = true;
dirtyStage.update();
const initialDraws = dirtyCanvas.drawCalls.length;
dirtyStage.update();
assert.equal(dirtyCanvas.drawCalls.length, initialDraws);
assert.equal(createjs.performance.fullRender, false);
movingBitmap.x = 30;
const clearCount = dirtyCanvas.clearCalls.length;
dirtyStage.update();
assert.ok(dirtyCanvas.clearCalls.length > clearCount);
assert.ok(createjs.performance.dirtyRect >= 1);
assert.equal(createjs.performance.fullRender, false);
assert.equal(dirtyCanvas.drawCalls.length, initialDraws + 1);

// Phase 2 has a complete fallback to the original full-render path.
createjs.performance.phase2 = false;
const fallbackDraws = dirtyCanvas.drawCalls.length;
dirtyStage.update();
assert.equal(dirtyCanvas.drawCalls.length, fallbackDraws + 2);
createjs.performance.phase2 = true;

// Stable containers flatten into an internal auto-generated bitmap cache and
// return to live rendering as soon as they change.
const cacheCanvas = createjs.createCanvas(120, 80);
const cacheStage = new createjs.Stage(cacheCanvas);
cacheStage.tickOnUpdate = false;
cacheStage.scaleX = cacheStage.scaleY = 2;
cacheStage._cacheManager.staticFrames = 2;
const staticGroup = new createjs.Container();
for (let i = 0; i < 3; i++) {
  staticGroup.addChild(new createjs.Bitmap(canvas).set({ x: i * 5 }));
}
cacheStage.addChild(staticGroup);
cacheStage.update();
cacheStage.update();
cacheStage.update();
assert.equal(staticGroup._autoCache, true);
assert.ok(staticGroup.bitmapCache);
assert.equal(staticGroup.cacheCanvas, null);
assert.equal(staticGroup.bitmapCache.scale, 2);
createjs.performance.phase2 = false;
cacheStage.update();
assert.equal(staticGroup._autoCache, false);
createjs.performance.phase2 = true;
cacheStage._cacheManager.staticFrames = 2;
cacheStage.update();
cacheStage.update();
cacheStage.update();
assert.equal(staticGroup._autoCache, true);
staticGroup.x = 10;
cacheStage.update();
assert.equal(staticGroup._autoCache, false);

const movieCacheCanvas = createjs.createCanvas(40, 40);
const movieCacheStage = new createjs.Stage(movieCacheCanvas);
movieCacheStage.tickOnUpdate = false;
const stoppedClip = new createjs.MovieClip({ paused: true });
stoppedClip.setBounds(0, 0, 10, 10);
stoppedClip.addChild(new createjs.Bitmap(canvas));
movieCacheStage.addChild(stoppedClip);
movieCacheStage.update();
movieCacheStage.update();
movieCacheStage.update();
assert.equal(stoppedClip._autoCache, true);
stoppedClip.gotoAndPlay(0);
assert.equal(stoppedClip._autoCache, false);

// Static leaves are omitted from the active tick list, while tick listeners
// added later become active immediately.
const tickCanvas = createjs.createCanvas(20, 20);
const tickStage = new createjs.Stage(tickCanvas);
const tickBitmap = new createjs.Bitmap(canvas);
tickStage.addChild(tickBitmap);
tickStage.update();
let optimizedTicks = 0;
const tickListener = () => optimizedTicks++;
tickBitmap.addEventListener("tick", tickListener);
tickStage.update();
assert.equal(optimizedTicks, 1);
tickBitmap.removeEventListener("tick", tickListener);
tickStage.update();
assert.equal(optimizedTicks, 1);
createjs.performance.enable = false;

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
