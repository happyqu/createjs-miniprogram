const { gzipSync } = require("node:zlib");
const { readFileSync, readdirSync } = require("node:fs");

const enforce = process.argv.includes("--check");
const limits = {
  "index.js": 115000,
  "index.mjs": 115000,
  "core.js": 90000,
  "core.mjs": 90000,
};

const rows = readdirSync("dist")
  .filter((name) => /\.(?:m?js)$/.test(name))
  .sort()
  .map((name) => {
    const source = readFileSync(`dist/${name}`);
    return { name, bytes: source.length, gzip: gzipSync(source).length };
  });

console.log("\nBundle size report");
console.table(rows);

if (enforce) {
  const failures = rows.filter(({ name, bytes }) => limits[name] && bytes > limits[name]);
  if (failures.length) {
    for (const { name, bytes } of failures) {
      console.error(`${name}: ${bytes} bytes exceeds ${limits[name]} byte limit`);
    }
    process.exitCode = 1;
  }
}
