const createjs = require("../../libs/createjs-miniprogram/easeljs.js");
require("../../libs/createjs-miniprogram/animation.js");

const SceneSession = require("../../utils/scene-session");

Page({
  data: {
    testName: "1000 Bitmap", fps: "0.0", updateTime: "0.00", renderTime: "0.00",
    drawCount: 0, displayObjectCount: 0, firstPaint: 0, memory: "N/A",
    dirtyRect: 0, fullRender: true, cacheObject: 0, skippedObjects: 0, bitmapBatches: 0,
    phase2: true, drawCalls: 0, p50: "0.00", p95: "0.00",
  },

  onReady() {
    wx.createSelectorQuery().select("#benchmarkCanvas").fields({ node: true, size: true })
      .exec(([result]) => !this.unloaded && result && result.node && this.init(result.node, result.width, result.height));
  },

  init(canvas, width, height) {
    const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    this.width = width; this.height = height; this.dpr = dpr;
    this.stage = new createjs.Stage(canvas);
    this.stage.scaleX = this.stage.scaleY = dpr;
    this.tile = createjs.createCanvas(8, 8);
    const tileContext = this.tile.getContext("2d");
    tileContext.fillStyle = "#65dcff";
    tileContext.fillRect(0, 0, 8, 8);
    this.previousPerformance = {enable:createjs.performance.enable, phase2:createjs.performance.phase2};
    createjs.performance.enable = !this.hidden;
    createjs.Ticker.framerate = 60;
    this.tick = (event) => {
      createjs.performance.phase2 = this.data.phase2;
      this.stage.update(event);
      if (!this.firstPaintRecorded) {
        this.firstPaintRecorded = true;
        this.setData({ firstPaint: Date.now() - this.startTime });
      }
    };
    this.session = new SceneSession(createjs, this.tick);
    this.session.setActive(!this.hidden);
    if (!this.hidden) this.metricsTimer = setInterval(() => this.updateMetrics(), 500);
    this.buildBitmapTest();
  },

  reset(name) {
    this.session.clearTweens();
    this.stage.removeAllChildren();
    createjs.performance.reset();
    this.startTime = Date.now();
    this.firstPaintRecorded = false;
    this.setData({ testName: name, firstPaint: 0 });
  },

  buildBitmapTest() {
    this.reset("1000 静态 Bitmap / 自动 Flatten");
    const group = new createjs.Container();
    for (let i = 0; i < 1000; i++) {
      const bitmap = new createjs.Bitmap(this.tile);
      bitmap.x = (i % 50) * (this.width / 50);
      bitmap.y = ((i / 50) | 0) * (this.height / 20);
      group.addChild(bitmap);
    }
    this.stage.addChild(group);
  },

  buildMovieClipTest() {
    this.reset("100 MovieClip × 10 帧");
    for (let i = 0; i < 100; i++) {
      const clip = new createjs.MovieClip({ loop: -1 });
      const bitmap = new createjs.Bitmap(this.tile);
      clip.timeline.addTween(createjs.Tween.get(bitmap).to({ x: 18 }, 5).to({ x: 0 }, 5));
      clip.x = (i % 10) * (this.width / 10);
      clip.y = ((i / 10) | 0) * (this.height / 10);
      this.stage.addChild(clip);
    }
  },

  buildMovingTest() {
    this.reset("100 移动 Bitmap / Dirty Rectangle");
    for (let i = 0; i < 100; i++) {
      const bitmap = new createjs.Bitmap(this.tile);
      bitmap.x = (i % 10) * (this.width / 10);
      bitmap.y = ((i / 10) | 0) * (this.height / 10);
      this.stage.addChild(bitmap);
      this.session.tween(bitmap, { loop: -1 })
        .to({ x: Math.min(this.width - 8, bitmap.x + 18) }, 500 + i * 2)
        .to({ x: bitmap.x }, 500 + i * 2);
    }
  },

  toggleOptimization() {
    this.setData({phase2: !this.data.phase2});
    createjs.performance.reset();
  },

  buildDeepTest() {
    this.reset("深层容器与复杂 Shape");
    const root = new createjs.Container();
    let parent = root;
    for (let depth=0; depth<20; depth++) {
      const child = new createjs.Container(); child.x=1; child.y=1;
      parent.addChild(child); parent=child;
    }
    for (let i=0; i<100; i++) {
      const shape = new createjs.Shape();
      shape.graphics.beginFill("#65dcff");
      for (let j=0; j<20; j++) shape.graphics.drawRect(j, j%5, 2, 2);
      shape.setBounds(0,0,22,7);
      shape.x=(i%10)*(this.width/10); shape.y=((i/10)|0)*(this.height/10);
      parent.addChild(shape);
    }
    this.stage.addChild(root);
  },

  runTest(event) {
    const test = event.currentTarget.dataset.test;
    if (test === "movieclip") this.buildMovieClipTest();
    else if (test === "moving") this.buildMovingTest();
    else if (test === "deep") this.buildDeepTest();
    else this.buildBitmapTest();
  },

  updateMetrics() {
    const metrics = createjs.performance.getMetrics();
    this.setData({
      fps: metrics.fps.toFixed(1), updateTime: metrics.updateTime.toFixed(2),
      renderTime: metrics.renderTime.toFixed(2), drawCount: metrics.drawCount,
      displayObjectCount: metrics.displayObjectCount,
      dirtyRect: metrics.dirtyRect, fullRender: metrics.fullRender,
      cacheObject: metrics.cacheObject, skippedObjects: metrics.skippedObjects,
      drawCalls: metrics.drawCalls, p50: metrics.frameTimeP50.toFixed(2), p95: metrics.frameTimeP95.toFixed(2),
      bitmapBatches: metrics.bitmapBatches,
      memory: metrics.memory == null ? "N/A" : `${(metrics.memory / 1048576).toFixed(1)} MB`,
    });
  },

  onHide() {
    this.hidden = true;
    if (this.session) this.session.setActive(false);
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    this.metricsTimer = null;
    if (this.previousPerformance) {
      createjs.performance.enable = this.previousPerformance.enable;
      createjs.performance.phase2 = this.previousPerformance.phase2;
      this.previousPerformance = null;
    }
  },

  onShow() {
    this.hidden = false;
    if (this.session) {
      this.previousPerformance = {enable:createjs.performance.enable, phase2:createjs.performance.phase2};
      createjs.performance.enable = true;
      createjs.performance.phase2 = this.data.phase2;
      createjs.performance.reset();
      this.session.setActive(true);
      if (!this.metricsTimer) this.metricsTimer = setInterval(() => this.updateMetrics(), 500);
    }
  },

  onUnload() {
    this.unloaded = true;
    this.onHide();
    if (this.session) this.session.dispose();
    if (this.stage) this.stage.dispose();
    this.session = this.stage = this.tile = null;
  },
});
