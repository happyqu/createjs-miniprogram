# @happyqu/createjs-miniprogram

适配微信小程序 Canvas 的 CreateJS npm 包，包含常用的 EaselJS 与 TweenJS API。

源码中的 `src/createjs/createjs.js` 只负责创建共享的 `createjs` 对象；EaselJS 构建入口是 `src/easeljs/package.js`，TweenJS 构建入口是 `src/tweenjs/package.js`。

## 安装

```bash
npm install @happyqu/createjs-miniprogram
```

安装后，在微信开发者工具中执行“工具 → 构建 npm”。

## 使用

```js
import createjs from "@happyqu/createjs-miniprogram";

Page({
  onReady() {
    wx.createSelectorQuery()
      .select("#canvas")
      .fields({ node: true, size: true })
      .exec(([result]) => {
        const canvas = result.node;
        createjs.canvas = canvas;

        const stage = new createjs.Stage(canvas);
        const shape = new createjs.Shape();
        shape.graphics.beginFill("#07c160").drawCircle(50, 50, 30);
        stage.addChild(shape);
        stage.update();
      });
  },
});
```

CommonJS 也可直接使用：

```js
const createjs = require("@happyqu/createjs-miniprogram");
```

### 按需加载（推荐）

完整入口保持兼容，包含全部 EaselJS API。对小程序包体积敏感时，可以改用核心入口：

```js
const createjs = require("@happyqu/createjs-miniprogram/core");
```

核心入口包含 Stage、Container、DisplayObject、Graphics、Shape、Bitmap、Sprite、
SpriteSheet、Ticker、Touch、缓存和 Phase 1/2 性能优化等常用能力。当前 CommonJS
构建约 76.8KB，比完整入口约 110.8KB 减少约 30%。其余能力按业务需要加载：

```js
require("@happyqu/createjs-miniprogram/text");      // Text、BitmapText
require("@happyqu/createjs-miniprogram/movieclip"); // MovieClip
require("@happyqu/createjs-miniprogram/filters");   // Canvas 2D 滤镜
require("@happyqu/createjs-miniprogram/builder");   // SpriteSheet 工具
require("@happyqu/createjs-miniprogram/ui");        // ButtonHelper
```

扩展会注册到同一个核心 `createjs` 对象，不会改变原有调用方式：

```js
const createjs = require("@happyqu/createjs-miniprogram/core");
require("@happyqu/createjs-miniprogram/text");

const label = new createjs.Text("Hello", "20px sans-serif", "#fff");
```

只应在 `core` 入口上组合这些扩展；使用完整入口时不需要重复加载。

### 触摸事件

小程序 Canvas 事件需要转发给 `Touch.handleEvent()`：

```xml
<canvas
  type="2d"
  bindtouchstart="canvasEvent"
  bindtouchmove="canvasEvent"
  bindtouchend="canvasEvent"
  bindtouchcancel="canvasEvent"
/>
```

```js
createjs.Touch.enable(stage, {
  pixelRatio: dpr,
  allowDefault: true,
});

Page({
  canvasEvent(event) {
    createjs.Touch.handleEvent(stage, event);
  },
});
```

TweenJS 是主入口的扩展包。导入后会向同一个 `createjs` 对象注册 Tween API，并复用 `createjs.Ticker`：

```js
import createjs from "@happyqu/createjs-miniprogram";
import "@happyqu/createjs-miniprogram/tweenjs";

createjs.Tween.get(target).to({ x: 100 }, 500, createjs.Ease.quadOut);
```

### 性能监控

运行时指标默认关闭，打开后可同时查看 Phase 1 与 Phase 2 数据：

```js
createjs.performance.enable = true;

stage.update(event);
console.log(createjs.performance.getMetrics());
// 还包括 dirtyRect、fullRender、cacheObject、drawCalls、
// skippedObjects 和 bitmapBatches
```

Phase 2 渲染优化默认开启，可随时完整回退：

```js
createjs.performance.phase2 = false;
```

开启 `createjs.performance.debug = true` 会逐帧输出脏矩形、全量渲染、自动缓存、DrawCall 与跳过对象等信息。微信开发者工具中的 `pages/benchmark/benchmark` 页面可运行 1000 静态 Bitmap、100 移动对象和 100 个 10 帧 MovieClip 测试。

## 开发与发布

```bash
npm install
npm test
npm run size
npm publish
```

`npm test` 会生成 ESM、CommonJS 和类型声明，验证完整入口、核心入口及扩展共享实例，并检查体积上限。`npm run size` 可查看每个构建文件的原始与 gzip 体积。`prepublishOnly` 会在发布前再次测试并检查最终包内容。

## 兼容性

- 运行环境需要微信小程序提供 `wx.createOffscreenCanvas`。
- 根入口包含 2D Canvas 版本的 EaselJS，不包含 TweenJS，也未启用依赖 DOM/WebGL 的模块。
- TweenJS 及其插件通过 `@happyqu/createjs-miniprogram/tweenjs` 扩展主入口，共用同一个 `createjs` 对象和 `Ticker`；插件需要按需调用其 `install()` 方法。
- `createjs.globalDispatcher` 是导入后即可使用的包级事件总线。
