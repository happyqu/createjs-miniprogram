# 构建体积与使用指南

## 最终入口结构

项目只公开以下入口：

```text
@happyqu/createjs-miniprogram
@happyqu/createjs-miniprogram/tweenjs
@happyqu/createjs-miniprogram/lite
@happyqu/createjs-miniprogram/lite/animation
@happyqu/createjs-miniprogram/lite/filters
```

不再提供 core、text、sprite、movieclip、builder、ui 等细分入口，避免用户手动处理复杂依赖关系。

## 入口内容

### 默认完整入口

包含全部 Canvas2D EaselJS 能力，包括 MovieClip、滤镜、SpriteSheetBuilder 和 ButtonHelper。TweenJS 仍通过 `/tweenjs` 注册。

```js
const createjs = require("@happyqu/createjs-miniprogram");
require("@happyqu/createjs-miniprogram/tweenjs");
```

### Lite

包含常用显示对象、Graphics、Bitmap、Text、Sprite、SpriteSheet、BitmapText、Ticker、Touch、缓存与性能优化。

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
```

### Lite Animation

包含 Tween、Timeline、Ease、Tween 插件和 MovieClip，并注册到同一个 lite `createjs` 对象。

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/animation");
```

### Lite Filters

包含 BlurFilter、AlphaMapFilter、AlphaMaskFilter、ColorFilter、ColorMatrix 和 ColorMatrixFilter。

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/filters");
```

## 体积

运行 `npm run size` 可以得到当前构建的原始与 gzip 体积。当前 CommonJS 结果：

| 文件 | 原始体积 | 说明 |
| --- | ---: | --- |
| `index.js` | 108,691 B | 完整 EaselJS |
| `lite.js` | 84,480 B（82.5KB） | 常用能力合集 |
| `lite-animation.js` | 29,869 B（29.2KB） | 动画合集 |
| `lite-filters.js` | 13,056 B | 滤镜合集 |
| `tweenjs.js` | 23,812 B | 完整入口 TweenJS |

完整入口已经删除小程序 Canvas2D 不会执行的 WebGL shader、uniform 和纹理上传代码，从 113,457 字节降至 108,691 字节。

## 如何选择

```text
旧项目或需要 Builder/ButtonHelper：默认入口
普通绘制、文字、精灵和触摸：  /lite
Lite 项目需要动画：             再加载 /lite/animation
Lite 项目需要滤镜：             再加载 /lite/filters
```

默认入口和 lite 是两个独立的 `createjs` 实例，不要交叉加载扩展：

```js
// 错误
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/tweenjs");

// 正确
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/animation");
```

## 示例项目 libs

`npm run build` 会生成：

```text
example/libs/createjs-miniprogram/easeljs.js   Lite
example/libs/createjs-miniprogram/animation.js Lite Animation
```

页面使用：

```js
const createjs = require("../../libs/createjs-miniprogram/easeljs.js");
require("../../libs/createjs-miniprogram/animation.js");
```

同步脚本会把 npm 包引用改写为 `require("./easeljs.js")`，并在发现未解析包引用时终止构建。不要直接复制 `dist/lite-animation.js` 覆盖示例文件。

## 常见问题

### module `@happyqu/createjs-miniprogram/lite.js` is not defined

示例 libs 使用了未经相对路径处理的 dist 文件。执行：

```bash
npm run build
```

然后在微信开发者工具中清除缓存并重新编译。

### `createjs.Tween` 或 `createjs.MovieClip` 是 undefined

lite 模式需要先导入 `/lite/animation`；完整模式需要导入 `/tweenjs`。

### `createjs.BlurFilter` 是 undefined

lite 模式需要导入 `/lite/filters`。

## 测试与发布

```bash
npm test
npm pack --dry-run
```

测试覆盖完整入口、lite 入口、CJS/ESM 扩展共享、示例相对路径、Canvas2D 滤镜像素输出、浏览器全局变量和体积上限。
