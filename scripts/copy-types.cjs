const { copyFileSync } = require("node:fs");

copyFileSync("types/index.d.ts", "dist/index.d.ts");
copyFileSync("types/tweenjs.d.ts", "dist/tweenjs.d.ts");
