# CreateJS Runtime Performance Optimization - Phase 1

## 项目目标

基于现有 `createjs-miniprogram` 项目，对 CreateJS Runtime 进行性能优化。

目标：

- 保持 CreateJS API 完全兼容
- 保持 Adobe Animate 导出的 JS 文件无需修改
- 保持 Canvas2D 渲染模式
- 保持 MovieClip / Timeline 功能
- 提升微信小程序 Canvas2D 下大量动画场景性能


---

# 优化原则

## 必须保持

- createjs.Stage API 不变
- createjs.Container API 不变
- createjs.MovieClip API 不变
- createjs.Bitmap API 不变
- Animate 导出代码无需修改


## 禁止

- 不引入 WebGL
- 不修改导出格式
- 不要求业务层适配
- 不删除旧功能


---

# Phase 1 优化范围


# 1. Stage 渲染循环优化


## 当前问题

CreateJS 默认渲染流程：

```
Stage.update()

    Container

        Container

            MovieClip

                DisplayObject

                    draw()
```


每一帧都会：

- 递归遍历 DisplayList
- 大量属性读取
- 大量函数调用
- 大量类型判断


复杂动画场景 CPU 消耗较高。


---

## 优化方案


增加内部 RenderList 缓存。


原结构：

```
Stage
 |
 Container
 |
 MovieClip
 |
 Bitmap
```


转换为：

```
Stage

RenderList:

[
 Bitmap,
 Bitmap,
 Shape,
 Sprite,
 MovieClipNode
]
```


渲染阶段：

直接遍历 RenderList。


示例：

```js
for(let i = 0; i < renderList.length; i++){
    renderList[i].draw(ctx);
}
```


---

## 更新机制


以下操作需要刷新 RenderList：

- addChild
- removeChild
- removeAllChildren
- MovieClip timeline变化


要求：

RenderList 只是内部优化缓存。

不能影响原 DisplayList 逻辑。


---

# 2. DisplayObject Transform 优化


## 当前问题


每帧大量读取：

```js
x
y
scaleX
scaleY
rotation
alpha
```


同时频繁计算 Matrix。


---

## 优化方案


增加内部缓存：

```js
_displayProps = {

    x:0,

    y:0,

    scaleX:1,

    scaleY:1,

    rotation:0,

    alpha:1,

    matrix:null

}
```


渲染前统一同步。


减少：

- 重复计算
- 重复属性访问


---

# 3. Matrix2D 对象池优化


## 当前问题


动画过程中大量：

```js
new Matrix2D()
```


导致：

- 内存分配增加
- GC频繁


---

## 优化方案


新增：

```
Matrix2DPool
```


接口：

```js
Matrix2DPool.get()

Matrix2DPool.release(matrix)
```


要求：

- 不改变 Matrix2D API
- 外部调用保持兼容


---

# 4. MovieClip Timeline 优化


## 当前问题


Animate 导出的 MovieClip：

每帧执行：

```
advance()

gotoAndStop()

setPosition()
```


导致：

- frame 查找
- timeline解析
- child状态更新


---

## 优化方案


MovieClip 初始化时缓存 Timeline。


生成：

```js
_cachedFrames = [

    {
        children:[
            child1,
            child2
        ],

        transforms:[

        ]

    }

]
```


播放时：

直接应用缓存。


避免重复解析。


---

# 5. SpriteSheet 优化


## 当前问题


Sprite 每帧：

- 查询 frame
- 获取图片区域
- 计算rect


---

## 优化方案


初始化 SpriteSheet：

生成 Frame Cache。


例如：

```js
_frameCache=[

 {
    image:image,
    x:0,
    y:0,
    width:100,
    height:100
 }

]
```


播放：

直接读取。


---

# 6. Bitmap 快速绘制路径


## 当前问题


普通 Bitmap：

每次：

```js
ctx.save()

transform()

drawImage()

ctx.restore()
```


消耗较高。


---

## 优化方案


增加 Fast Path。


满足：

```js
rotation === 0

scaleX === 1

scaleY === 1

alpha === 1
```


直接：

```js
ctx.drawImage(
    image,
    x,
    y
)
```


跳过：

- save
- restore
- matrix计算


---

# 7. 高频对象创建优化


重点检查：

- DisplayObject.draw()
- Stage.update()
- MovieClip.advance()
- Sprite.update()


禁止高频：

```js
new Object()

new Array()

new Matrix2D()

new Point()
```


改为：

对象复用。


---

# 8. 性能监控


增加调试开关：

```js
createjs.performance.enable = true;
```


输出：

```
FPS:

renderTime:

updateTime:

drawCount:

displayObjectCount:

memory:
```


---

# 9. Benchmark 测试


增加性能测试页面。


## 测试1

1000 Bitmap


记录：

- FPS
- CPU
- 内存


---

## 测试2

100 MovieClip


每个：

10 frame


记录：

- FPS
- Tick耗时


---

## 测试3

复杂 Animate 项目


记录：

- 首屏时间
- 动画流畅度


---

# 验收标准


## 性能

Bitmap：

提升 ≥ 2倍


MovieClip：

提升 ≥ 2倍


GC：

减少 ≥ 50%


---

## 兼容性


以下代码无需修改：

```js
var stage = new createjs.Stage(canvas);

var mc = new lib.MovieClip();

stage.addChild(mc);

createjs.Ticker.on("tick", function(){

    stage.update();

});
```


---

# 文件修改建议


优先修改：

```
src/easeljs/display/Stage.js

src/easeljs/display/DisplayObject.js

src/easeljs/display/Container.js

src/easeljs/display/MovieClip.js

src/easeljs/display/Sprite.js

src/easeljs/geom/Matrix2D.js
```


---

# 后续阶段


## Phase 2

- 脏矩形渲染
- 静态节点自动缓存
- Container Flatten
- DrawCall优化


## Phase 3

- OffscreenCanvas
- Worker渲染
- 更深层Canvas优化

