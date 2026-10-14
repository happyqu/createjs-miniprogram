import full from '@happyqu/createjs-miniprogram';
import '@happyqu/createjs-miniprogram/tweenjs';
import lite from '@happyqu/createjs-miniprogram/lite';
import '@happyqu/createjs-miniprogram/lite/animation';
import '@happyqu/createjs-miniprogram/lite/filters';

const stage = new lite.Stage(lite.createCanvas(100,100));
stage.cacheBudgetPixels = 1024*1024;
stage.scaleX = stage.scaleY = 2;
const shape = new lite.Shape();
shape.graphics.trackCommandChanges = false;
shape.graphics.beginFill('#f00').drawRoundRect(0,0,10,10,2);
shape.setBounds(0,0,10,10);
shape.invalidate(); shape.updateCache();
stage.addChild(shape);
lite.Ticker.framerate = 60;
lite.Ticker.addEventListener('tick', event => stage.update({delta:event.delta}));
lite.Ticker.requestAnimationFrame = callback => {callback();return 1;};
lite.Ticker.cancelAnimationFrame = id => void id;
const tween = lite.Tween.get(shape).to({x:10},100,lite.Ease.quadOut);
tween.paused = true;
const clip = new lite.MovieClip({paused:true});
clip.timeline.addTween(tween);
const metrics = lite.performance.getMetrics();
const count: number = metrics.drawCalls;
const memory: number | null = metrics.memory;
const percentile: number = metrics.frameTimeP95;
full.Tween.get(shape).to({alpha:0},100);
new full.ButtonHelper(clip);
new full.MovieClip({paused:true});
stage.dispose();
// The package exposes classes through its default namespace at runtime.
// @ts-expect-error No value named export exists in the ESM bundle.
import {Stage} from '@happyqu/createjs-miniprogram/lite';
void [count,memory,percentile,Stage];
