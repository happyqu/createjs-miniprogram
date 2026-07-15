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

运行时指标默认关闭，打开后可同时查看 Phase 1、Phase 2 与 Phase 3 数据：

```js
createjs.performance.enable = true;

stage.update(event);
console.log(createjs.performance.getMetrics());
// 还包括 dirtyRect、fullRender、cacheObject、drawCalls、
// skippedObjects、bitmapBatches、compiledRender、commandCount、
// canvasCalls 和 offscreenSurfaces
```

Phase 2 渲染优化默认开启，可随时完整回退：

```js
createjs.performance.phase2 = false;
```

Phase 3 的编译命令流、世界矩阵缓存和 OffscreenCanvas 复用默认开启，也可独立回退：

```js
createjs.performance.phase3 = false;
```

纯 Bitmap/MovieClip 显示列表会走编译后的 CanvasRenderer；Mask、Filter、混合模式、缓存对象和自定义 draw 自动使用原始兼容路径。`createjs.OffscreenCache.shared` 管理有容量上限的离屏画布池，`createjs.TextureManager.shared` 可用于图片去重和引用计数。

微信 Worker 暂不直接操作主 Canvas。Phase 3 先提供矩阵批计算桥接，示例 Worker 位于 `workers/createjs-render-worker.js`：

```js
const worker = wx.createWorker("workers/createjs-render-worker.js");
createjs.workerRenderer.connect(worker);
const matrices = await createjs.workerRenderer.computeMatrices(items);
```

开启 `createjs.performance.inspect = true` 会逐帧输出渲染树、编译命令、离屏缓存和 Canvas 调用等信息。微信开发者工具中的 `pages/benchmark/benchmark` 页面可运行 1000 静态 Bitmap、100 移动对象和 100 个 10 帧 MovieClip 测试，并可现场切换 Phase 3 开关对比。

## 开发与发布

```bash
npm install
npm test
npm publish
```

`npm test` 会生成 ESM、CommonJS 和类型声明，并运行最小导入测试。`prepublishOnly` 会在发布前再次测试并检查最终包内容。

Phase 3 的同场景对比可运行：

```bash
npm run benchmark:phase3
```

## 兼容性

- 运行环境需要微信小程序提供 `wx.createOffscreenCanvas`。
- 根入口包含 2D Canvas 版本的 EaselJS，不包含 TweenJS，也未启用依赖 DOM/WebGL 的模块。
- TweenJS 及其插件通过 `@happyqu/createjs-miniprogram/tweenjs` 扩展主入口，共用同一个 `createjs` 对象和 `Ticker`；插件需要按需调用其 `install()` 方法。
- `createjs.globalDispatcher` 是导入后即可使用的包级事件总线。
