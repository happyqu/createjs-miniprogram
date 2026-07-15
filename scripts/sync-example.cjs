const { copyFileSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");

const target = "example/libs/createjs-miniprogram";
mkdirSync(target, { recursive: true });
copyFileSync("dist/index.js", `${target}/easeljs.js`);
const tweenjs = readFileSync("dist/tweenjs.js", "utf8").replace(
  'require("@happyqu/createjs-miniprogram")',
  'require("./easeljs.js")',
);
writeFileSync(`${target}/tweenjs.js`, tweenjs);
