# CreateJS Runtime Performance Optimization - Phase 3

## 阶段目标

在 Phase 1 / Phase 2 基础上继续优化。

Phase 1:

- 优化 Runtime CPU
- 减少对象创建

Phase 2:

- 减少无效绘制
- 缓存静态内容

Phase 3:

- 优化 Canvas 渲染架构
- 降低 Canvas API 调用成本
- 提升大型动画稳定性


目标：

让 CreateJS Runtime 接近专业动画引擎性能。


---

# 核心原则


保持：

- CreateJS API兼容
- Animate导出兼容
- Canvas2D模式


新增：

- Render Pipeline
- Offscreen缓存
- Command Buffer
- Resource Manager


---

# 1. OffscreenCanvas 离屏渲染优化


## 当前问题


Canvas2D：

主Canvas：

```
计算

↓

绘制

↓

显示
```


所有工作占用主线程。


---

## 优化目标


静态或者复杂区域：

提前绘制到离屏Canvas。


结构：


```
DisplayObject

        |

        v

OffscreenCanvas

        |

        v

Bitmap


```


---

# 使用场景


## 背景


例如：

```
天空

建筑

装饰

```

永远不变。


直接：

```
backgroundCacheCanvas

↓

drawImage

```


---

## 大型MovieClip


例如：

动画：

100层


生成：

```
MovieClipRenderSurface

```


减少实时绘制。


---

# 2. Render Command Buffer


## 当前问题


现在：

DisplayObject：

直接调用：

```js
ctx.save()

ctx.translate()

ctx.rotate()

ctx.drawImage()

ctx.restore()
```


Canvas API调用频繁。


---

# 优化方案


增加中间层：


```
DisplayObject

↓

RenderCommand

↓

Canvas执行


```


例如：


生成：


```js
[
 {
  type:"translate",
  x:100,
  y:200
 },

 {
  type:"drawImage",
  image,
  rect
 }
]

```


---

## 优势


可以：

- 合并命令
- 跳过无效操作
- 调整执行顺序


---

# 3. Transform Matrix 预计算


## 当前问题


复杂动画：

每帧：

```
父Matrix

×

子Matrix

×

孙子Matrix

```


递归计算。


---

# 优化方案


增加：

WorldMatrix缓存。


结构：


```
LocalMatrix

+

ParentMatrix


=

WorldMatrix

```


---

只有：

父节点变化：

才重新计算。


---

增加：

```js
_matrixDirty
```


状态：

```
false

无需计算


true

重新计算

```


---

# 4. DisplayList 编译


## 当前问题


CreateJS：

运行时解释DisplayList。


类似：

```
解析动画

↓

执行

```


---

# 优化方案


增加：

Compile阶段。


初始化：

```
MovieClip

↓

RenderTree

↓

CompiledRenderList

```


---

例如：


原：

```
frame10:

child1

child2

child3

```


编译：


```
frame10:

[
 drawBitmap1,

 drawBitmap2,

 drawBitmap3

]

```


播放：

直接执行。


---

# 5. Bitmap Atlas 优化


## 当前问题


大量小图片：

```
a.png

b.png

c.png
```


导致：

- 图片切换
- draw调用增加


---

# 优化方案


自动Atlas。


合并：


```
image1

image2

image3


↓

atlas.png

```


运行时：


```js
drawImage(
 atlas,
 sx,
 sy,
 sw,
 sh,
 x,
 y
)

```


---

# 6. Texture Resource Manager


## 当前问题


图片资源：

重复加载。


例如：


```
MovieClip A

引用 hero.png


MovieClip B

引用 hero.png

```


---

# 新增：


```
TextureManager
```


负责：

- 加载
- 缓存
- 引用计数
- 释放


---

接口：


```js
TextureManager.load(url)

TextureManager.release(url)

```


---

# 7. 自动质量等级


## 问题


低端设备：

大型动画容易掉帧。


---

# 优化


增加：

Quality Manager。


例如：


```js
createjs.quality="high"
```


或者：

```js
createjs.quality="auto"
```


---

自动调整：

## High

全部效果。


## Medium

关闭：

- shadow
- filter


## Low

关闭：

- alpha动画
- 部分cache


---

# 8. Worker 渲染探索


## 目标


尝试：

```
Worker

 |

Canvas计算

 |

Main Canvas显示

```


---

注意：

微信小程序限制较多。


第一阶段：

只抽离：

- timeline计算
- matrix计算


不要直接搬Canvas。


---

# 9. GPU路径预留


虽然 Phase 3 不切 WebGL。


但是设计：

未来支持：


```
Renderer

 |
 + CanvasRenderer

 |
 + WebGLRenderer

```


保持 CreateJS API。


---

# 10. Debug工具


新增：


```js
createjs.performance.inspect=true
```


显示：


```
Render Tree:

1200 nodes


Compiled Nodes:

350


Cache:

200


Draw Calls:

180


Dirty:

12


FPS:

60

```


---

# 文件规划


新增：


```
src/easeljs/render/

Renderer.js

CanvasRenderer.js

RenderCommand.js

CommandBuffer.js

OffscreenCache.js

TextureManager.js

QualityManager.js

```


修改：


```
Stage.js

Container.js

DisplayObject.js

MovieClip.js

Bitmap.js

Ticker.js

```


---

# Phase 3 验收目标


## 性能


复杂动画：

提升 2-5倍


Canvas调用：

减少50%以上


内存：

稳定


---

## 兼容


必须支持：

- Animate导出
- MovieClip
- SpriteSheet
- Tween
- Mask
- Alpha


---

# 最终架构目标


CreateJS Runtime:

```
Animate Export JS

        |

        v

MovieClip Runtime

        |

        v

Compiled Render Tree

        |

        v

Render Pipeline

        |

        +----------------+

        |                |

 Canvas2D        WebGL(未来)

```

---

# 当前实现

- `CanvasRenderer + CommandBuffer`：复杂 Bitmap/MovieClip 显示列表编译后执行，减少 `save/transform/restore`；简单平移 Bitmap 保留 Phase 2 快路径。
- `WorldMatrix`：根据本地属性及父矩阵版本缓存，父级未变化时不重复拼接完整祖先链。
- `OffscreenCache`：自动缓存释放后按精确像素尺寸复用，限制画布数量和总像素，避免无限占用内存。
- `TextureManager`：提供异步加载去重、引用计数和释放接口。
- `QualityManager`：提供 `high/medium/low/auto` 状态及带迟滞的自动降级判断。
- `WorkerRenderer`：按小程序限制仅异步批量计算矩阵，不直接操作主 Canvas；无 Worker 时同步回退。
- `createjs.performance.phase3=false` 可独立关闭 Phase 3；不支持编译的 Mask、Filter、混合模式、缓存或自定义 draw 自动回退。

