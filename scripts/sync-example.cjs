const { copyFileSync, mkdirSync, readFileSync, writeFileSync } = require("node:fs");

const target = "example/libs/createjs-miniprogram";
mkdirSync(target, { recursive: true });
copyFileSync("dist/core.js", `${target}/easeljs.js`);
for (const name of ["text", "movieclip"]) {
  const addon = readFileSync(`dist/${name}.js`, "utf8").replace(
    'require("@happyqu/createjs-miniprogram/core")',
    'require("./easeljs.js")',
  );
  writeFileSync(`${target}/${name}.js`, addon);
}
const tweenjs = readFileSync("dist/tweenjs.js", "utf8").replace(
  'require("@happyqu/createjs-miniprogram")',
  'require("./easeljs.js")',
);
writeFileSync(`${target}/tweenjs.js`, tweenjs);
