const { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require("node:fs");

const target = "example/libs/createjs-miniprogram";
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
copyFileSync("dist/lite.js", `${target}/easeljs.js`);
const animation = readFileSync("dist/lite-animation.js", "utf8").replaceAll(
  'require("@happyqu/createjs-miniprogram/lite")',
  'require("./easeljs.js")',
);
writeFileSync(`${target}/animation.js`, animation);

for (const name of ["animation"]) {
  const source = readFileSync(`${target}/${name}.js`, "utf8");
  if (source.includes("@happyqu/createjs-miniprogram")) {
    throw new Error(`${target}/${name}.js contains an unresolved package import`);
  }
}
