const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const forbiddenGlobals = [
  "window",
  "document",
  "navigator",
  "performance",
  "Image",
  "WebGLTexture",
  "HTMLCanvasElement",
  "HTMLElement",
  "HTMLImageElement",
  "HTMLVideoElement",
];

for (const file of [
  "dist/index.mjs",
  "dist/index.js",
  "dist/tweenjs.mjs",
  "dist/tweenjs.js",
]) {
  const source = readFileSync(file, "utf8");
  for (const name of forbiddenGlobals) {
    assert.doesNotMatch(
      source,
      new RegExp(`\\b${name}\\b`),
      `${file} contains unsupported browser global: ${name}`,
    );
  }
}

console.log("No unsupported browser globals found in published bundles");
