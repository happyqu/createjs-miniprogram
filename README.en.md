# @happyqu/createjs-miniprogram

English | [简体中文](README.md)

CreateJS adapted for the WeChat Mini Program Canvas 2D API.

This package provides EaselJS and TweenJS-compatible APIs without relying on the
DOM. It includes a full EaselJS entry point as well as smaller Lite entry points
for common Mini Program use cases.

## Features

- EaselJS display list and Canvas 2D rendering
- Shapes, bitmaps, text, sprites, sprite sheets, and bitmap text
- Ticker, events, and Mini Program touch handling
- TweenJS, timelines, easing functions, and MovieClip support
- Canvas 2D filters
- Dirty-region rendering, automatic caching, bitmap batching, and performance
  metrics
- CommonJS and ES module builds
- TypeScript declarations

## Installation

```bash
npm install @happyqu/createjs-miniprogram
```

After installing the package, select **Tools → Build npm** in WeChat DevTools.

## Choosing an Entry Point

| Use case | Entry points | Approximate CommonJS size |
| --- | --- | ---: |
| Complete EaselJS API | package root | 106.1 KB |
| Typical Canvas application | `/lite` | 82.5 KB |
| Lite with animation | `/lite` + `/lite/animation` | animation adds 29.2 KB |
| Lite with filters | `/lite` + `/lite/filters` | filters add 12.8 KB |

### Full Build

Use the default entry point for existing CreateJS applications or when you need
APIs such as `SpriteSheetBuilder` and `ButtonHelper`:

```js
const createjs = require("@happyqu/createjs-miniprogram");
```

Load TweenJS separately when animation support is required:

```js
const createjs = require("@happyqu/createjs-miniprogram");
require("@happyqu/createjs-miniprogram/tweenjs");

createjs.Tween.get(target).to({ x: 100 }, 500, createjs.Ease.quadOut);
```

The full build already includes the Canvas 2D filter classes.

### Lite Build

The Lite build is recommended for most Mini Program applications:

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
```

It includes:

- `Stage`, `Container`, and `DisplayObject`
- `Graphics`, `Shape`, and `Bitmap`
- `Text` and `BitmapText`
- `Sprite` and `SpriteSheet`
- `Event`, `Ticker`, and `Touch`
- `BitmapCache` and the base `Filter` class
- Dirty-region rendering, automatic caching, bitmap batching, and performance
  metrics

It does not include MovieClip, TweenJS, concrete filter implementations,
`SpriteSheetBuilder`, or `ButtonHelper`.

Add animation support with the Lite animation extension:

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/animation");

createjs.Tween.get(target).to({ x: 100 }, 500, createjs.Ease.quadOut);
```

The animation extension registers `Tween`, `Timeline`, `Ease`, the Tween
plugins, and `MovieClip` on the same `createjs` object.

Add filters with the Lite filters extension:

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/filters");
```

The filters extension registers:

- `BlurFilter`
- `AlphaMapFilter`
- `AlphaMaskFilter`
- `ColorFilter`
- `ColorMatrix`
- `ColorMatrixFilter`

### ES Modules

```js
import createjs from "@happyqu/createjs-miniprogram/lite";
import "@happyqu/createjs-miniprogram/lite/animation";
import "@happyqu/createjs-miniprogram/lite/filters";
```

Do not mix the full-build extensions with the Lite build. These pairs use
different `createjs` instances:

```js
// Full build
const createjs = require("@happyqu/createjs-miniprogram");
require("@happyqu/createjs-miniprogram/tweenjs");

// Lite build
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/animation");
```

## Canvas Setup

Use a Canvas 2D node and scale both the backing canvas and the stage for the
device pixel ratio:

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");

Page({
  onReady() {
    wx.createSelectorQuery()
      .select("#canvas")
      .fields({ node: true, size: true })
      .exec(([result]) => {
        if (!result || !result.node) {
          return;
        }

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

The corresponding WXML canvas must use `type="2d"`:

```xml
<canvas id="canvas" type="2d"></canvas>
```

## Animation

Register a Ticker listener when the stage needs continuous updates:

```js
createjs.Ticker.framerate = 60;
createjs.Ticker.addEventListener("tick", () => {
  stage.update();
});
```

```js
createjs.Tween.get(shape, { loop: -1 })
  .to({ x: 250 }, 1000, createjs.Ease.sineInOut)
  .to({ x: 50 }, 1000, createjs.Ease.sineInOut);
```

## Filters

EaselJS filters operate on a cached display object. Assigning `filters` alone is
not enough; call `cache()` after assigning the filter:

```js
const createjs = require("@happyqu/createjs-miniprogram/lite");
require("@happyqu/createjs-miniprogram/lite/filters");

const shape = new createjs.Shape();
shape.graphics.beginFill("#4d7cff").drawCircle(0, 0, 50);
shape.x = 100;
shape.y = 100;

shape.filters = [new createjs.BlurFilter(8, 8, 2)];
shape.cache(-50, -50, 100, 100);

stage.addChild(shape);
stage.update();
```

Call `updateCache()` after changing filter parameters:

```js
shape.filters[0].blurX = 16;
shape.filters[0].blurY = 16;
shape.updateCache();
```

Remove the filters and cached surface when they are no longer needed:

```js
shape.filters = null;
shape.uncache();
```

## Touch Events

Declare the touch events in WXML:

```xml
<canvas
  id="canvas"
  type="2d"
  bindtouchstart="canvasEvent"
  bindtouchmove="canvasEvent"
  bindtouchend="canvasEvent"
  bindtouchcancel="canvasEvent"
></canvas>
```

Enable touch handling after creating the stage:

```js
createjs.Touch.enable(stage, {
  pixelRatio: dpr,
  allowDefault: true,
});
```

Forward Mini Program touch events to CreateJS:

```js
Page({
  canvasEvent(event) {
    createjs.Touch.handleEvent(stage, event);
  },
});
```

Display objects can then use normal EaselJS pointer events:

```js
shape.on("click", () => {
  console.log("Shape clicked");
});
```

## Example Project

The repository includes a WeChat Mini Program example in the `example`
directory. Running the build command generates its local libraries:

```text
example/libs/createjs-miniprogram/easeljs.js
example/libs/createjs-miniprogram/animation.js
```

The example's `easeljs.js` is the generated `dist/lite.js` build under a
Mini Program-friendly filename.

## Development

Requirements:

- Node.js 18 or later
- WeChat DevTools with Canvas 2D support

Install dependencies and build all package entry points:

```bash
npm install
npm run build
```

Run the test suite:

```bash
npm test
```

Inspect bundle sizes:

```bash
npm run size
```

The test suite covers the full and Lite entry points, shared extension
instances, CommonJS and ES module builds, Mini Program globals, Canvas 2D filter
pixel output, and bundle-size limits.

For more information about the build structure, generated example libraries,
and troubleshooting, see the
[bundle size and usage guide](doc/bundle-size-and-usage.md).

## Compatibility and Limitations

- The runtime requires `wx.createOffscreenCanvas`.
- Only Canvas 2D rendering is supported.
- DOM-dependent browser APIs are not included.
- `StageGL` and WebGL rendering are not supported.
- The package is intended for WeChat Mini Programs and is not a drop-in browser
  build of CreateJS.

## License

[MIT](LICENSE)
