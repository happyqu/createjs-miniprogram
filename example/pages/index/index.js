const createjs = require("../../libs/createjs-miniprogram/easeljs.js");
require("../../libs/createjs-miniprogram/text.js");
require("../../libs/createjs-miniprogram/tweenjs.js");

Page({
  data: {
    ready: false,
    clicks: 0,
    stageCached: false,
  },

  onReady() {
    wx.createSelectorQuery()
      .select("#demoCanvas")
      .fields({ node: true, size: true })
      .exec(([result]) => {
        if (!result || !result.node) {
          return;
        }
        this.initDemo(result.node, result.width, result.height);
      });
  },

  initDemo(canvas, width, height) {
    const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    this.canvas = canvas;
    this.stageWidth = width;
    this.stageHeight = height;
    this.dpr = dpr;
    this.context = canvas.getContext("2d");
    this.applyRoundedClip(this.context, canvas.width, canvas.height, 16 * dpr);

    const stage = this.stage = new createjs.Stage(canvas);
    stage.autoClear = false;
    stage.scaleX = stage.scaleY = dpr;
    createjs.Touch.enable(stage, {
      pixelRatio: dpr,
      allowDefault: true,
    });

    this.buildScene(stage, width, height);
    this.loadDemoImage(canvas, stage);

    createjs.Ticker.framerate = 60;
    this.tickHandler = () => {
      this.context.setTransform(1, 0, 0, 1, 0, 0);
      this.context.clearRect(0, 0, canvas.width, canvas.height);
      stage.update();
    };
    createjs.Ticker.addEventListener("tick", this.tickHandler);
    this.setData({ ready: true });
  },

  applyRoundedClip(context, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(r, 0);
    context.lineTo(width - r, 0);
    context.arcTo(width, 0, width, r, r);
    context.lineTo(width, height - r);
    context.arcTo(width, height, width - r, height, r);
    context.lineTo(r, height);
    context.arcTo(0, height, 0, height - r, r);
    context.lineTo(0, r);
    context.arcTo(0, 0, r, 0, r);
    context.closePath();
    context.clip();
  },

  buildScene(stage, width, height) {
    const centerX = width / 2;

    const background = new createjs.Shape();
    background.graphics
      .beginLinearGradientFill(["#081426", "#102b4e"], [0, 1], 0, 0, 0, height)
      .drawRect(0, 0, width, height);
    stage.addChild(background);

    const glow = new createjs.Shape();
    glow.graphics.beginFill("rgba(60, 190, 255, 0.10)").drawCircle(0, 0, 118);
    glow.x = centerX;
    glow.y = 185;
    stage.addChild(glow);

    createjs.Tween.get(glow, { loop: -1 })
      .to({ scaleX: 1.18, scaleY: 1.18, alpha: 0.35 }, 1300, createjs.Ease.sineInOut)
      .to({ scaleX: 1, scaleY: 1, alpha: 1 }, 1300, createjs.Ease.sineInOut);

    const orbit = new createjs.Shape();
    orbit.graphics
      .setStrokeStyle(2)
      .beginStroke("rgba(125, 224, 255, 0.45)")
      .drawCircle(0, 0, 76);
    orbit.graphics.beginFill("#7de0ff").drawCircle(76, 0, 7);
    orbit.x = centerX;
    orbit.y = 185;
    stage.addChild(orbit);
    createjs.Tween.get(orbit, { loop: -1 }).to({ rotation: 360 }, 4200);

    const logo = new createjs.Shape();
    logo.graphics
      .beginLinearGradientFill(["#69e6ff", "#4d7cff"], [0, 1], -42, -42, 42, 42)
      .drawRoundRect(-45, -45, 90, 90, 24);
    logo.rotation = 45;
    logo.x = centerX;
    logo.y = 185;
    stage.addChild(logo);

    const mark = new createjs.Text("C", "700 48px sans-serif", "#ffffff");
    mark.textAlign = "center";
    mark.textBaseline = "middle";
    mark.x = centerX;
    mark.y = 185;
    stage.addChild(mark);

    const title = new createjs.Text("CreateJS Mini Program", "700 25px sans-serif", "#ffffff");
    title.textAlign = "center";
    title.x = centerX;
    title.y = 294;
    stage.addChild(title);

    const subtitle = new createjs.Text("EaselJS + TweenJS · Canvas 2D", "14px sans-serif", "#8eaccb");
    subtitle.textAlign = "center";
    subtitle.x = centerX;
    subtitle.y = 332;
    stage.addChild(subtitle);

    const maskWidth = width - 56;
    const track = new createjs.Shape();
    track.graphics.beginFill("rgba(255,255,255,0.07)").drawRoundRect(28, 386, maskWidth, 74, 37);
    stage.addChild(track);

    // CreateJS vector mask: the moving gradient is larger than the track,
    // but only the rounded mask area is rendered.
    const trackMask = new createjs.Shape();
    trackMask.graphics.beginFill("#000000").drawRoundRect(28, 386, maskWidth, 74, 37);

    const maskedGradient = new createjs.Shape();
    maskedGradient.graphics
      .beginLinearGradientFill(
        ["rgba(64, 205, 255, 0)", "rgba(64, 205, 255, 0.65)", "rgba(99, 102, 241, 0)"],
        [0, 0.5, 1],
        0,
        0,
        width,
        0,
      )
      .drawRect(-width, 386, width * 2, 74);
    maskedGradient.mask = trackMask;
    stage.addChild(maskedGradient);
    createjs.Tween.get(maskedGradient, { loop: -1 })
      .to({ x: width }, 2200, createjs.Ease.sineInOut)
      .to({ x: 0 }, 2200, createjs.Ease.sineInOut);

    const maskLabel = new createjs.Text("CREATEJS MASK", "700 11px sans-serif", "rgba(255,255,255,0.6)");
    maskLabel.x = 47;
    maskLabel.y = 400;
    maskLabel.mask = trackMask;
    stage.addChild(maskLabel);

    const ball = new createjs.Shape();
    ball.graphics.beginFill("#ffcf5a").drawCircle(0, 0, 17);
    ball.x = 10;
    ball.y = 423;
    ball.mask = trackMask;
    stage.addChild(ball);
    createjs.Tween.get(ball, { loop: -1 })
      .to({ x: width - 10, rotation: 360 }, 1500, createjs.Ease.quadInOut)
      .to({ x: 10, rotation: 0 }, 1500, createjs.Ease.quadInOut);

    const trackBorder = new createjs.Shape();
    trackBorder.graphics
      .setStrokeStyle(1)
      .beginStroke("rgba(125,224,255,0.28)")
      .drawRoundRect(28, 386, maskWidth, 74, 37);
    stage.addChild(trackBorder);

    const imageCard = new createjs.Shape();
    imageCard.graphics
      .beginFill("rgba(255,255,255,0.055)")
      .drawRoundRect(28, 488, width - 56, 120, 20);
    stage.addChild(imageCard);

    const imageTitle = new createjs.Text("createjs.Bitmap", "700 15px sans-serif", "#eaf6ff");
    imageTitle.x = 205;
    imageTitle.y = 515;
    stage.addChild(imageTitle);

    const imageMeta = new createjs.Text("本地 PNG · 640 × 400", "12px sans-serif", "#7897b8");
    imageMeta.x = 205;
    imageMeta.y = 545;
    stage.addChild(imageMeta);

    const imageHint = new createjs.Text("图片加载与遮罩测试", "12px sans-serif", "#5f7895");
    imageHint.x = 205;
    imageHint.y = 570;
    stage.addChild(imageHint);

    const button = new createjs.Container();
    const buttonBg = new createjs.Shape();
    buttonBg.graphics.beginFill("#3b82f6").drawRoundRect(-105, -27, 210, 54, 27);
    const buttonText = new createjs.Text("点击 CreateJS 按钮", "600 16px sans-serif", "#ffffff");
    buttonText.textAlign = "center";
    buttonText.textBaseline = "middle";
    button.addChild(buttonBg, buttonText);
    button.x = centerX;
    button.y = 660;
    button.cursor = "pointer";
    stage.addChild(button);

    button.on("mousedown", () => {
      button.scaleX = button.scaleY = 0.96;
    });
    button.on("pressup", () => {
      button.scaleX = button.scaleY = 1;
    });
    button.on("click", () => {
      const clicks = this.data.clicks + 1;
      this.setData({ clicks });
      buttonText.text = `已点击 ${clicks} 次`;
      createjs.Tween.removeTweens(button);
      createjs.Tween.get(button)
        .to({ rotation: 4 }, 80)
        .to({ rotation: -4 }, 80)
        .to({ rotation: 0 }, 80);
    });

    const tip = new createjs.Text("触摸按钮，体验 CreateJS 事件系统", "13px sans-serif", "#7897b8");
    tip.textAlign = "center";
    tip.x = centerX;
    tip.y = 708;
    stage.addChild(tip);
  },

  loadDemoImage(canvas, stage) {
    if (typeof canvas.createImage !== "function") {
      console.error("当前 Canvas 不支持 createImage()");
      return;
    }

    const image = canvas.createImage();
    this.demoImage = image;
    image.onload = () => {
      if (this.stage !== stage) {
        return;
      }

      const frame = { x: 40, y: 500, width: 145, height: 96 };
      const scale = Math.max(frame.width / image.width, frame.height / image.height);
      const bitmap = new createjs.Bitmap(image);
      bitmap.scaleX = bitmap.scaleY = scale;
      bitmap.x = frame.x + (frame.width - image.width * scale) / 2;
      bitmap.y = frame.y + (frame.height - image.height * scale) / 2;

      const imageMask = new createjs.Shape();
      imageMask.graphics
        .beginFill("#000000")
        .drawRoundRect(frame.x, frame.y, frame.width, frame.height, 14);
      bitmap.mask = imageMask;
      stage.addChild(bitmap);

      const border = new createjs.Shape();
      border.graphics
        .setStrokeStyle(1)
        .beginStroke("rgba(125,224,255,0.35)")
        .drawRoundRect(frame.x, frame.y, frame.width, frame.height, 14);
      stage.addChild(border);

      bitmap.alpha = 0;
      createjs.Tween.get(bitmap).to({ alpha: 1 }, 450, createjs.Ease.quadOut);
    };
    image.onerror = (error) => {
      console.error("CreateJS 测试图片加载失败", error);
    };
    image.src = "/images/createjs-demo.png";
  },

  canvasEvent(event) {
    createjs.Touch.handleEvent(this.stage, event);
  },

  toggleStageCache() {
    const stage = this.stage;
    if (!stage) {
      return;
    }

    if (stage.cacheCanvas) {
      stage.uncache();
      this.setData({ stageCached: false });
      return;
    }

    // Cache coordinates use CreateJS logical pixels. The explicit scale keeps
    // the cached bitmap sharp on high-DPR Mini Program canvases.
    stage.cache(0, 0, this.stageWidth, this.stageHeight, this.dpr);
    this.setData({ stageCached: true });
  },

  onUnload() {
    if (this.tickHandler) {
      createjs.Ticker.removeEventListener("tick", this.tickHandler);
    }
    createjs.Tween.removeAllTweens();
    if (this.stage) {
      createjs.Touch.disable(this.stage);
      this.stage.removeAllChildren();
    }
    this.stage = null;
    this.canvas = null;
    this.demoImage = null;
    this.stageWidth = null;
    this.stageHeight = null;
    this.dpr = null;
  },
});
