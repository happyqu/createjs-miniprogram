const assert = require("node:assert/strict");
const createjs = require("../dist/index.js");

function imageData(width, height, values) {
  return { width, height, data: new Uint8ClampedArray(values) };
}

let pixels = imageData(2, 1, [10, 20, 30, 40, 200, 150, 100, 50]);
assert.equal(new createjs.ColorFilter(.5, 2, 1, 1, 5, -5, 10, 20)._applyFilter(pixels), true);
assert.deepEqual([...pixels.data], [10, 35, 40, 60, 105, 255, 110, 70]);

const matrix = [
  1, 0, 0, 0, 10,
  0, 1, 0, 0, 20,
  0, 0, 1, 0, 30,
  0, 0, 0, .5, 40,
];
pixels = imageData(2, 1, [10, 20, 30, 40, 200, 150, 100, 50]);
assert.equal(new createjs.ColorMatrixFilter(matrix)._applyFilter(pixels), true);
assert.deepEqual([...pixels.data], [20, 40, 60, 60, 210, 170, 130, 65]);

pixels = imageData(3, 3, [
  255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 255, 0, 255, 0, 0, 0, 0,
  0, 0, 255, 128, 0, 0, 0, 0, 255, 255, 255, 255,
]);
assert.equal(new createjs.BlurFilter(2, 2, 1)._applyFilter(pixels), true);
assert.deepEqual([...pixels.data], [
  204, 51, 0, 141, 168, 84, 0, 85, 0, 255, 0, 28,
  126, 63, 126, 113, 144, 144, 144, 99, 168, 255, 168, 85,
  0, 84, 255, 85, 126, 192, 255, 113, 204, 255, 204, 141,
]);

const alphaMap = {
  width: 1,
  height: 1,
  getContext() {
    return { getImageData: () => imageData(1, 1, [90, 0, 0, 77]) };
  },
};
pixels = imageData(2, 1, [1, 2, 3, 4, 5, 6, 7, 8]);
assert.equal(new createjs.AlphaMapFilter(alphaMap)._applyFilter(pixels), true);
assert.deepEqual([...pixels.data], [1, 2, 3, 90, 5, 6, 7, 90]);

const mask = { width: 2, height: 1 };
const calls = [];
const context = {
  canvas: { width: 2, height: 1 },
  save: () => calls.push("save"),
  drawImage: (...args) => calls.push(["drawImage", ...args]),
  restore: () => calls.push("restore"),
};
assert.equal(new createjs.AlphaMaskFilter(mask).applyFilter(context, 0, 0, 2, 1), true);
assert.equal(context.globalCompositeOperation, "destination-in");
assert.deepEqual(calls, ["save", ["drawImage", mask, 0, 0, 2, 1, 0, 0, 2, 1], "restore"]);

console.log("Canvas2D filter pixel regression tests passed");
