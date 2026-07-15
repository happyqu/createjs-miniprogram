const createjs = require("../../libs/createjs-miniprogram/easeljs.js");
require("../../libs/createjs-miniprogram/tweenjs.js");

Page({
  data: {
    runtimeMode: createjs.performance ? "优化版（运行时指标可用）" : "v1.0.1 基线",
    testName: "1000 静态 Bitmap",
    fps: "0.0",
    averageTime: "0.00",
    p95Time: "0.00",
    maxTime: "0.00",
    firstPaint: "0.00",
    objectCount: 0,
    drawCalls: "N/A",
    dirtyRect: "N/A",
    cacheObject: "N/A",
    skippedObjects: "N/A",
  },

  onReady() {
    wx.createSelectorQuery().select("#benchmarkCanvas").fields({ node: true, size: true })
      .exec(([result]) => result && result.node && this.init(result.node, result.width, result.height));
  },

  init(canvas, width, height) {
    const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.stage = new createjs.Stage(canvas);
    this.stage.scaleX = this.stage.scaleY = dpr;
    this.tile = createjs.createCanvas(8, 8);
    const tileContext = this.tile.getContext("2d");
    tileContext.fillStyle = "#62ddff";
    tileContext.fillRect(0, 0, 8, 8);
    if (createjs.performance) {
      createjs.performance.enable = true;
      createjs.performance.debug = false;
    }
    createjs.Ticker.framerate = 60;
    this.tickHandler = (event) => this.onTick(event);
    createjs.Ticker.addEventListener("tick", this.tickHandler);
    this.buildStatic();
  },

  reset(name) {
    createjs.Tween.removeAllTweens();
    this.stage.removeAllChildren();
    if (createjs.performance && createjs.performance.reset) createjs.performance.reset();
    this.samples = [];
    this.frameCount = 0;
    this.windowStart = Date.now();
    this.sceneStart = this.windowStart;
    this.firstFrame = true;
    this.dynamicStep = null;
    this.setData({
      testName: name,
      fps: "0.0",
      averageTime: "0.00",
      p95Time: "0.00",
      maxTime: "0.00",
      firstPaint: "0.00",
    });
  },

  addBitmap(index, totalColumns = 50) {
    const bitmap = new createjs.Bitmap(this.tile);
    bitmap.x = (index % totalColumns) * (this.width / totalColumns);
    bitmap.y = ((index / totalColumns) | 0) * (this.height / 20);
    return bitmap;
  },

  buildStatic() {
    this.reset("1000 静态 Bitmap");
    const group = new createjs.Container();
    for (let i = 0; i < 1000; i++) group.addChild(this.addBitmap(i));
    this.stage.addChild(group);
    this.objectCount = 1001;
  },

  buildMoving() {
    this.reset("100 移动 Bitmap");
    for (let i = 0; i < 100; i++) {
      const bitmap = new createjs.Bitmap(this.tile);
      bitmap.x = (i % 10) * (this.width / 10);
      bitmap.y = ((i / 10) | 0) * (this.height / 10);
      this.stage.addChild(bitmap);
      const startX = bitmap.x;
      createjs.Tween.get(bitmap, { loop: -1 })
        .to({ x: Math.min(this.width - 8, startX + 18) }, 500 + i * 2)
        .to({ x: startX }, 500 + i * 2);
    }
    this.objectCount = 100;
  },

  buildMovieClips() {
    this.reset("100 MovieClip × 10 帧");
    for (let i = 0; i < 100; i++) {
      const clip = new createjs.MovieClip({ loop: -1 });
      const bitmap = new createjs.Bitmap(this.tile);
      clip.timeline.addTween(createjs.Tween.get(bitmap).to({ x: 18 }, 5).to({ x: 0 }, 5));
      clip.setBounds(0, 0, 26, 10);
      clip.x = (i % 10) * (this.width / 10);
      clip.y = ((i / 10) | 0) * (this.height / 10);
      this.stage.addChild(clip);
    }
    this.objectCount = 200;
  },

  runTest(event) {
    const test = event.currentTarget.dataset.test;
    if (test === "moving") this.buildMoving();
    else if (test === "movieclip") this.buildMovieClips();
    else this.buildStatic();
  },

  onTick(event) {
    if (!this.stage) return;
    if (this.dynamicStep) this.dynamicStep();
    const start = Date.now();
    this.stage.update(event);
    const duration = Date.now() - start;
    this.samples.push(duration);
    if (this.samples.length > 300) this.samples.shift();
    this.frameCount++;
    if (this.firstFrame) {
      this.firstFrame = false;
      this.setData({ firstPaint: (Date.now() - this.sceneStart).toFixed(2) });
    }
    const now = Date.now();
    if (now - this.windowStart >= 1000) this.publishMetrics(now);
  },

  publishMetrics(now) {
    const sorted = this.samples.slice().sort((a, b) => a - b);
    const sum = sorted.reduce((total, value) => total + value, 0);
    const runtime = createjs.performance && createjs.performance.getMetrics
      ? createjs.performance.getMetrics()
      : null;
    this.setData({
      fps: (this.frameCount * 1000 / (now - this.windowStart)).toFixed(1),
      averageTime: (sum / Math.max(1, sorted.length)).toFixed(2),
      p95Time: (sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] || 0).toFixed(2),
      maxTime: (sorted[sorted.length - 1] || 0).toFixed(2),
      objectCount: runtime ? runtime.displayObjectCount : this.objectCount,
      drawCalls: runtime ? runtime.drawCalls : "N/A",
      dirtyRect: runtime ? runtime.dirtyRect : "N/A",
      cacheObject: runtime ? runtime.cacheObject : "N/A",
      skippedObjects: runtime ? runtime.skippedObjects : "N/A",
    });
    this.frameCount = 0;
    this.windowStart = now;
  },

  copyResults() {
    const result = {
      runtime: this.data.runtimeMode,
      scene: this.data.testName,
      fps: this.data.fps,
      averageTime: this.data.averageTime,
      p95Time: this.data.p95Time,
      maxTime: this.data.maxTime,
      firstPaint: this.data.firstPaint,
      objectCount: this.data.objectCount,
      drawCalls: this.data.drawCalls,
      dirtyRect: this.data.dirtyRect,
      cacheObject: this.data.cacheObject,
      skippedObjects: this.data.skippedObjects,
      device: wx.getDeviceInfo ? wx.getDeviceInfo() : {},
    };
    wx.setClipboardData({ data: JSON.stringify(result, null, 2) });
  },

  onUnload() {
    if (this.tickHandler) createjs.Ticker.removeEventListener("tick", this.tickHandler);
    createjs.Tween.removeAllTweens();
    if (createjs.performance) createjs.performance.enable = false;
    if (this.stage) this.stage.removeAllChildren();
    this.stage = null;
  },
});
