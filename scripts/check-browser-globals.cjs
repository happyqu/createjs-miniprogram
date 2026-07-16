const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");

const forbiddenGlobals = [
  "window",
  "document",
  "navigator",
  "Image",
  "WebGLTexture",
  "HTMLCanvasElement",
  "HTMLElement",
  "HTMLImageElement",
  "HTMLVideoElement",
];

for (const file of readdirSync("dist")
  .filter((name) => /\.(?:m?js)$/.test(name))
  .map((name) => `dist/${name}`)) {
  const source = readFileSync(file, "utf8");
  for (const name of forbiddenGlobals) {
    assert.doesNotMatch(
      source,
      new RegExp(`\\b${name}\\b`),
      `${file} contains unsupported browser global: ${name}`,
    );
  }
  assert.doesNotMatch(
    source,
    /typeof\s+performance\b|globalThis\.performance\b|\bperformance\.(?:now|memory)\b/,
    `${file} contains unsupported browser performance access`,
  );
}

console.log("No unsupported browser globals found in published bundles");
