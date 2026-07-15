# CreateJS Runtime Performance Optimization - Phase 2

## 阶段目标

在 Phase 1 基础上继续优化 CreateJS Runtime。

核心目标：

减少 Canvas 实际绘制次数。

重点优化：

1. Dirty Rectangle 脏矩形渲染
2. 静态 DisplayObject 自动缓存
3. MovieClip 智能缓存
4. Container 渲染树扁平化
5. Bitmap 绘制批处理
6. Tick 更新优化


---

# 总体原则


必须保持：

- CreateJS API 不变
- Animate 导出代码不变
- MovieClip 时间轴不变
- Canvas2D 不变


禁止：

- 修改用户代码
- 修改 Animate 导出结构
- 引入 WebGL


---

# 1. Dirty Rectangle 脏矩形渲染


## 当前问题


默认：

```js
stage.update()
```

每次：

```
清空整个Canvas

重新绘制全部DisplayObject
```


例如：

```
1000个对象

只有1个移动

但是999个也重新绘制
```


造成大量浪费。


---

# 优化目标


只刷新发生变化区域。


例如：

移动前：

```
+-------------+
|             |
|   A         |
|             |
+-------------+
```


移动后：

```
+-------------+
|       A     |
|             |
+-------------+
```


只更新：

旧区域 + 新区域


---

# 实现方案


## DisplayObject 增加 dirty 状态


增加：

```js
_displayDirty
```


状态：


```js
0 未变化

1 transform变化

2 内容变化

3 子节点变化
```


---

## 自动检测变化


监听：

```js
x

y

scaleX

scaleY

rotation

alpha

visible
```


发生变化：

标记 dirty。


例如：

```js
sprite.x = 100;
```

自动：

```js
sprite._displayDirty=true;
```


---

# Dirty Region 管理器


新增：

```
DirtyRegionManager
```


维护：

```js
[
 {
  x,
  y,
  width,
  height
 }
]
```


每帧：


合并区域：

```
A区域

+

B区域


=

Union区域
```


减少clear范围。


---

# Stage.update 改造


原：

```js
clearRect(
0,
0,
canvas.width,
canvas.height
)
```


改：

```js
dirtyRegions.forEach(
 rect=>{
   ctx.clearRect(
     rect.x,
     rect.y,
     rect.width,
     rect.height
   )
 }
)
```


---

# 2. 静态 DisplayObject 自动 Cache


## 当前问题


很多对象：

例如：

- 背景
- UI
- 装饰
- Logo


几百帧不变化。


但是：

每帧重新draw。


---

# 优化方案


自动判断。


条件：


满足：

```
visible=true

alpha没有变化

transform没有变化

连续N帧没有变化
```


例如：

默认：

60帧


自动：

```js
cache()
```


---

# Cache 生命周期


新增：

```js
_autoCache=true
```


状态：


```
ACTIVE

↓

STATIC

↓

CACHE

```


如果再次变化：

自动：

```js
uncache()
```


恢复正常。


---

# 3. MovieClip 智能缓存


## 当前问题


Animate导出：

大量MovieClip：

```
frame1

frame2

frame3
```


如果：

某个MovieClip动画结束。


之后：

仍然重复绘制。


---

# 优化方案


检测：


如果：

```
MovieClip

播放停止

timeline不变化

children不变化
```


自动缓存。


---

例如：


```js
mc.gotoAndStop(20)
```


发现：

静态。


自动：

```js
mc.cache()
```


---

恢复：

```js
mc.gotoAndPlay()
```


自动：

```js
mc.uncache()
```


---

# 4. Container Flatten


## 当前问题


复杂层级：


```
Stage

 Container

   Container

      Container

          Bitmap
```


每帧：

大量递归。


---

# 优化方案


针对静态 Container。


例如：


满足：

```
children全部静态

没有mask

没有blendMode

没有鼠标事件
```


转换：

```
Container

↓

Bitmap Cache
```


---

例如：


原：

```
100个Bitmap
```


优化：


```
1个Cache Bitmap
```


---

# 注意


不能处理：

- MovieClip播放中
- Tween中
- mask
- filter
- mouse interaction


---

# 5. Bitmap Draw Batching


## 当前问题


大量Bitmap：

```js
drawImage()

drawImage()

drawImage()
```


Canvas调用次数高。


---

# 优化方案


连续Bitmap：


排序：

```
Bitmap

Bitmap

Bitmap
```


统一处理。


---

增加：

```js
BitmapBatchRenderer
```


流程：

```
Bitmap List

↓

Group

↓

drawImage batch
```


---

# 6. Tick 更新优化


## 当前问题


很多对象：

即使没有动画：

仍然：

```js
tick()
```


---

# 优化方案


增加：

active状态。


DisplayObject：

```js
_needTick
```


只有：

- Tween
- MovieClip播放
- 动态对象


参与tick。


---

# 7. 性能监控增强


增加：

```js
createjs.performance.debug=true
```


输出：


```
Dirty Rect:

12


Full Render:

false


Cache Object:

320


Draw Calls:

180


Skipped Objects:

800

```


---

# 8. Benchmark


增加测试。


## Case 1


1000静态Bitmap


期望：

优化前：

1000 draw


优化后：

1 cache draw


---

## Case 2


100移动对象


测试：

dirty rectangle


---

## Case 3


复杂MovieClip


测试：

cache命中率。


---

# 9. 回退机制


所有优化支持关闭。


例如：


```js
createjs.performance.phase2=false;
```


关闭后：

恢复原始Stage.update。


---

# 文件规划


新增：


```
src/easeljs/render/

DirtyRegionManager.js

CacheManager.js

BitmapBatchRenderer.js


```


修改：


```
Stage.js

DisplayObject.js

Container.js

MovieClip.js

Bitmap.js

Ticker.js

```


---

# Phase 2 验收标准


## 性能目标


静态场景：

提升 5倍以上


复杂UI：

提升 2-3倍


大量MovieClip：

提升 2倍


---

## 兼容目标


以下保持正常：


- Animate导出动画
- Tween
- MovieClip timeline
- SpriteSheet
- Mask
- Alpha
- Transform


---

# 后续 Phase 3


方向：

- OffscreenCanvas
- Worker渲染
- 更深层Canvas优化
- GPU路径探索
