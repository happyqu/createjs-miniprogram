const assert = require('node:assert/strict');
require('./helpers/mock-canvas.cjs')();
const c = require('../dist/index.js');
require('../dist/tweenjs.js');
function stage() {
  const s = new c.Stage(c.createCanvas(200, 200));
  s.tickOnUpdate = false;
  return s;
}
function assertRedraw(s, mutate) {
  s.update();
  const before = s.canvas.draws.length;
  mutate(); s.update();
  assert.ok(s.canvas.draws.length > before, 'visual changes must redraw');
}

const regions = new c.DirtyRegionManager();
regions.reset(200, 200);
regions.addRect({x:5,y:5,width:12,height:12});
regions.addRect({x:10,y:10,width:20,height:20});
assert.deepEqual(regions.regions, [{x:3,y:3,width:29,height:29}]);
// A merge can expand into a previously visited region.
regions.reset(200,200);
regions.addRect({x:2,y:2,width:1,height:1});
regions.addRect({x:20,y:2,width:1,height:1});
regions.addRect({x:10,y:2,width:9,height:1});
assert.ok(regions.regions.some(r => r.x+r.width >= 23));

const image = {width:10,height:10};
const clearStage = stage(); clearStage.addChild(new c.Bitmap(image));
assertRedraw(clearStage, () => clearStage.clear());
assertRedraw(clearStage, () => { clearStage.canvas.width = 300; });
assertRedraw(clearStage, () => clearStage.invalidate());

const matrixStage = stage(), matrixBitmap = new c.Bitmap(image);
matrixBitmap.transformMatrix = new c.Matrix2D(); matrixStage.addChild(matrixBitmap);
assertRedraw(matrixStage, () => matrixBitmap.transformMatrix.setValues(-1,0,0,1,10,0));
const sheet = (img) => new c.SpriteSheet({images:[img],frames:[[0,0,10,10]]});
const spriteStage = stage(), sprite = new c.Sprite(sheet(image));
sprite.gotoAndStop(0); spriteStage.addChild(sprite);
assertRedraw(spriteStage, () => { sprite.spriteSheet = sheet({...image}); });
const manual = stage(), bitmap = new c.Bitmap(image);
bitmap.cache(0,0,10,10,2);
assert.equal(bitmap.getBounds().width, 10);
manual.addChild(bitmap);
assertRedraw(manual, () => bitmap.updateCache());
const external = stage(), source = c.createCanvas(10,10), dynamic = new c.Bitmap(source);
external.addChild(dynamic);
assertRedraw(external, () => { source.getContext('2d').drawImage(image,0,0); dynamic.invalidate(); });

const cached = stage(), group = new c.Container();
group.addChild(new c.Bitmap(image)); cached.addChild(group);
cached._cacheManager.staticFrames = 2;
for (let i=0;i<3;i++) cached.update();
const cache = group.bitmapCache;
assert.ok(group._autoCache);
assertRedraw(cached, () => {group.x=30; group.alpha=0.5;});
assert.strictEqual(group.bitmapCache,cache);
assertRedraw(cached, () => {group.children[0].x=20;});
assert.equal(group._autoCache,false);
for (let i=0;i<3;i++) cached.update();
const oldScale = group.bitmapCache.scale;
assertRedraw(cached, () => {cached.scaleX=cached.scaleY=oldScale*2;});
assert.ok(!group._autoCache || group.bitmapCache.scale >= oldScale*2);

const unsafe = stage(), unsafeGroup = new c.Container(), unknown = new c.Shape();
unknown.graphics.append({exec(ctx) {ctx.drawImage(image,80,0);}});
unsafeGroup.addChild(new c.Bitmap(image),unknown); unsafe.addChild(unsafeGroup);
unsafe._cacheManager.staticFrames=1;
for (let i=0;i<4;i++) unsafe.update();
assert.equal(unsafeGroup._autoCache,false);
const shadowed = new c.Container(), shadowChild = new c.Bitmap(image);
shadowChild.shadow = new c.Shadow('#000',20,20,10);
shadowed.addChild(shadowChild); shadowed._staticFrames=60;
assert.equal(new c.CacheManager()._eligible(shadowed),false);

const budget = stage(); budget.cacheBudgetPixels=800;
budget._cacheManager.staticFrames=1;
for (let i=0;i<3;i++) {const t=new c.Text('X');t.setBounds(0,0,10,10);budget.addChild(t);}
for (let i=0;i<4;i++) budget.update();
assert.ok(budget._cacheManager.totalCachePixels <= 800);
assert.equal(budget.children.filter(o => o._autoCache).length,2);
budget.cacheBudgetPixels=0;
assert.equal(budget._cacheManager.totalCachePixels,0);
assert.ok(budget.children.every(o => !o._autoCache));
assert.throws(() => {budget.cacheBudgetPixels=-1;},RangeError);

const touch = stage(), button = new c.Bitmap(image);
touch.addChild(button); touch._getObjectsUnderPoint = x => x<10 ? button : null;
let clicks=0, ups=0; button.on('click',()=>clicks++); button.on('pressup',()=>ups++);
c.Touch.enable(touch);
const event = (type,x=2) => ({type,changedTouches:[{identifier:1,x,y:2}]});
c.Touch.handleEvent(touch,event('touchstart')); c.Touch.handleEvent(touch,event('touchcancel'));
assert.equal(clicks,0); assert.equal(ups,1);
c.Touch.handleEvent(touch,event('touchstart')); c.Touch.handleEvent(touch,event('touchend',50));
assert.equal(clicks,0);
c.Touch.handleEvent(touch,event('touchstart')); c.Touch.handleEvent(touch,event('touchend'));
assert.equal(clicks,1);
c.Touch.handleEvent(touch,event('touchstart')); c.Touch.disable(touch);
assert.deepEqual(touch._pointerData,{}); assert.equal(touch._primaryPointerID,null);
assert.equal(clicks,1);

let applicationLoads=0;
const pending={width:0,height:0,onload() {applicationLoads++;}};
const originalLoad=pending.onload;
const asyncA=new c.SpriteSheet({images:[pending],frames:{width:10,height:10}});
const asyncB=new c.SpriteSheet({images:[pending],frames:[[0,0,10,10]]});
assert.equal(asyncA.complete,false); assert.equal(asyncB.complete,false);
pending.width=20; pending.height=10; pending.onload();
assert.equal(applicationLoads,1); assert.strictEqual(pending.onload,originalLoad);
assert.equal(asyncA.complete,true); assert.equal(asyncA.getNumFrames(),2);
assert.equal(asyncA._frameCache.length,2); assert.equal(asyncB.complete,true);
const failing={width:0,height:0};
const failed=new c.SpriteSheet({images:[failing],frames:{width:10,height:10}});
let errors=0; failed.on('error',()=>errors++); failing.onerror();
assert.equal(errors,1); assert.equal(failed.complete,false);
assert.throws(() => new c.SpriteSheet({images:[image],frames:{width:0,height:10}}));
assert.throws(() => new c.SpriteSheet({images:['url.png'],frames:[[0,0,10,10]]}));

const ticker=c.Ticker, queue=[]; let cancellations=0;
ticker.requestAnimationFrame = fn => {queue.push(fn);return queue.length;};
ticker.cancelAnimationFrame = () => cancellations++;
ticker.timingMode=ticker.RAF; ticker.addEventListener('tick',()=>{});
const stale=queue[0]; ticker.reset(); assert.equal(cancellations,1);
assert.doesNotThrow(stale); assert.equal(queue.length,1);
ticker.addEventListener('tick',()=>ticker.reset());
stale(); assert.equal(queue.length,2);
assert.doesNotThrow(queue[1]);
ticker.requestAnimationFrame=ticker.cancelAnimationFrame=null;
ticker.timingMode=ticker.TIMEOUT; ticker.reset();

cached.dispose(); assert.equal(cached.canvas,null);
assert.equal(cached._cacheManager.totalCachePixels,0);
assert.equal(cached._stageRenderList.length,0);
assert.doesNotThrow(()=>cached.dispose());

// Culling reaches nested containers, rather than redrawing every sibling.
const nested=stage(), nestedGroup=new c.Container();
const near=new c.Bitmap(image), far=new c.Bitmap(image).set({x:150,y:150});
nestedGroup.addChild(near,far); nested.addChild(nestedGroup); nested.update();
const beforeNested=nested.canvas.draws.length;
near.x=5; nested.update();
assert.equal(nested.canvas.draws.length-beforeNested,1);

// Reparenting must not let the old Stage release the new Stage's cache.
const oldStage=stage(), newStage=stage(), reparented=new c.Container();
reparented.addChild(new c.Bitmap(image)); oldStage.addChild(reparented);
oldStage._cacheManager.staticFrames=newStage._cacheManager.staticFrames=1;
oldStage.update(); oldStage.update();
assert.ok(reparented._autoCache);
newStage.addChild(reparented); newStage.update(); newStage.update();
const newCache=reparented.bitmapCache;
oldStage.update();
assert.strictEqual(reparented.bitmapCache,newCache);
oldStage.dispose(); newStage.dispose();

c.performance.enable=true;
const metricsStage=stage(), text=new c.Text('one\ntwo'); metricsStage.addChild(text);
metricsStage.update();
assert.equal(c.performance.drawCount,1);
assert.equal(c.performance.drawCalls,2);
metricsStage.update(); assert.equal(c.performance.drawCalls,0);
assert.ok(c.performance.getMetrics().frameTimeP95 >= 0);
c.performance.enable=false;
console.log('Render, touch, cache, resource and RAF regressions passed');
