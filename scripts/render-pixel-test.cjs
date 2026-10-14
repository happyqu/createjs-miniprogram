const assert = require('node:assert/strict');
const {createCanvas} = require('@napi-rs/canvas');
global.wx = {createOffscreenCanvas: ({width,height}) => createCanvas(width,height)};
const c = require('../dist/index.js');

function scene() {
  const canvas=createCanvas(160,120), stage=new c.Stage(canvas);
  stage.tickOnUpdate=false; stage._cacheManager.staticFrames=2;
  const image=createCanvas(12,12), ctx=image.getContext('2d');
  ctx.fillStyle='#fc0'; ctx.fillRect(0,0,6,12);
  ctx.fillStyle='#36f'; ctx.fillRect(6,0,6,12);
  const background=new c.Shape(); background.graphics.beginFill('#f4f4f4').drawRect(0,0,160,120);
  background.setBounds(0,0,160,120); background.on('click',()=>{}); // Keep a live backdrop.
  stage.addChild(background);
  const group=new c.Container(); group.x=10; group.y=10;
  group.addChild(new c.Bitmap(image)); stage.addChild(group);
  const moving=new c.Bitmap(image); moving.x=35; moving.y=25; stage.addChild(moving);
  const matrix=new c.Bitmap(image); matrix.transformMatrix=new c.Matrix2D(1,0,0,1,80,10); stage.addChild(matrix);
  const sprite=new c.Sprite(new c.SpriteSheet({images:[image],frames:[[0,0,12,12]]}));
  sprite.gotoAndStop(0); sprite.x=110; sprite.y=10; stage.addChild(sprite);
  const manual=new c.Bitmap(image); manual.x=15; manual.y=70; manual.cache(0,0,12,12,2); stage.addChild(manual);
  const live=new c.Bitmap(image); live.x=50; live.y=70; stage.addChild(live);
  const unknownGroup=new c.Container(); unknownGroup.x=100; unknownGroup.y=70;
  unknownGroup.addChild(new c.Bitmap(image));
  const unknown=new c.Shape(); unknown.graphics.beginFill('#e24').drawRect(25,0,12,12);
  unknownGroup.addChild(unknown); stage.addChild(unknownGroup);
  return {stage,canvas,image,group,moving,matrix,sprite,manual,live,unknownGroup};
}

function compare(a,b,label) {
  c.performance.phase2=true; a.stage.update();
  c.performance.phase2=false; b.stage.update();
  assert.deepEqual(a.canvas.getContext('2d').getImageData(0,0,160,120).data,
    b.canvas.getContext('2d').getImageData(0,0,160,120).data, label);
}

// Unknown bounds must not make the rest of the subtree's cache unsafe.
const a=scene(), b=scene();
for (let i=0;i<4;i++) compare(a,b,`warmup ${i}`);
assert.ok(a.group._autoCache);
for (const s of [a,b]) {s.group.x=20; s.unknownGroup.x=110;}
compare(a,b,'cached translation and an unbounded child');
assert.ok(a.group._autoCache);
// Remove unknown-bounds nodes to exercise actual dirty-rectangle clipping.
for (const s of [a,b]) s.stage.removeChild(s.unknownGroup);
compare(a,b,'remove subtree');
for (const s of [a,b]) {s.moving.x=40; s.moving.y=30;}
compare(a,b,'overlapping dirty regions');
assert.equal(a.stage._dirtyRegionManager.fullRender,false);
for (const s of [a,b]) s.matrix.transformMatrix.setValues(-1,0,0,1,92,10);
compare(a,b,'matrix reflection with unchanged bounds');
for (const s of [a,b]) {
  const next=createCanvas(12,12); const ctx=next.getContext('2d');ctx.fillStyle='#a2f';ctx.fillRect(0,0,12,12);
  s.sprite.spriteSheet=new c.SpriteSheet({images:[next],frames:[[0,0,12,12]]});
}
compare(a,b,'same-sized spritesheet replacement');
for (const s of [a,b]) {
  const ctx=s.image.getContext('2d');ctx.fillStyle='#0d7';ctx.fillRect(0,0,12,12);
  s.manual.updateCache(); s.live.invalidate(); s.moving.invalidate();
  s.matrix.invalidate(); s.sprite.invalidate(); s.group.children[0].invalidate();
}
compare(a,b,'manual cache and external canvas update');
for (const s of [a,b]) s.stage.clear();
compare(a,b,'clear then redraw');
for (const s of [a,b]) {s.canvas.width=160; s.stage.invalidate();}
compare(a,b,'same-size canvas reset with explicit invalidation');
for (const s of [a,b]) s.canvas.width=180;
compare(a,b,'canvas resize');
for (const s of [a,b]) {s.stage.scaleX=s.stage.scaleY=2;}
compare(a,b,'DPR change');
for (let i=0;i<4;i++) compare(a,b,`DPR cache warmup ${i}`);
a.stage.dispose(); b.stage.dispose();
c.performance.phase2=true;
console.log('Canvas2D optimized/full-render pixel comparisons passed');
