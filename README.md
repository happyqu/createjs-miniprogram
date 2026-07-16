# @happyqu/createjs-miniprogram

适配微信小程序 Canvas2D 的 CreateJS npm 包，提供完整入口和更易使用的 lite 组合入口。

## 安装

```bash
npm install @happyqu/createjs-miniprogram
```

安装后，在微信开发者工具中执行“工具 → 构建 npm”。

## 选择入口

| 使用场景 | 加载方式 | CommonJS 体积 |
| --- | --- | ---: |
| 需要全部 EaselJS API | 默认入口 | 约 106.1KB |
| 常规 Canvas 项目 | `/lite` | 约 82.5KB |
| lite 项目需要动画 | `/lite` + `/lite/animation` | 动画扩展约 29.2KB |
| lite 项目需要滤镜 | `/lite` + `/lite/filters` | 滤镜扩展约 12.8KB |

### 完整入口

适合旧项目或需要 SpriteSheetBuilder、ButtonHelper 等完整能力的项目：

```js
const createjs = require("@happyqu/createjs-miniprogram");
```

需要 TweenJS 时加载对应的完整入口扩展：

```js
require("@happyqu/createjs-miniprogram/tweenjs");
```

### Lite 入口（推荐）

lite 已经包含日常使用的显示、文字、精灵、触摸和性能优化能力，不需要再分别加载 text 或 sprite：

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
```

包含：

- Stage、Container、DisplayObject
- Graphics、Shape、Bitmap
- Text、BitmapText
- Sprite、SpriteSheet
- Event、Ticker、Touch
- BitmapCache、Filter 基类
- 脏矩形、自动缓存、Bitmap 批处理和性能指标

不包含 MovieClip、Tween、具体滤镜、SpriteSheetBuilder 和 ButtonHelper。

需要动画时只增加一行：

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/animation");

createjs.Tween.get(target).to({ x: 100 }, 500, createjs.Ease.quadOut);
```

`/lite/animation` 一次注册 Tween、Timeline、Ease、Tween 插件和 MovieClip。

需要滤镜时：

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/filters");

displayObject.filters = [new createjs.BlurFilter(4, 4, 1)];
```

`/lite/filters` 一次注册全部 Canvas2D 滤镜。

ESM 写法：

```js
import createjs from "@happyqu/createjs-miniprogram/lite";
import "@happyqu/createjs-miniprogram/lite/animation";
import "@happyqu/createjs-miniprogram/lite/filters";
```

## Canvas 使用

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");

Page({
  onReady() {
    wx.createSelectorQuery()
      .select("#canvas")
      .fields({ node: true, size: true })
      .exec(([result]) => {
        const canvas = result.node;
        const dpr = wx.getWindowInfo ? wx.getWindowInfo().pixelRatio : 1;
        canvas.width = Math.round(result.width * dpr);
        canvas.height = Math.round(result.height * dpr);

        const stage = new createjs.Stage(canvas);
        stage.scaleX = stage.scaleY = dpr;

        const shape = new createjs.Shape();
        shape.graphics.beginFill("#07c160").drawCircle(50, 50, 30);
        stage.addChild(shape);
        stage.update();
      });
  },
});
```

## 触摸事件

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
createjs.Touch.enable(stage, { pixelRatio: dpr, allowDefault: true });

Page({
  canvasEvent(event) {
    createjs.Touch.handleEvent(stage, event);
  },
});
```

## 开发与验证

```bash
npm install
npm test
npm run size
```

`npm test` 会验证完整入口、lite 入口、动画与滤镜共享实例、CommonJS/ESM、小程序全局变量、Canvas2D 滤镜像素输出和体积上限。

详细的构建结构、示例 libs 用法及常见问题见[构建体积与使用指南](doc/bundle-size-and-usage.md)。

## 兼容性

- 运行环境需要微信小程序提供 `wx.createOffscreenCanvas`。
- 仅支持 Canvas2D，不包含 DOM 和 StageGL/WebGL 实现。
- 默认完整入口使用 `/tweenjs`；lite 入口使用 `/lite/animation`，两组入口不要混用。
