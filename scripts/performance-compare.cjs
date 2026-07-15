const { execFileSync } = require("node:child_process");
const { existsSync, mkdtempSync, mkdirSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");

const root = resolve(__dirname, "..");
const baselineArchive = join(root, "happyqu-createjs-miniprogram-1.0.1.tgz");
if (!existsSync(baselineArchive)) {
  throw new Error(`Missing v1.0.1 baseline archive: ${baselineArchive}`);
}

let activeStats = null;

function makeStats() {
  return { drawCalls: 0, mainDrawCalls: 0, clearCalls: 0, clearPixels: 0, saves: 0, transforms: 0 };
}

function resetStats(stats) {
  for (const key of Object.keys(stats)) stats[key] = 0;
}

function createCanvas(width = 1, height = 1, stats = activeStats || makeStats(), main = false) {
  const canvas = { width, height, _invalid: false };
  const stack = [];
  const context = {
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    drawImage() {
      stats.drawCalls++;
      if (main) stats.mainDrawCalls++;
    },
    clearRect(x, y, w, h) {
      if (main) {
        stats.clearCalls++;
        stats.clearPixels += Math.max(0, w) * Math.max(0, h);
      }
    },
    save() {
      stats.saves++;
      stack.push([this.globalAlpha, this.globalCompositeOperation]);
    },
    restore() {
      const state = stack.pop();
      if (state) [this.globalAlpha, this.globalCompositeOperation] = state;
    },
    setTransform() {},
    transform() { stats.transforms++; },
    translate() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    rect() {},
    clip() {},
    fill() {},
    stroke() {},
    fillRect() {},
    arc() {},
    arcTo() {},
    bezierCurveTo() {},
    quadraticCurveTo() {},
    createPattern() { return {}; },
    createLinearGradient() { return { addColorStop() {} }; },
    createRadialGradient() { return { addColorStop() {} }; },
    setLineDash() {},
    measureText(text) { return { width: String(text).length * 8 }; },
    fillText() {},
    strokeText() {},
  };
  canvas.getContext = () => context;
  return canvas;
}

global.wx = {
  createOffscreenCanvas({ width, height }) {
    return createCanvas(width, height, activeStats || makeStats(), false);
  },
};

function extractBaseline() {
  const tempRoot = mkdtempSync(join(tmpdir(), "createjs-v101-"));
  const packageDir = join(tempRoot, "node_modules", "@happyqu", "createjs-miniprogram");
  mkdirSync(packageDir, { recursive: true });
  execFileSync("tar", ["-xzf", baselineArchive, "-C", packageDir, "--strip-components=1"]);
  return { tempRoot, packageDir };
}

function loadLibraries(packageDir) {
  const createjs = require(join(packageDir, "dist", "index.js"));
  require(join(packageDir, "dist", "tweenjs.js"));
  return createjs;
}

const image = { width: 8, height: 8, naturalWidth: 8, naturalHeight: 8 };

function makeStage(createjs, stats, width = 1000, height = 1000) {
  const stage = new createjs.Stage(createCanvas(width, height, stats, true));
  stage.tickOnUpdate = true;
  return stage;
}

const scenarios = [
  {
    name: "1000 static Bitmap",
    warmup: 70,
    build(createjs, stats) {
      const stage = makeStage(createjs, stats);
      const group = new createjs.Container();
      for (let i = 0; i < 1000; i++) {
        const bitmap = new createjs.Bitmap(image);
        bitmap.x = (i % 50) * (1000 / 50);
        bitmap.y = ((i / 50) | 0) * (1000 / 20);
        group.addChild(bitmap);
      }
      stage.addChild(group);
      return { stage, step() {} };
    },
  },
  {
    name: "100 moving Bitmap",
    warmup: 8,
    build(createjs, stats) {
      const stage = makeStage(createjs, stats);
      for (let i = 0; i < 100; i++) {
        const bitmap = new createjs.Bitmap(image);
        bitmap.x = (i % 10) * (1000 / 10);
        bitmap.y = ((i / 10) | 0) * (1000 / 10);
        stage.addChild(bitmap);
        const startX = bitmap.x;
        createjs.Tween.get(bitmap, { loop: -1 })
          .to({ x: Math.min(1000 - 8, startX + 18) }, 500 + i * 2)
          .to({ x: startX }, 500 + i * 2);
      }
      return { stage, step() { createjs.Tween.tick(16.6667, false); } };
    },
  },
  {
    name: "100 MovieClip x 10 frames",
    warmup: 8,
    build(createjs, stats) {
      const stage = makeStage(createjs, stats);
      for (let i = 0; i < 100; i++) {
        const clip = new createjs.MovieClip({ loop: -1 });
        const bitmap = new createjs.Bitmap(image);
        clip.timeline.addTween(createjs.Tween.get(bitmap).to({ x: 18 }, 5).to({ x: 0 }, 5));
        clip.setBounds(0, 0, 26, 10);
        clip.x = (i % 10) * (1000 / 10);
        clip.y = ((i / 10) | 0) * (1000 / 10);
        stage.addChild(clip);
      }
      return { stage, step() {} };
    },
  },
];

function elapsedMs(start) {
  return Number(process.hrtime.bigint() - start) / 1e6;
}

function runScenario(createjs, scenario, iterations) {
  const stats = makeStats();
  activeStats = stats;
  const test = scenario.build(createjs, stats);
  for (let frame = 0; frame < scenario.warmup; frame++) {
    test.step(frame);
    test.stage.update({ delta: 16.6667 });
  }
  resetStats(stats);
  const start = process.hrtime.bigint();
  for (let frame = 0; frame < iterations; frame++) {
    test.step(frame);
    test.stage.update({ delta: 16.6667 });
  }
  const result = { ms: elapsedMs(start), ...stats };
  createjs.Tween.removeAllTweens();
  test.stage.removeAllChildren();
  return result;
}

function percentReduction(before, after) {
  return before ? `${((before - after) / before * 100).toFixed(1)}%` : "0.0%";
}

function formatNumber(value) {
  return Math.round(value).toLocaleString("en-US");
}

function main() {
  const iterations = Number(process.env.BENCHMARK_FRAMES) || 120;
  const extracted = extractBaseline();
  try {
    const baseline = loadLibraries(extracted.packageDir);
    const optimized = loadLibraries(root);
    const hasOptimizationFeatures = Boolean(
      optimized.performance || optimized.Matrix2DPool || optimized.DirtyRegionManager,
    );
    if (!hasOptimizationFeatures) {
      const rows = [];
      const details = [];
      for (const scenario of scenarios) {
        const result = runScenario(optimized, scenario, iterations);
        rows.push({
          scenario: scenario.name,
          "total ms": result.ms.toFixed(2),
          "ms / frame": (result.ms / iterations).toFixed(3),
          "draws / frame": formatNumber(result.mainDrawCalls / iterations),
          "clear MP / frame": (result.clearPixels / iterations / 1e6).toFixed(3),
        });
        details.push({ scenario: scenario.name, baseline: result });
      }
      console.log(`\nCreateJS v1.0.1 baseline (${iterations} measured frames)`);
      console.table(rows);
      console.log("No Phase 1/2 feature markers found. Run this same command on the optimized build to get an automatic A/B comparison.");
      if (process.argv.includes("--json")) console.log(JSON.stringify(details, null, 2));
      baseline.Ticker.reset();
      optimized.Ticker.reset();
      return;
    }
    const rows = [];
    const details = [];
    for (const scenario of scenarios) {
      const before = runScenario(baseline, scenario, iterations);
      const after = runScenario(optimized, scenario, iterations);
      rows.push({
        scenario: scenario.name,
        "v1.0.1 ms": before.ms.toFixed(2),
        "optimized ms": after.ms.toFixed(2),
        speedup: `${(before.ms / after.ms).toFixed(2)}x`,
        "draws v1.0.1": formatNumber(before.mainDrawCalls),
        "draws optimized": formatNumber(after.mainDrawCalls),
        "draw reduction": percentReduction(before.mainDrawCalls, after.mainDrawCalls),
        "clear reduction": percentReduction(before.clearPixels, after.clearPixels),
      });
      details.push({ scenario: scenario.name, baseline: before, optimized: after });
    }
    console.log(`\nCreateJS v1.0.1 vs optimized (${iterations} measured frames)`);
    console.table(rows);
    console.log("Times measure JavaScript with a mocked Canvas2D context; draw/clear reductions better predict device-side gains.");
    if (process.argv.includes("--json")) console.log(JSON.stringify(details, null, 2));
    baseline.Ticker.reset();
    optimized.Ticker.reset();
  } finally {
    activeStats = null;
    rmSync(extracted.tempRoot, { recursive: true, force: true });
  }
}

main();
