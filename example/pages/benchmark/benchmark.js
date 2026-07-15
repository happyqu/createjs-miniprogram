const createjs = require("../../libs/createjs-miniprogram/easeljs.js");
require("../../libs/createjs-miniprogram/tweenjs.js");

Page({
  data: {
    testName: "1000 Bitmap", fps: "0.0", updateTime: "0.00", renderTime: "0.00",
    drawCount: 0, displayObjectCount: 0, firstPaint: 0, memory: "N/A",
  },

  onReady() {
    wx.createSelectorQuery().select("#benchmarkCanvas").fields({ node: true, size: true })
      .exec(([result]) => result && this.init(result.node, result.width, result.height));
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
    createjs.performance.enable = true;
    createjs.Ticker.framerate = 60;
    this.tick = (event) => {
      this.stage.update(event);
      if (!this.firstPaintRecorded) {
        this.firstPaintRecorded = true;
        this.setData({ firstPaint: Date.now() - this.startTime });
      }
    };
    createjs.Ticker.addEventListener("tick", this.tick);
    this.metricsTimer = setInterval(() => this.updateMetrics(), 500);
    this.buildBitmapTest();
  },

  reset(name) {
    createjs.Tween.removeAllTweens();
    this.stage.removeAllChildren();
    createjs.performance.reset();
    this.startTime = Date.now();
    this.firstPaintRecorded = false;
    this.setData({ testName: name, firstPaint: 0 });
  },

  buildBitmapTest() {
    this.reset("1000 Bitmap");
    for (let i = 0; i < 1000; i++) {
      const bitmap = new createjs.Bitmap(this.tile);
      bitmap.x = (i % 50) * (this.width / 50);
      bitmap.y = ((i / 50) | 0) * (this.height / 20);
      this.stage.addChild(bitmap);
    }
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

  buildComplexTest() {
    this.reset("复杂混合场景");
    for (let i = 0; i < 200; i++) {
      const container = new createjs.Container();
      const shape = new createjs.Shape();
      shape.graphics.beginFill(i % 2 ? "#7c6cff" : "#52d6b8").drawCircle(0, 0, 5 + i % 8);
      container.addChild(shape);
      container.x = (i * 37) % this.width;
      container.y = (i * 53) % this.height;
      this.stage.addChild(container);
      createjs.Tween.get(container, { loop: -1 }).to({ rotation: 360, alpha: 0.35 }, 900 + i * 3).to({ alpha: 1 }, 300);
    }
  },

  runTest(event) {
    const test = event.currentTarget.dataset.test;
    if (test === "movieclip") this.buildMovieClipTest();
    else if (test === "complex") this.buildComplexTest();
    else this.buildBitmapTest();
  },

  updateMetrics() {
    const metrics = createjs.performance.getMetrics();
    this.setData({
      fps: metrics.fps.toFixed(1), updateTime: metrics.updateTime.toFixed(2),
      renderTime: metrics.renderTime.toFixed(2), drawCount: metrics.drawCount,
      displayObjectCount: metrics.displayObjectCount,
      memory: metrics.memory == null ? "N/A" : `${(metrics.memory / 1048576).toFixed(1)} MB`,
    });
  },

  onUnload() {
    if (this.tick) createjs.Ticker.removeEventListener("tick", this.tick);
    if (this.metricsTimer) clearInterval(this.metricsTimer);
    createjs.Tween.removeAllTweens();
    createjs.performance.enable = false;
  },
});
