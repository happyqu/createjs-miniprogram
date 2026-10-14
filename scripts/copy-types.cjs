const { copyFileSync, readFileSync, writeFileSync } = require("node:fs");

copyFileSync("types/index.d.ts", "dist/index.d.ts");
copyFileSync("types/lite.d.ts", "dist/lite.d.ts");
copyFileSync("types/lite-animation.d.ts", "dist/lite-animation.d.ts");
copyFileSync("types/lite-filters.d.ts", "dist/lite-filters.d.ts");
copyFileSync("types/tweenjs.d.ts", "dist/tweenjs.d.ts");

// NodeNext distinguishes CommonJS export= from ESM default exports.
for (const name of ['index','lite','lite-animation','lite-filters','tweenjs']) {
  const source = readFileSync(`types/${name}.d.ts`, 'utf8').replace('"./index"', '"./index.mjs"');
  writeFileSync(`dist/${name}.d.mts`, source);
  const namespace = name === 'index'
    ? 'declare namespace createjs { type CreateJS = import("./index.mjs").CreateJS; type CreateJSCore = import("./index.mjs").CreateJSCore; }\n'
    : name === 'lite' ? 'declare namespace createjs { type CreateJSLite = import("./lite.mjs").CreateJSLite; }\n' : '';
  writeFileSync(`dist/${name}.d.cts`,
    `import type esm from "./${name}.mjs";\ndeclare const createjs: typeof esm;\n${namespace}export = createjs;\n`);
}
