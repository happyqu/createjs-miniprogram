# @happyqu/createjs-miniprogram

[English](README.en.md) | 简体中文

适配微信小程序 Canvas2D 的 CreateJS npm 包，提供完整入口和更易使用的 lite 组合入口。

## 安装

```bash
npm install @happyqu/createjs-miniprogram
```

安装后，在微信开发者工具中执行“工具 → 构建 npm”。

## 选择入口

| 使用场景 | 加载方式 | CommonJS 体积 |
| --- | --- | ---: |
| 需要全部 EaselJS API | 默认入口 | 约 112.6KB |
| 常规 Canvas 项目 | `/lite` | 约 88.9KB |
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

## 渲染更新、缓存与页面生命周期

普通属性变化、矩阵修改、替换 SpriteSheet 和 `updateCache()` 会自动触发重绘。
修改 Bitmap 引用的 Canvas 像素、自定义 Graphics 指令或外部资源后，请显式通知：

```js
bitmap.invalidate();
stage.update();
```

`stage.clear()` 和 Canvas 尺寸变化会使下一帧全量重绘。给 Canvas 的 width/height
赋相同值也会清空画布，但无法通过尺寸比较识别，此时调用 `stage.invalidate()`。

Shape 不会自动计算几何边界。使用 `setBounds()` 时应包含实际绘制范围（包括描边）；
可见对象没有可靠边界时，Stage 会回退到全量渲染，其所属子树也不会自动缓存。

自动缓存默认有单对象和 Stage 总预算，总预算为 8,388,608 像素（RGBA 原始像素约 32 MiB）。
总预算只包含内部自动缓存；手动缓存由调用方管理。可按设备和场景调整：

```js
stage.cacheBudgetPixels = 2048 * 2048;
// 设置为 0 关闭自动缓存；脏区域优化仍可使用。
```

平移和透明度变化会复用缓存；内容变化或采样密度增加时释放缓存。
复杂 Graphics 默认检查 command 属性以兼容直接编辑。如果只通过 Graphics API
修改内容，可设置 `shape.graphics.trackCommandChanges = false` 来减少逐帧扫描；
此后直接编辑 command 时必须调用 `shape.invalidate()`。

RAF 模式需要成对绑定当前 Canvas 的调度与取消方法：

```js
createjs.Ticker.requestAnimationFrame = canvas.requestAnimationFrame.bind(canvas);
createjs.Ticker.cancelAnimationFrame = canvas.cancelAnimationFrame.bind(canvas);
createjs.Ticker.timingMode = createjs.Ticker.RAF;
```

页面隐藏时移除自己的 tick listener、暂停自己的 Tween；显示时恢复。
卸载时移除 listener，再调用 `stage.dispose()` 释放内部缓存、触摸状态和显示列表。
不要调用全局 `Tween.removeAllTweens()` 清理单个页面。示例使用 `SceneSession` 管理页面自己的动画。

SpriteSheet 接受 Canvas 或 CanvasImage 对象。图片尚未加载时会等待加载，并维护
`complete` / `error` 事件；字符串图片地址应先用 Canvas 创建并加载图片对象。

性能指标中，`drawCount` 是绘制对象数，`drawCalls` 是内置渲染器在 update 期间的
Canvas 绘制调用数（包含缓存生成，不包含自定义 command 中未统计的调用）。
`memory` 仅估算自动缓存的原始像素内存，非进程或显存总量；P50/P95 是最近 120 次
update 的帧内耗时分位数，非屏幕呈现延迟。基准页提供优化开关与深层矢量场景。

ESM 使用默认命名空间导入：`import createjs from "@happyqu/createjs-miniprogram/lite"`。
CommonJS 使用 `require()`。两种入口各有匹配的 TypeScript 声明，不提供 ESM 类命名导出。

## 开发与验证

```bash
npm install
npm test
npm run size
```

`npm test` 会验证完整入口、lite 入口、动画与滤镜共享实例、CommonJS/ESM、小程序全局变量、Canvas2D 滤镜像素输出、优化与全量渲染像素一致性、缓存/触摸/RAF 回归、页面动画隔离、TypeScript 声明和体积上限。

详细的构建结构、示例 libs 用法及常见问题见[构建体积与使用指南](doc/bundle-size-and-usage.md)。

## 兼容性

- 运行环境需要微信小程序提供 `wx.createOffscreenCanvas`。
- 仅支持 Canvas2D，不包含 DOM 和 StageGL/WebGL 实现。
- 默认完整入口使用 `/tweenjs`；lite 入口使用 `/lite/animation`，两组入口不要混用。
