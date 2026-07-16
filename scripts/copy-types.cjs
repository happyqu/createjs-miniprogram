const { copyFileSync } = require("node:fs");

copyFileSync("types/index.d.ts", "dist/index.d.ts");
copyFileSync("types/lite.d.ts", "dist/lite.d.ts");
copyFileSync("types/lite-animation.d.ts", "dist/lite-animation.d.ts");
copyFileSync("types/lite-filters.d.ts", "dist/lite-filters.d.ts");
copyFileSync("types/tweenjs.d.ts", "dist/tweenjs.d.ts");
