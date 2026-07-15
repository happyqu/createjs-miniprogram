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

## 开发与发布

### 性能基准

仓库中的 `happyqu-createjs-miniprogram-1.0.1.tgz` 作为未优化基线。以下命令会构建当前源码，并用相同场景对比 v1.0.1：

```bash
npm run benchmark:performance
```

测试场景与优化版完全一致：1000 静态 Bitmap、100 移动 Bitmap，以及 100 个 10 帧 MovieClip。命令行结果包含 JS 耗时、主 Canvas DrawCall 和清屏面积；使用 `--json` 可输出完整原始指标：

```bash
node scripts/performance-compare.cjs --json
```

真机测试请打开示例中的 `pages/benchmark/benchmark`，在相同手机、微信基础库和 Release 构建下让每个场景运行至少 10 秒。优化版若提供 `createjs.performance`，页面还会展示脏矩形、自动缓存和跳过对象数量。

```bash
npm install
npm test
npm publish
```

`npm test` 会生成 ESM、CommonJS 和类型声明，并运行最小导入测试。`prepublishOnly` 会在发布前再次测试并检查最终包内容。

## 兼容性

- 运行环境需要微信小程序提供 `wx.createOffscreenCanvas`。
- 根入口包含 2D Canvas 版本的 EaselJS，不包含 TweenJS，也未启用依赖 DOM/WebGL 的模块。
- TweenJS 及其插件通过 `@happyqu/createjs-miniprogram/tweenjs` 扩展主入口，共用同一个 `createjs` 对象和 `Ticker`；插件需要按需调用其 `install()` 方法。
- `createjs.globalDispatcher` 是导入后即可使用的包级事件总线。
