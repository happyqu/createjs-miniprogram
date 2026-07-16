const { copyFileSync } = require("node:fs");

copyFileSync("types/index.d.ts", "dist/index.d.ts");
copyFileSync("types/core.d.ts", "dist/core.d.ts");
for (const name of ["text", "movieclip", "filters", "builder", "ui"]) {
  copyFileSync(`types/${name}.d.ts`, `dist/${name}.d.ts`);
}
copyFileSync("types/tweenjs.d.ts", "dist/tweenjs.d.ts");
