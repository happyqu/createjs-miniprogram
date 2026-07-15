const stats = { draw: 0, save: 0, restore: 0, transform: 0, setTransform: 0 };

function resetStats() {
  for (const key of Object.keys(stats)) stats[key] = 0;
}

function createCanvas(width = 1000, height = 1000) {
  const canvas = { width, height };
  const stack = [];
  const context = {
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    drawImage() { stats.draw++; },
    save() { stats.save++; stack.push([this.globalAlpha, this.globalCompositeOperation]); },
    restore() { stats.restore++; const state = stack.pop(); if (state) [this.globalAlpha, this.globalCompositeOperation] = state; },
    transform() { stats.transform++; },
    setTransform() { stats.setTransform++; },
    clearRect() {}, beginPath() {}, rect() {}, clip() {}, translate() {},
    createPattern() { return {}; }, measureText(text) { return { width: String(text).length * 8 }; },
    fillText() {}, strokeText() {}, fillRect() {}, stroke() {}, fill() {},
  };
  canvas.getContext = () => context;
  return canvas;
}

global.wx = { createOffscreenCanvas: ({ width, height }) => createCanvas(width, height) };
const createjs = require("../dist/index.js");
require("../dist/tweenjs.js");
const image = createCanvas(8, 8);

const scenarios = [
  ["1000 static Bitmap", () => {
    const group = new createjs.Container();
    for (let i = 0; i < 1000; i++) group.addChild(new createjs.Bitmap(image).set({ x: (i % 50) * 20, y: ((i / 50) | 0) * 50 }));
    return group;
  }],
  ["100 moving Bitmap", () => {
    const group = new createjs.Container();
    for (let i = 0; i < 100; i++) {
      const bitmap = new createjs.Bitmap(image).set({ x: (i % 10) * 100, y: ((i / 10) | 0) * 100 });
      group.addChild(bitmap);
      const startX = bitmap.x;
      createjs.Tween.get(bitmap, { loop: -1 }).to({ x: startX + 18 }, 500 + i * 2).to({ x: startX }, 500 + i * 2);
    }
    return group;
  }],
  ["100 MovieClip x 10 frames", () => {
    const group = new createjs.Container();
    for (let i = 0; i < 100; i++) {
      const clip = new createjs.MovieClip({ loop: -1 });
      clip.timeline.addTween(createjs.Tween.get(new createjs.Bitmap(image)).to({ x: 18 }, 5).to({ x: 0 }, 5));
      clip.x = (i % 10) * 100; clip.y = ((i / 10) | 0) * 100; group.addChild(clip);
    }
    return group;
  }],
];

function run(build, phase3, frames = 120) {
  createjs.Tween.removeAllTweens();
  const stage = new createjs.Stage(createCanvas());
  stage.tickOnUpdate = true;
  stage.addChild(build());
  createjs.performance.phase2 = true;
  createjs.performance.phase3 = phase3;
  for (let i = 0; i < 10; i++) { createjs.Tween.tick(16.6667, false); stage.update({ delta: 16.6667 }); }
  resetStats();
  const start = process.hrtime.bigint();
  for (let i = 0; i < frames; i++) { createjs.Tween.tick(16.6667, false); stage.update({ delta: 16.6667 }); }
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  return { ms, calls: stats.draw + stats.save + stats.restore + stats.transform + stats.setTransform, ...stats };
}

const rows = scenarios.map(([name, build]) => {
  const before = run(build, false);
  const after = run(build, true);
  return {
    scenario: name,
    "Phase 2 ms": before.ms.toFixed(2),
    "Phase 3 ms": after.ms.toFixed(2),
    speedup: `${(before.ms / after.ms).toFixed(2)}x`,
    "Canvas calls before": before.calls,
    "Canvas calls after": after.calls,
    reduction: before.calls ? `${((before.calls - after.calls) / before.calls * 100).toFixed(1)}%` : "0.0%",
  };
});

console.table(rows);
createjs.performance.phase2 = createjs.performance.phase3 = true;
createjs.Tween.removeAllTweens();
createjs.Ticker.reset();
